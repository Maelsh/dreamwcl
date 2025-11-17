const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const User = require('../models/User');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { 
    validateUpdateProfile, 
    validateUserId, 
    validateUsername,
    validatePagination,
    handleValidationErrors 
} = require('../middleware/validateRequest');
const { 
    authenticate, 
    optionalAuth, 
    adminOnly,
    moderatorOrAdmin,
    checkOwnership,
    requireVerification
} = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/avatars');
        try {
            await fs.mkdir(uploadPath, { recursive: true });
            cb(null, uploadPath);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `avatar-${req.userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new ApiError('نوع الملف غير مدعوم. يُسمح فقط بملفات الصور (JPEG, PNG, GIF)', 400));
        }
    }
});

// =========================================
// GET USER PROFILE
// =========================================

router.get('/profile', optionalAuth, asyncHandler(async (req, res) => {
    const { username } = req.query;

    let query = {};
    if (username) {
        query.username = username;
    } else if (req.user) {
        query._id = req.userId;
    } else {
        return res.status(400).json({
            success: false,
            message: 'يجب توفير اسم المستخدم أو تسجيل الدخول'
        });
    }

    const user = await User.findOne(query)
        .select('-password -security.refreshTokens')
        .populate('followers.user', 'username fullName avatar')
        .populate('following.user', 'username fullName avatar');

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'المستخدم غير موجود'
        });
    }

    // Check if profile is public or if user is viewing their own profile
    const isOwnProfile = req.user && req.userId.toString() === user._id.toString();
    const isAdmin = req.user && ['admin', 'super_admin'].includes(req.user.userType);
    
    if (!user.preferences.publicProfile && !isOwnProfile && !isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'هذا الحساب خاص'
        });
    }

    // Get user's competition statistics
    const stats = await user.constructor.getUserStats(user._id);

    res.status(200).json({
        success: true,
        status: 'success',
        data: {
            user,
            statistics: stats.statistics
        }
    });
}));

// =========================================
// UPDATE PROFILE
// =========================================

router.patch('/profile', authenticate, validateUpdateProfile, asyncHandler(async (req, res, next) => {
    const allowedUpdates = ['fullName', 'bio', 'country', 'city', 'dateOfBirth', 'gender'];
    const updates = {};

    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key) && req.body[key] !== undefined) {
            updates[key] = req.body[key];
        }
    });

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            success: false,
            message: 'لا توجد بيانات صالحة للتحديث'
        });
    }

    const user = await User.findByIdAndUpdate(
        req.userId,
        updates,
        { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
        success: true,
        status: 'success',
        message: 'تم تحديث الملف الشخصي بنجاح',
        data: {
            user
        }
    });

    logger.info('Profile updated', {
        userId: req.userId,
        updates: Object.keys(updates)
    });
}));

// =========================================
// UPLOAD AVATAR
// =========================================

router.post('/avatar', authenticate, upload.single('avatar'), asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new ApiError('لم يتم اختيار أي ملف', 400));
    }

    const avatarPath = req.file.path;
    const optimizedPath = avatarPath.replace(/\.[^/.]+$/, '_optimized.webp');

    try {
        // Optimize image
        await sharp(avatarPath)
            .resize(200, 200, {
                fit: 'cover',
                position: 'center'
            })
            .webp({ quality: 90 })
            .toFile(optimizedPath);

        // Update user avatar
        const avatarUrl = `/uploads/avatars/${path.basename(optimizedPath)}`;
        await User.findByIdAndUpdate(req.userId, { avatar: avatarUrl });

        // Clean up original file
        await fs.unlink(avatarPath);

        res.status(200).json({
            success: true,
            status: 'success',
            message: 'تم تحديث الصورة الشخصية بنجاح',
            data: {
                avatar: avatarUrl
            }
        });

        logger.info('Avatar updated', {
            userId: req.userId,
            avatar: avatarUrl
        });

    } catch (error) {
        // Clean up files on error
        try {
            await fs.unlink(avatarPath);
            await fs.unlink(optimizedPath);
        } catch (cleanupError) {
            logger.error('Error cleaning up files:', cleanupError);
        }
        
        next(error);
    }
}));

// =========================================
// DELETE AVATAR
// =========================================

router.delete('/avatar', authenticate, asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);

    if (!user.avatar) {
        return res.status(400).json({
            success: false,
            message: 'لا توجد صورة شخصية لحذفها'
        });
    }

    try {
        // Delete avatar file if it exists
        const avatarPath = path.join(__dirname, '../../uploads', user.avatar);
        await fs.unlink(avatarPath);
    } catch (error) {
        logger.warn('Could not delete avatar file:', error);
    }

    // Update user record
    user.avatar = null;
    await user.save();

    res.status(200).json({
        success: true,
        status: 'success',
        message: 'تم حذف الصورة الشخصية بنجاح'
    });

    logger.info('Avatar deleted', {
        userId: req.userId
    });
}));

// =========================================
// FOLLOW/UNFOLLOW USER
// =========================================

router.post('/:id/follow', authenticate, requireVerification, asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    if (id === req.userId.toString()) {
        return next(new ApiError('لا يمكن متابعة نفسك', 400));
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
        return next(new ApiError('المستخدم غير موجود', 404));
    }

    const currentUser = await User.findById(req.userId);

    // Check if already following
    const alreadyFollowing = currentUser.following.some(
        follow => follow.user.toString() === id
    );

    if (alreadyFollowing) {
        // Unfollow
        currentUser.following = currentUser.following.filter(
            follow => follow.user.toString() !== id
        );
        targetUser.followers = targetUser.followers.filter(
            follower => follower.user.toString() !== req.userId.toString()
        );
    } else {
        // Follow
        currentUser.following.push({
            user: id,
            followedAt: new Date()
        });
        targetUser.followers.push({
            user: req.userId,
            followedAt: new Date()
        });
    }

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
        success: true,
        status: 'success',
        message: alreadyFollowing ? 'تم إلغاء المتابعة' : 'تم المتابعة بنجاح',
        data: {
            isFollowing: !alreadyFollowing,
            followersCount: targetUser.followers.length,
            followingCount: currentUser.following.length
        }
    });

    logger.info(`${alreadyFollowing ? 'Unfollowed' : 'Followed'} user`, {
        followerId: req.userId,
        followedId: id
    });
}));

// =========================================
// GET USER FOLLOWERS
// =========================================

router.get('/:id/followers', validatePagination, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(id)
        .populate({
            path: 'followers.user',
            select: 'username fullName avatar',
            options: { skip, limit, sort: { 'followedAt': -1 } }
        });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'المستخدم غير موجود'
        });
    }

    const totalFollowers = user.followers.length;
    const hasMore = skip + limit < totalFollowers;

    res.status(200).json({
        success: true,
        status: 'success',
        data: {
            followers: user.followers.map(follow => ({
                user: follow.user,
                followedAt: follow.followedAt
            })),
            pagination: {
                page,
                limit,
                total: totalFollowers,
                pages: Math.ceil(totalFollowers / limit),
                hasMore
            }
        }
    });
}));

// =========================================
// GET USER FOLLOWING
// =========================================

router.get('/:id/following', validatePagination, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(id)
        .populate({
            path: 'following.user',
            select: 'username fullName avatar',
            options: { skip, limit, sort: { 'followedAt': -1 } }
        });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'المستخدم غير موجود'
        });
    }

    const totalFollowing = user.following.length;
    const hasMore = skip + limit < totalFollowing;

    res.status(200).json({
        success: true,
        status: 'success',
        data: {
            following: user.following.map(follow => ({
                user: follow.user,
                followedAt: follow.followedAt
            })),
            pagination: {
                page,
                limit,
                total: totalFollowing,
                pages: Math.ceil(totalFollowing / limit),
                hasMore
            }
        }
    });
}));

// =========================================
// GET USER STATISTICS
// =========================================

router.get('/:id/stats', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'المستخدم غير موجود'
        });
    }

    const stats = await User.getUserStats(id);

    res.status(200).json({
        success: true,
        status: 'success',
        data: {
            statistics: stats.statistics
        }
    });
}));

// =========================================
// SEARCH USERS
// =========================================

router.get('/search', validatePagination, asyncHandler(async (req, res) => {
    const { q: query, userType, verified } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let searchQuery = {
        isActive: true,
        isBanned: false
    };

    if (query) {
        searchQuery.$or = [
            { fullName: { $regex: query, $options: 'i' } },
            { username: { $regex: query, $options: 'i' } }
        ];
    }

    if (userType) {
        searchQuery.userType = userType;
    }

    if (verified !== undefined) {
        searchQuery.isVerified = verified === 'true';
    }

    const users = await User.find(searchQuery)
        .select('username fullName avatar userType isVerified statistics')
        .sort({ 'statistics.averageRating': -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await User.countDocuments(searchQuery);

    res.status(200).json({
        success: true,
        status: 'success',
        data: {
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
}));

// =========================================
// UPDATE USER PREFERENCES
// =========================================

router.patch('/preferences', authenticate, asyncHandler(async (req, res) => {
    const allowedPreferences = [
        'language',
        'theme',
        'emailNotifications',
        'pushNotifications',
        'publicProfile',
        'allowDirectMessages'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
        if (allowedPreferences.includes(key) && req.body[key] !== undefined) {
            updates[`preferences.${key}`] = req.body[key];
        }
    });

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            success: false,
            message: 'لا توجد تفضيلات صالحة للتحديث'
        });
    }

    const user = await User.findByIdAndUpdate(
        req.userId,
        updates,
        { new: true, runValidators: true }
    ).select('preferences');

    res.status(200).json({
        success: true,
        status: 'success',
        message: 'تم تحديث التفضيلات بنجاح',
        data: {
            preferences: user.preferences
        }
    });
}));

// =========================================
// DELETE ACCOUNT
// =========================================

router.delete('/account', authenticate, asyncHandler(async (req, res, next) => {
    const { password } = req.body;

    if (!password) {
        return next(new ApiError('يجب توفير كلمة المرور لحذف الحساب', 400));
    }

    const user = await User.findById(req.userId).select('+password');

    // Verify password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
        return next(new ApiError('كلمة المرور غير صحيحة', 400));
    }

    // Check if user has pending payouts
    const Finance = require('../models/Finance');
    const pendingPayouts = await Finance.find({
        user: req.userId,
        type: 'earning',
        status: { $in: ['pending', 'processing'] }
    });

    if (pendingPayouts.length > 0) {
        return next(new ApiError('لا يمكن حذف الحساب وجود مدفوعات معلقة', 400));
    }

    // Soft delete - deactivate account
    user.isActive = false;
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletionReason = req.body.reason || 'User requested deletion';
    
    // Anonymize data
    user.username = `deleted_${user._id}`;
    user.email = `deleted_${user._id}@duelik.com`;
    user.fullName = 'حذف حساب';
    user.avatar = null;
    user.bio = '';
    
    // Clear sensitive data
    user.password = '';
    user.security.refreshTokens = [];

    await user.save();

    res.status(200).json({
        success: true,
        status: 'success',
        message: 'تم حذف الحساب بنجاح'
    });

    logger.info('Account deleted', {
        userId: req.userId,
        reason: user.deletionReason
    });
}));

// =========================================
// ADMIN ROUTES
// =========================================

// Get all users (Admin only)
router.get('/admin/all', authenticate, adminOnly, validatePagination, asyncHandler(async (req, res) => {
    const { status, userType, verified, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {};

    if (status) {
        if (status === 'active') query.isActive = true;
        else if (status === 'inactive') query.isActive = false;
        else if (status === 'banned') query.isBanned = true;
    }

    if (userType) query.userType = userType;
    if (verified !== undefined) query.isVerified = verified === 'true';

    if (search) {
        query.$or = [
            { fullName: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    const users = await User.find(query)
        .select('-password -security.refreshTokens')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
        success: true,
        status: 'success',
        data: {
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
}));

// Ban/Unban user (Admin/Moderator)
router.patch('/:id/ban', authenticate, moderatorOrAdmin, validateUserId, asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { action, reason, duration } = req.body;

    if (!['ban', 'unban'].includes(action)) {
        return next(new ApiError('الإجراء يجب أن يكون ban أو unban', 400));
    }

    const user = await User.findById(id);
    if (!user) {
        return next(new ApiError('المستخدم غير موجود', 404));
    }

    if (action === 'ban') {
        user.isBanned = true;
        user.banReason = reason || 'موقف من قبل الإدارة';
        user.banExpiresAt = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;
        user.bannedBy = req.userId;
        user.bannedAt = new Date();
    } else {
        user.isBanned = false;
        user.banReason = '';
        user.banExpiresAt = null;
    }

    await user.save();

    res.status(200).json({
        success: true,
        status: 'success',
        message: action === 'ban' ? 'تم حظر المستخدم' : 'تم إلغاء حظر المستخدم'
    });

    logger.info(`User ${action}ed`, {
        targetUserId: id,
        action,
        reason,
        adminId: req.userId
    });
}));

module.exports = router;