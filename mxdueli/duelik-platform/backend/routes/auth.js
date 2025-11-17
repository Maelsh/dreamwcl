const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { 
    validateRegister, 
    validateLogin, 
    validateForgotPassword, 
    validateResetPassword,
    validateChangePassword,
    handleValidationErrors 
} = require('../middleware/validateRequest');
const { 
    authenticate, 
    optionalAuth, 
    createSendToken,
    verifySocketToken 
} = require('../middleware/auth');
const logger = require('../config/logger');
const sendEmail = require('../utils/email');

const router = express.Router();

// Helper function to generate password reset token
const createPasswordResetToken = () => {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    return { resetToken, hashedResetToken };
};

// =========================================
// REGISTRATION
// =========================================

router.post('/register', validateRegister, asyncHandler(async (req, res, next) => {
    const { fullName, username, email, password, userType } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (existingUser) {
        if (existingUser.email === email) {
            return next(new ApiError('البريد الإلكتروني مستخدم بالفعل', 400));
        }
        if (existingUser.username === username) {
            return next(new ApiError('اسم المستخدم مستخدم بالفعل', 400));
        }
    }

    // Create new user
    const newUser = await User.create({
        fullName,
        username,
        email,
        password,
        userType: userType || 'viewer'
    });

    // Send welcome email
    try {
        await sendEmail({
            to: email,
            subject: 'مرحباً بك في منصة Dueli',
            template: 'welcome',
            data: {
                name: fullName,
                username,
                loginUrl: `${process.env.FRONTEND_URL}/auth/login`
            }
        });
    } catch (emailError) {
        logger.error('Failed to send welcome email:', emailError);
    }

    // Generate tokens and send response
    createSendToken(newUser, 201, res);

    // Log registration
    logger.info('New user registered', {
        userId: newUser._id,
        username,
        email,
        userType: newUser.userType,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
}));

// =========================================
// LOGIN
// =========================================

router.post('/login', validateLogin, asyncHandler(async (req, res, next) => {
    const { email, password, rememberMe } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
        // Log failed login attempt
        logger.securityEvent('failed_login_attempt', null, req.ip, {
            email,
            userAgent: req.get('User-Agent'),
            reason: 'invalid_credentials'
        });
        
        return next(new ApiError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401));
    }

    // Check if user is banned
    if (user.isBanned) {
        logger.securityEvent('login_attempt_banned_user', user._id, req.ip, {
            banReason: user.banReason,
            banExpiresAt: user.banExpiresAt
        });
        return next(new ApiError('تم حظر هذا الحساب', 403));
    }

    // Check if account is locked
    if (user.isLocked()) {
        logger.securityEvent('login_attempt_locked_account', user._id, req.ip);
        return next(new ApiError('تم قفل الحساب مؤقتاً. يرجى المحاولة لاحقاً', 423));
    }

    // Update last login info
    user.security.lastLoginAt = new Date();
    user.security.lastLoginIp = req.ip;
    user.lastActivityAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate tokens and send response
    const tokenOptions = rememberMe ? { expiresIn: '30d' } : { expiresIn: '1d' };
    
    if (rememberMe) {
        // Extend token expiration for "Remember Me"
        process.env.JWT_EXPIRES_IN = '30d';
    }

    createSendToken(user, 200, res);

    // Log successful login
    logger.info('User logged in successfully', {
        userId: user._id,
        username: user.username,
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        rememberMe
    });
}));

// =========================================
// LOGOUT
// =========================================

router.post('/logout', authenticate, asyncHandler(async (req, res) => {
    // Clear JWT cookie
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });

    // Remove current refresh token from user's tokens
    const currentToken = req.headers.authorization?.split(' ')[1];
    if (currentToken) {
        try {
            const decoded = jwt.verify(currentToken, process.env.JWT_SECRET);
            await User.findByIdAndUpdate(req.userId, {
                $pull: {
                    'security.refreshTokens': {
                        token: currentToken
                    }
                }
            });
        } catch (error) {
            logger.error('Failed to remove refresh token during logout:', error);
        }
    }

    res.status(200).json({
        success: true,
        status: 'success',
        message: 'تم تسجيل الخروج بنجاح'
    });

    // Log logout
    logger.info('User logged out', {
        userId: req.userId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
}));

// =========================================
// REFRESH TOKEN
// =========================================

router.post('/refresh-token', optionalAuth, asyncHandler(async (req, res, next) => {
    let token;
    
    // Check for token in header or cookie
    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.refreshToken) {
        token = req.cookies.refreshToken;
    }

    if (!token) {
        return next(new ApiError('رمز التحديث مطلوب', 401));
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        
        // Check if it's a refresh token
        if (decoded.type !== 'refresh') {
            return next(new ApiError('رمز غير صحيح', 401));
        }

        // Find user and verify refresh token exists
        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new ApiError('المستخدم غير موجود', 401));
        }

        // Check if refresh token exists in user's tokens
        const refreshTokenExists = user.security.refreshTokens.some(
            rt => rt.token === token && rt.expiresAt > new Date()
        );

        if (!refreshTokenExists) {
            return next(new ApiError('رمز التحديث غير صحيح أو منتهي الصلاحية', 401));
        }

        // Remove old refresh token
        await User.findByIdAndUpdate(decoded.id, {
            $pull: {
                'security.refreshTokens': { token }
            }
        });

        // Generate new tokens
        const newAccessToken = user.generateToken('access');
        const newRefreshToken = user.generateToken('refresh');

        // Add new refresh token to user
        user.security.refreshTokens.push({
            token: newRefreshToken,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        await user.save({ validateBeforeSave: false });

        // Set new refresh token cookie
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            success: true,
            status: 'success',
            token: newAccessToken,
            refreshToken: newRefreshToken
        });

        logger.info('Tokens refreshed successfully', {
            userId: user._id,
            ip: req.ip
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new ApiError('انتهت صلاحية رمز التحديث', 401));
        } else if (error.name === 'JsonWebTokenError') {
            return next(new ApiError('رمز التحديث غير صحيح', 401));
        } else {
            return next(error);
        }
    }
}));

// =========================================
// FORGOT PASSWORD
// =========================================

router.post('/forgot-password', validateForgotPassword, asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    // Get user based on email
    const user = await User.findOne({ email });
    if (!user) {
        // Don't reveal if email exists or not for security
        return res.status(200).json({
            success: true,
            status: 'success',
            message: 'إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط إعادة تعيين كلمة المرور'
        });
    }

    // Generate reset token
    const { resetToken, hashedResetToken } = createPasswordResetToken();

    // Save hashed token and expiration (1 hour from now)
    user.security.passwordResetToken = hashedResetToken;
    user.security.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    try {
        // Send email with reset link
        const resetURL = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
        
        await sendEmail({
            to: email,
            subject: 'إعادة تعيين كلمة المرور - منصة Dueli',
            template: 'passwordReset',
            data: {
                name: user.fullName,
                resetURL,
                expiresIn: 'ساعة واحدة'
            }
        });

        logger.info('Password reset email sent', {
            userId: user._id,
            email,
            ip: req.ip
        });

    } catch (emailError) {
        // If email sending fails, clear the reset token
        user.security.passwordResetToken = undefined;
        user.security.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        logger.error('Failed to send password reset email:', emailError);
        return next(new ApiError('حدث خطأ أثناء إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى', 500));
    }

    res.status(200).json({
        success: true,
        status: 'success',
        message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
    });
}));

// =========================================
// RESET PASSWORD
// =========================================

router.patch('/reset-password/:token', validateResetPassword, asyncHandler(async (req, res, next) => {
    const { token } = req.params;
    const { password } = req.body;

    // Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    const user = await User.findOne({
        'security.passwordResetToken': hashedToken,
        'security.passwordResetExpires': { $gt: new Date() }
    });

    if (!user) {
        return next(new ApiError('رمز إعادة التعيين غير صحيح أو منتهي الصلاحية', 400));
    }

    // Set the new password
    user.password = password;
    user.security.passwordResetToken = undefined;
    user.security.passwordResetExpires = undefined;
    user.security.passwordChangedAt = new Date();
    
    // Clear all refresh tokens to force re-login
    user.security.refreshTokens = [];
    
    await user.save();

    // Log password reset
    logger.info('Password reset successfully', {
        userId: user._id,
        ip: req.ip
    });

    // Create new token and log the user in
    createSendToken(user, 200, res);

    res.status(200).json({
        success: true,
        status: 'success',
        message: 'تم إعادة تعيين كلمة المرور بنجاح'
    });
}));

// =========================================
// CHANGE PASSWORD (Authenticated)
// =========================================

router.patch('/change-password', authenticate, validateChangePassword, asyncHandler(async (req, res, next) => {
    const { currentPassword, password } = req.body;

    // Get user with password field
    const user = await User.findById(req.userId).select('+password');

    // Check if current password is correct
    if (!(await user.matchPassword(currentPassword))) {
        return next(new ApiError('كلمة المرور الحالية غير صحيحة', 400));
    }

    // Update password
    user.password = password;
    user.security.passwordChangedAt = new Date();
    
    // Clear all refresh tokens to force re-login on all devices
    user.security.refreshTokens = [];
    
    await user.save();

    // Log password change
    logger.info('Password changed successfully', {
        userId: user._id,
        ip: req.ip
    });

    res.status(200).json({
        success: true,
        status: 'success',
        message: 'تم تغيير كلمة المرور بنجاح'
    });
}));

// =========================================
// GET CURRENT USER
// =========================================

router.get('/me', authenticate, asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId).select('-password');

    res.status(200).json({
        success: true,
        status: 'success',
        data: {
            user
        }
    });
}));

// =========================================
// SOCKET.IO AUTHENTICATION
// =========================================

router.post('/socket-auth', asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'رمز المصادقة مطلوب'
        });
    }

    try {
        const { user } = await verifySocketToken(token);
        
        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                userType: user.userType,
                avatar: user.avatar
            }
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'رمز المصادقة غير صحيح'
        });
    }
}));

// =========================================
// VERIFY EMAIL
// =========================================

router.post('/verify-email/:token', asyncHandler(async (req, res, next) => {
    const { token } = req.params;

    // Hash the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    // Get user by token
    const user = await User.findOne({
        'verification.emailVerificationToken': hashedToken,
        'verification.emailVerificationExpires': { $gt: Date.now() }
    });

    if (!user) {
        return next(new ApiError('رمز التحقق غير صحيح أو منتهي الصلاحية', 400));
    }

    // Mark email as verified
    user.isVerified = true;
    user.verification.emailVerifiedAt = new Date();
    user.verification.emailVerificationToken = undefined;
    user.verification.emailVerificationExpires = undefined;
    
    await user.save();

    res.status(200).json({
        success: true,
        status: 'success',
        message: 'تم تأكيد البريد الإلكتروني بنجاح'
    });
}));

// =========================================
// RESEND VERIFICATION EMAIL
// =========================================

router.post('/resend-verification', authenticate, asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.userId);

    if (user.isVerified) {
        return next(new ApiError('البريد الإلكتروني مُؤكد بالفعل', 400));
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    // Save token
    user.verification.emailVerificationToken = hashedVerificationToken;
    user.verification.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save({ validateBeforeSave: false });

    try {
        // Send verification email
        const verificationURL = `${process.env.FRONTEND_URL}/auth/verify-email/${verificationToken}`;
        
        await sendEmail({
            to: user.email,
            subject: 'تأكيد البريد الإلكتروني - منصة Dueli',
            template: 'emailVerification',
            data: {
                name: user.fullName,
                verificationURL,
                expiresIn: '24 ساعة'
            }
        });

        res.status(200).json({
            success: true,
            status: 'success',
            message: 'تم إرسال رابط التأكيد إلى بريدك الإلكتروني'
        });

        logger.info('Verification email resent', {
            userId: user._id,
            email: user.email
        });

    } catch (emailError) {
        logger.error('Failed to send verification email:', emailError);
        return next(new ApiError('حدث خطأ أثناء إرسال البريد الإلكتروني', 500));
    }
}));

module.exports = router;