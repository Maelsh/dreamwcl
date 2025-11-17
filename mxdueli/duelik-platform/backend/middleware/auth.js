const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const { ApiError, asyncHandler } = require('./errorHandler');
const logger = require('../config/logger');

// Generate JWT token
const signToken = (id, userType) => {
    return jwt.sign(
        { id, userType },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
};

// Generate refresh token
const signRefreshToken = (id, userType) => {
    return jwt.sign(
        { id, userType, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
};

// Create and send token
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id, user.userType);
    const refreshToken = signRefreshToken(user._id, user.userType);
    
    // Calculate token expiration date
    const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
    const expiresInMs = expiresIn === '1d' ? 24 * 60 * 60 * 1000 : 1 * 60 * 60 * 1000;
    const cookieExpires = new Date(Date.now() + expiresInMs);

    // Set cookie options
    const cookieOptions = {
        expires: cookieExpires,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    // Set cookie
    res.cookie('jwt', token, cookieOptions);

    // Remove password from output
    user.password = undefined;

    // Store refresh token in user document
    user.security.refreshTokens.push({
        token: refreshToken,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'unknown'
    });

    // Save user to update refresh tokens
    user.save({ validateBeforeSave: false });

    // Log token generation
    logger.info(`JWT tokens generated for user ${user._id}`, {
        userId: user._id,
        userType: user.userType,
        tokenType: 'access_refresh'
    });

    res.status(statusCode).json({
        success: true,
        status: 'success',
        message: 'تم تسجيل الدخول بنجاح',
        token,
        refreshToken,
        data: {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                userType: user.userType,
                avatar: user.avatar,
                isVerified: user.isVerified
            }
        }
    });
};

// Verify JWT token
const verifyToken = async (token, secret) => {
    try {
        return await promisify(jwt.verify)(token, secret);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new ApiError('انتهت صلاحية رمز المصادقة. يرجى إعادة تسجيل الدخول', 401);
        } else if (error.name === 'JsonWebTokenError') {
            throw new ApiError('رمز المصادقة غير صحيح', 401);
        } else {
            throw new ApiError('خطأ في التحقق من رمز المصادقة', 401);
        }
    }
};

// Authenticate user middleware
const authenticate = asyncHandler(async (req, res, next) => {
    // 1) Getting token and check if it's there
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new ApiError('يجب تسجيل الدخول للوصول إلى هذا المورد', 401));
    }

    // 2) Verify token
    const decoded = await verifyToken(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id).select('+password');
    if (!currentUser) {
        logger.warn(`Authentication failed: User ${decoded.id} not found`);
        return next(new ApiError('المستخدم المرتبط برمز المصادقة لم يعد موجوداً', 401));
    }

    // 4) Check if user is banned
    if (currentUser.isBanned) {
        logger.warn(`Authentication failed: User ${currentUser._id} is banned`, {
            banReason: currentUser.banReason,
            banExpiresAt: currentUser.banExpiresAt
        });
        return next(new ApiError('تم حظر هذا الحساب', 403));
    }

    // 5) Check if user account is active
    if (!currentUser.isActive) {
        logger.warn(`Authentication failed: User ${currentUser._id} account is inactive`);
        return next(new ApiError('تم تعطيل هذا الحساب', 403));
    }

    // 6) Check if password changed after the token was issued
    if (currentUser.security.passwordChangedAt) {
        const changedTimestamp = parseInt(
            currentUser.security.passwordChangedAt.getTime() / 1000,
            10
        );
        
        if (decoded.iat < changedTimestamp) {
            logger.warn(`Authentication failed: Password changed for user ${currentUser._id}`);
            return next(new ApiError('تم تغيير كلمة المرور مؤخراً. يرجى إعادة تسجيل الدخول', 401));
        }
    }

    // 7) Update last activity
    currentUser.lastActivityAt = new Date();
    await currentUser.save({ validateBeforeSave: false });

    // Grant access to protected route
    req.user = currentUser;
    req.userId = currentUser._id;
    next();
});

// Authentication middleware with optional token
const optionalAuth = asyncHandler(async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = await verifyToken(token, process.env.JWT_SECRET);
        const currentUser = await User.findById(decoded.id);

        if (currentUser && !currentUser.isBanned && currentUser.isActive) {
            req.user = currentUser;
            req.userId = currentUser._id;
            
            // Update last activity
            currentUser.lastActivityAt = new Date();
            await currentUser.save({ validateBeforeSave: false });
        } else {
            req.user = null;
        }
    } catch (error) {
        // If token is invalid, set user to null and continue
        req.user = null;
    }
    
    next();
});

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError('يجب تسجيل الدخول للوصول إلى هذا المورد', 401));
        }

        if (!roles.includes(req.user.userType)) {
            logger.warn(`Authorization failed: User ${req.user._id} with role ${req.user.userType} attempted to access resource requiring roles: ${roles.join(', ')}`);
            return next(new ApiError('ليس لديك صلاحية للوصول إلى هذا المورد', 403));
        }

        next();
    };
};

// Admin only middleware
const adminOnly = (req, res, next) => {
    if (!req.user) {
        return next(new ApiError('يجب تسجيل الدخول', 401));
    }

    if (req.user.userType !== 'admin' && req.user.userType !== 'super_admin') {
        return next(new ApiError('هذه العملية مقتصرة على المشرفين فقط', 403));
    }

    next();
};

// Moderator or Admin middleware
const moderatorOrAdmin = (req, res, next) => {
    if (!req.user) {
        return next(new ApiError('يجب تسجيل الدخول', 401));
    }

    const allowedRoles = ['admin', 'super_admin', 'moderator'];
    if (!allowedRoles.includes(req.user.userType)) {
        return next(new ApiError('هذه العملية مقتصرة على المشرفين والمديرين فقط', 403));
    }

    next();
};

// Check if user owns resource or is admin
const checkOwnership = (resourceField = 'createdBy') => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError('يجب تسجيل الدخول', 401));
        }

        // Admin and super_admin can access everything
        if (req.user.userType === 'admin' || req.user.userType === 'super_admin') {
            return next();
        }

        // For other users, check ownership
        // This middleware assumes the resource is loaded with populate
        // and available as req.resource or we need to extract userId from params
        const resourceUserId = req.resource?.[resourceField] || req.params.userId;
        
        if (!resourceUserId) {
            return next(new ApiError('لا يمكن تحديد مالك المورد', 400));
        }

        if (req.userId.toString() !== resourceUserId.toString()) {
            logger.warn(`Ownership check failed: User ${req.userId} attempted to access resource owned by ${resourceUserId}`);
            return next(new ApiError('ليس لديك صلاحية للوصول إلى هذا المورد', 403));
        }

        next();
    };
};

// Check if user is verified
const requireVerification = (req, res, next) => {
    if (!req.user) {
        return next(new ApiError('يجب تسجيل الدخول', 401));
    }

    if (!req.user.isVerified) {
        return next(new ApiError('يجب تأكيد البريد الإلكتروني للوصول إلى هذه الميزة', 403));
    }

    next();
};

// Check account status
const checkAccountStatus = async (req, res, next) => {
    if (!req.user) {
        return next(new ApiError('يجب تسجيل الدخول', 401));
    }

    // Check if account is locked
    if (req.user.isLocked()) {
        return next(new ApiError('تم قفل الحساب مؤقتاً. يرجى المحاولة لاحقاً', 423));
    }

    // Check if ban has expired
    if (req.user.isBanned && req.user.banExpiresAt && new Date() > req.user.banExpiresAt) {
        // Auto-unban expired ban
        req.user.isBanned = false;
        req.user.banExpiresAt = null;
        req.user.banReason = '';
        await req.user.save();
    }

    if (req.user.isBanned) {
        return next(new ApiError('تم حظر هذا الحساب', 403));
    }

    next();
};

// Rate limiting by user
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();

    return (req, res, next) => {
        if (!req.user) {
            return next();
        }

        const userId = req.userId.toString();
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean old requests
        if (requests.has(userId)) {
            const userRequests = requests.get(userId).filter(time => time > windowStart);
            requests.set(userId, userRequests);
        }

        // Check current request count
        const userRequests = requests.get(userId) || [];
        
        if (userRequests.length >= maxRequests) {
            logger.warn(`Rate limit exceeded for user ${userId}`, {
                userId,
                requestCount: userRequests.length,
                limit: maxRequests,
                windowMs
            });
            
            return res.status(429).json({
                success: false,
                status: 'error',
                message: 'تم تجاوز الحد المسموح من الطلبات',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        // Add current request
        userRequests.push(now);
        requests.set(userId, userRequests);

        next();
    };
};

// JWT verification for Socket.IO
const verifySocketToken = async (token) => {
    try {
        const decoded = await verifyToken(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user || user.isBanned || !user.isActive) {
            throw new ApiError('Invalid user', 401);
        }

        return { user, decoded };
    } catch (error) {
        throw new ApiError('Socket authentication failed', 401);
    }
};

// Password change validation
const validatePasswordChange = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return next(new ApiError('يجب توفير كلمة المرور الحالية والجديدة', 400));
    }

    if (newPassword.length < 6) {
        return next(new ApiError('يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل', 400));
    }

    if (currentPassword === newPassword) {
        return next(new ApiError('يجب أن تكون كلمة المرور الجديدة مختلفة عن الحالية', 400));
    }

    // Check if user has password history (implement based on your requirements)
    // This would check against the last N passwords to prevent reuse

    next();
});

module.exports = {
    signToken,
    signRefreshToken,
    createSendToken,
    authenticate,
    optionalAuth,
    authorize,
    adminOnly,
    moderatorOrAdmin,
    checkOwnership,
    requireVerification,
    checkAccountStatus,
    userRateLimit,
    verifySocketToken,
    validatePasswordChange
};