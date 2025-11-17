const express = require('express');
const Joi = require('joi');
const { authenticate, authorize } = require('../middleware/auth');
const { validateUserId, validateChallengeId, validateReportId, validatePagination } = require('../middleware/validateRequest');
const validateRequest = require('../middleware/validateRequest');
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const Comment = require('../models/Comment');
const Rating = require('../models/Rating');
const Report = require('../models/Report');
const Finance = require('../models/Finance');
const SystemSettings = require('../models/SystemSettings');

const router = express.Router();

// التحقق من صحة بيانات تحديث المستخدم
const updateUserSchema = {
    username: Joi.string().alphanum().min(3).max(30).optional(),
    email: Joi.string().email().optional(),
    role: Joi.string().valid('user', 'moderator', 'admin').optional(),
    status: Joi.string().valid('active', 'suspended', 'banned').optional(),
    balance: Joi.number().min(0).optional(),
    bio: Joi.string().max(500).allow('').optional(),
    isVerified: Joi.boolean().optional()
};

// التحقق من صحة بيانات إعدادات النظام
const updateSettingsSchema = {
    siteName: Joi.string().max(100).optional(),
    siteDescription: Joi.string().max(500).optional(),
    platformFee: Joi.number().min(0).max(100).optional(),
    minWithdrawal: Joi.number().min(1).optional(),
    maxWithdrawal: Joi.number().min(1).optional(),
    maintenanceMode: Joi.boolean().optional(),
    registrationEnabled: Joi.boolean().optional(),
    challengeCreationEnabled: Joi.boolean().optional(),
    ratingsEnabled: Joi.boolean().optional(),
    commentsEnabled: Joi.boolean().optional()
};

// التحقق من صحة معاملات البحث
const getUsersSchema = {
    role: Joi.string().valid('user', 'moderator', 'admin').optional(),
    status: Joi.string().valid('active', 'suspended', 'banned').optional(),
    search: Joi.string().max(100).optional(),
    sortBy: Joi.string().valid('createdAt', 'username', 'email', 'balance', 'challengesCount').default('createdAt'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
};

/**
 * @route   GET /api/admin/dashboard
 * @desc    لوحة المعلومات الرئيسية
 * @access  Private (Admin only)
 */
router.get('/dashboard', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { period = '30d' } = req.query;

        // تحديد الفترة الزمنية
        let dateFilter = {};
        const now = new Date();
        
        switch (period) {
            case '24h':
                dateFilter = { createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } };
                break;
            case '7d':
                dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
                break;
            case '30d':
                dateFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
                break;
        }

        // إحصائيات المستخدمين
        const usersStats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    activeUsers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                    suspendedUsers: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } },
                    bannedUsers: { $sum: { $cond: [{ $eq: ['$status', 'banned'] }, 1, 0] } },
                    totalBalance: { $sum: '$balance' }
                }
            }
        ]);

        // إحصائيات المنافسات
        const challengesStats = await Challenge.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalPrizePool: { $sum: '$prizePool' },
                    totalViews: { $sum: '$views' }
                }
            }
        ]);

        // إحصائيات البلاغات
        const reportsStats = await Report.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // إحصائيات المعاملات المالية
        const financeStats = await Finance.aggregate([
            { $match: { status: 'completed', ...dateFilter } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        // المنصات النشطة حسب الفئة
        const challengesByCategory = await Challenge.aggregate([
            dateFilter.createdAt ? { $match: dateFilter } : { $match: {} },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    avgPrizePool: { $avg: '$prizePool' },
                    totalViews: { $sum: '$views' }
                }
            }
        ]);

        // آخر النشاطات
        const recentActivity = {
            users: await User.find(dateFilter).sort({ createdAt: -1 }).limit(5).select('username email createdAt'),
            challenges: await Challenge.find(dateFilter).sort({ createdAt: -1 }).limit(5).select('title category status createdAt'),
            reports: await Report.find(dateFilter).sort({ createdAt: -1 }).limit(5).select('targetType reason status createdAt')
        };

        // إحصائيات النمو
        const growthStats = await User.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    newUsers: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        res.json({
            success: true,
            data: {
                period,
                users: usersStats[0] || {},
                challenges: challengesStats,
                reports: reportsStats,
                finance: financeStats,
                challengesByCategory,
                recentActivity,
                growthStats
            }
        });
    } catch (error) {
        console.error('خطأ في جلب بيانات لوحة المعلومات:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب بيانات لوحة المعلومات'
        });
    }
});

/**
 * @route   GET /api/admin/users
 * @desc    إدارة المستخدمين
 * @access  Private (Admin/Moderator)
 */
router.get('/users', authenticate, authorize('admin', 'moderator'), validatePagination, async (req, res) => {
    try {
        const { role, status, search, sortBy, order, page, limit } = req.query;

        // بناء استعلام البحث
        const query = {};
        
        if (role) query.role = role;
        if (status) query.status = status;
        
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // حساب عدد الوثائق الكلية
        const totalCount = await User.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        // تحديد الترتيب
        const sort = { [sortBy]: order === 'desc' ? -1 : 1 };
        
        // جلب البيانات مع الترتيب والتوزيع
        const users = await User.find(query)
            .select('-password')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        // إحصائيات سريعة
        const stats = await User.aggregate([
            {
                $group: {
                    _id: { role: '$role', status: '$status' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                users,
                stats,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('خطأ في جلب المستخدمين:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب المستخدمين'
        });
    }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    الحصول على تفاصيل مستخدم
 * @access  Private (Admin/Moderator)
 */
router.get('/users/:id', authenticate, authorize('admin', 'moderator'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        // جلب إحصائيات المستخدم
        const stats = {
            challengesCreated: await Challenge.countDocuments({ organizer: req.params.id }),
            challengesParticipated: await Challenge.countDocuments({ 'participants.user': req.params.id }),
            commentsCount: await Comment.countDocuments({ author: req.params.id }),
            ratingsGiven: await Rating.countDocuments({ rater: req.params.id }),
            reportsSubmitted: await Report.countDocuments({ reporter: req.params.id }),
            reportsReceived: await Report.countDocuments({
                $or: [
                    { targetType: 'user', targetId: req.params.id },
                    { targetType: 'challenge', targetId: { $in: await Challenge.find({ organizer: req.params.id }).select('_id') } },
                    { targetType: 'comment', targetId: { $in: await Comment.find({ author: req.params.id }).select('_id') } }
                ]
            })
        };

        res.json({
            success: true,
            data: { user, stats }
        });
    } catch (error) {
        console.error('خطأ في جلب تفاصيل المستخدم:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب تفاصيل المستخدم'
        });
    }
});

/**
 * @route   PATCH /api/admin/users/:id
 * @desc    تحديث مستخدم
 * @access  Private (Admin only)
 */
router.patch('/users/:id', authenticate, authorize('admin'), validateUserId, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        // منع تعديل حساب الإدارة العليا
        if (user.role === 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'غير مسموح لك بتعديل حساب الإدارة العليا'
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'تم تحديث المستخدم بنجاح',
            data: { user: updatedUser }
        });
    } catch (error) {
        console.error('خطأ في تحديث المستخدم:', error);
        res.status(400).json({
            success: false,
            message: 'خطأ في تحديث المستخدم',
            errors: error.errors ? Object.values(error.errors).map(err => err.message) : []
        });
    }
});

/**
 * @route   POST /api/admin/users/:id/suspend
 * @desc    تعليق مستخدم
 * @access  Private (Admin only)
 */
router.post('/users/:id/suspend', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { reason, duration } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'سبب التعليق مطلوب'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        // منع تعليق حساب الإدارة العليا
        if (user.role === 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'غير مسموح لك بتعليق حساب الإدارة العليا'
            });
        }

        user.status = 'suspended';
        user.suspensionReason = reason;
        user.suspendedAt = new Date();
        user.suspendedUntil = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;
        user.suspendedBy = req.user.id;

        await user.save();

        // إشعار المستخدم
        const io = req.app.get('io');
        if (io) {
            io.to(user._id.toString()).emit('account_suspended', {
                reason,
                duration,
                suspendedUntil: user.suspendedUntil
            });
        }

        res.json({
            success: true,
            message: 'تم تعليق المستخدم بنجاح',
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    status: user.status,
                    suspendedUntil: user.suspendedUntil
                }
            }
        });
    } catch (error) {
        console.error('خطأ في تعليق المستخدم:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تعليق المستخدم'
        });
    }
});

/**
 * @route   POST /api/admin/users/:id/unsuspend
 * @desc    إلغاء تعليق مستخدم
 * @access  Private (Admin only)
 */
router.post('/users/:id/unsuspend', authenticate, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        user.status = 'active';
        user.suspensionReason = null;
        user.suspendedAt = null;
        user.suspendedUntil = null;
        user.suspendedBy = null;

        await user.save();

        // إشعار المستخدم
        const io = req.app.get('io');
        if (io) {
            io.to(user._id.toString()).emit('account_unsuspended');
        }

        res.json({
            success: true,
            message: 'تم إلغاء تعليق المستخدم بنجاح',
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    status: user.status
                }
            }
        });
    } catch (error) {
        console.error('خطأ في إلغاء تعليق المستخدم:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إلغاء تعليق المستخدم'
        });
    }
});

/**
 * @route   GET /api/admin/challenges
 * @desc    إدارة المنافسات
 * @access  Private (Admin/Moderator)
 */
router.get('/challenges', authenticate, authorize('admin', 'moderator'), async (req, res) => {
    try {
        const { status, category, search, page = 1, limit = 10 } = req.query;

        const query = {};
        if (status) query.status = status;
        if (category) query.category = category;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { topic: { $regex: search, $options: 'i' } }
            ];
        }

        const totalCount = await Challenge.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        const challenges = await Challenge.find(query)
            .populate('organizer', 'username email avatar')
            .populate('participants.user', 'username email avatar')
            .populate('winner', 'username email avatar')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            success: true,
            data: {
                challenges,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('خطأ في جلب المنافسات:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب المنافسات'
        });
    }
});

/**
 * @route   POST /api/admin/challenges/:id/cancel
 * @desc    إلغاء منافسة
 * @access  Private (Admin only)
 */
router.post('/challenges/:id/cancel', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'سبب الإلغاء مطلوب'
            });
        }

        const challenge = await Challenge.findById(req.params.id)
            .populate('organizer', 'username email')
            .populate('participants.user', 'username email');

        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: 'المنافسة غير موجودة'
            });
        }

        if (challenge.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن إلغاء منافسة مكتملة'
            });
        }

        // إرجاع الرسوم للمشاركين
        if (challenge.entryFee > 0 && challenge.participants.length > 0) {
            for (const participant of challenge.participants) {
                if (participant.status === 'confirmed') {
                    const user = await User.findById(participant.user._id);
                    user.balance += challenge.entryFee;
                    await user.save();

                    // إنشاء معاملة استرداد
                    const finance = new Finance({
                        user: participant.user._id,
                        type: 'refund',
                        amount: challenge.entryFee,
                        description: `استرداد رسوم الانضمام بسبب إلغاء المنافسة: ${challenge.title}`,
                        challenge: req.params.id,
                        status: 'completed'
                    });
                    await finance.save();
                }
            }
        }

        // تحديث حالة المنافسة
        challenge.status = 'cancelled';
        challenge.endReason = `تم الإلغاء من الإدارة: ${reason}`;
        challenge.completedAt = new Date();
        await challenge.save();

        // إشعار المشاركين
        const io = req.app.get('io');
        if (io) {
            challenge.participants.forEach(participant => {
                io.to(participant.user._id.toString()).emit('challenge_cancelled', {
                    challengeId: challenge._id,
                    title: challenge.title,
                    reason: reason,
                    refundAmount: challenge.entryFee
                });
            });
        }

        res.json({
            success: true,
            message: 'تم إلغاء المنافسة بنجاح',
            data: {
                challenge: {
                    _id: challenge._id,
                    title: challenge.title,
                    status: challenge.status,
                    endReason: challenge.endReason
                }
            }
        });
    } catch (error) {
        console.error('خطأ في إلغاء المنافسة:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إلغاء المنافسة'
        });
    }
});

/**
 * @route   GET /api/admin/settings
 * @desc    الحصول على إعدادات النظام
 * @access  Private (Admin only)
 */
router.get('/settings', authenticate, authorize('admin'), async (req, res) => {
    try {
        const settings = await SystemSettings.find();
        const settingsObject = {};
        
        settings.forEach(setting => {
            settingsObject[setting.key] = setting.value;
        });

        res.json({
            success: true,
            data: { settings: settingsObject }
        });
    } catch (error) {
        console.error('خطأ في جلب إعدادات النظام:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب إعدادات النظام'
        });
    }
});

/**
 * @route   PATCH /api/admin/settings
 * @desc    تحديث إعدادات النظام
 * @access  Private (Admin only)
 */
router.patch('/settings', authenticate, authorize('admin'), async (req, res) => {
    try {
        const settingsData = req.body;
        const updatePromises = [];

        for (const [key, value] of Object.entries(settingsData)) {
            updatePromises.push(
                SystemSettings.findOneAndUpdate(
                    { key },
                    { 
                        value, 
                        updatedAt: new Date(),
                        updatedBy: req.user.id 
                    },
                    { upsert: true, new: true }
                )
            );
        }

        await Promise.all(updatePromises);

        // الحصول على الإعدادات المحدثة
        const updatedSettings = await SystemSettings.find();
        const settingsObject = {};
        
        updatedSettings.forEach(setting => {
            settingsObject[setting.key] = setting.value;
        });

        res.json({
            success: true,
            message: 'تم تحديث الإعدادات بنجاح',
            data: { settings: settingsObject }
        });
    } catch (error) {
        console.error('خطأ في تحديث إعدادات النظام:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث إعدادات النظام'
        });
    }
});

/**
 * @route   GET /api/admin/analytics
 * @desc    إحصائيات متقدمة
 * @access  Private (Admin only)
 */
router.get('/analytics', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { period = '30d' } = req.query;

        // تحديد الفترة الزمنية
        let dateFilter = {};
        const now = new Date();
        
        switch (period) {
            case '24h':
                dateFilter = { createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } };
                break;
            case '7d':
                dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
                break;
            case '30d':
                dateFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
                break;
        }

        // تحليل المستخدمين
        const userAnalytics = await User.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    newUsers: { $sum: 1 },
                    activeUsers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                    totalBalance: { $sum: '$balance' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // تحليل المنافسات
        const challengeAnalytics = await Challenge.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$category',
                    totalChallenges: { $sum: 1 },
                    avgParticipants: { $avg: { $size: '$participants' } },
                    avgPrizePool: { $avg: '$prizePool' },
                    totalViews: { $sum: '$views' },
                    completedChallenges: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
                }
            }
        ]);

        // تحليل التفاعل
        const engagementAnalytics = {
            comments: await Comment.countDocuments(dateFilter),
            ratings: await Rating.countDocuments(dateFilter),
            reports: await Report.countDocuments(dateFilter),
            withdrawalRequests: await Finance.countDocuments({ 
                type: 'withdrawal', 
                ...dateFilter 
            })
        };

        res.json({
            success: true,
            data: {
                period,
                userAnalytics,
                challengeAnalytics,
                engagementAnalytics
            }
        });
    } catch (error) {
        console.error('خطأ في جلب الإحصائيات المتقدمة:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الإحصائيات المتقدمة'
        });
    }
});

/**
 * @route   POST /api/admin/maintenance
 * @desc    تفعيل/إلغاء وضع الصيانة
 * @access  Private (Admin only)
 */
router.post('/maintenance', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { enabled, message } = req.body;

        await SystemSettings.findOneAndUpdate(
            { key: 'maintenanceMode' },
            { 
                value: enabled.toString(),
                updatedAt: new Date(),
                updatedBy: req.user.id
            },
            { upsert: true }
        );

        if (message) {
            await SystemSettings.findOneAndUpdate(
                { key: 'maintenanceMessage' },
                { 
                    value: message,
                    updatedAt: new Date(),
                    updatedBy: req.user.id
                },
                { upsert: true }
            );
        }

        res.json({
            success: true,
            message: enabled ? 'تم تفعيل وضع الصيانة' : 'تم إلغاء وضع الصيانة',
            data: { maintenanceMode: enabled, message }
        });
    } catch (error) {
        console.error('خطأ في تحديث وضع الصيانة:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث وضع الصيانة'
        });
    }
});

/**
 * @route   GET /api/admin/health
 * @desc    فحص صحة النظام
 * @access  Private (Admin only)
 */
router.get('/health', authenticate, authorize('admin'), async (req, res) => {
    try {
        const healthCheck = {
            database: 'unknown',
            memory: 'unknown',
            users: 0,
            challenges: 0,
            reports: 0,
            uptime: process.uptime(),
            timestamp: new Date()
        };

        // فحص قاعدة البيانات
        try {
            await User.findOne().select('_id');
            healthCheck.database = 'healthy';
        } catch (error) {
            healthCheck.database = 'unhealthy';
        }

        // إحصائيات سريعة
        healthCheck.users = await User.countDocuments();
        healthCheck.challenges = await Challenge.countDocuments();
        healthCheck.reports = await Report.countDocuments({ status: 'pending' });

        // فحص الذاكرة
        const memUsage = process.memoryUsage();
        healthCheck.memory = {
            used: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
            total: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
            rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`
        };

        const overallHealth = healthCheck.database === 'healthy' ? 'healthy' : 'unhealthy';

        res.status(overallHealth === 'healthy' ? 200 : 503).json({
            success: overallHealth === 'healthy',
            status: overallHealth,
            data: healthCheck
        });
    } catch (error) {
        console.error('خطأ في فحص صحة النظام:', error);
        res.status(500).json({
            success: false,
            status: 'error',
            message: 'خطأ في فحص صحة النظام'
        });
    }
});

module.exports = router;