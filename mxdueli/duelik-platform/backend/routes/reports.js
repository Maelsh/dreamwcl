const express = require('express');
const Joi = require('joi');
const { authenticate, authorize } = require('../middleware/auth');
const { validateCreateReport, validateReportId, validatePagination } = require('../middleware/validateRequest');
const validateRequest = require('../middleware/validateRequest');
const Report = require('../models/Report');
const Challenge = require('../models/Challenge');
const Comment = require('../models/Comment');
const User = require('../models/User');

const router = express.Router();

// التحقق من صحة بيانات إنشاء بلاغ
const createReportSchema = {
    targetType: Joi.string().required().valid('user', 'challenge', 'comment').messages({
        'any.only': 'نوع البلاغ يجب أن يكون: مستخدم، منافسة، أو تعليق',
        'any.required': 'نوع البلاغ مطلوب'
    }),
    targetId: Joi.string().required().messages({
        'string.empty': 'معرف الهدف مطلوب',
        'any.required': 'معرف الهدف مطلوب'
    }),
    reason: Joi.string().required().min(10).max(200).messages({
        'string.empty': 'سبب البلاغ مطلوب',
        'string.min': 'سبب البلاغ يجب أن يكون 10 أحرف على الأقل',
        'string.max': 'سبب البلاغ يجب ألا يزيد عن 200 حرف'
    }),
    details: Joi.string().max(1000).allow('').optional()
};

// التحقق من صحة بيانات معالجة بلاغ
const processReportSchema = {
    status: Joi.string().required().valid('resolved', 'dismissed').messages({
        'any.only': 'الحالة يجب أن تكون: تم الحل أو مرفوض',
        'any.required': 'حالة البلاغ مطلوبة'
    }),
    action: Joi.string().valid('warning', 'suspension', 'ban', 'content_removal', 'none').messages({
        'any.only': 'الإجراء المأخوذ يجب أن يكون: تحذير، تعليق، منع، حذف محتوى، أو لا شيء'
    }),
    moderatorNotes: Joi.string().max(500).allow('').optional(),
    duration: Joi.number().integer().min(1).max(365).optional() // مدة الإجراء بالأيام
};

// التحقق من صحة معاملات البحث
const getReportsSchema = {
    status: Joi.string().valid('pending', 'resolved', 'dismissed').optional(),
    targetType: Joi.string().valid('user', 'challenge', 'comment').optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    assignedTo: Joi.string().optional(),
    sortBy: Joi.string().valid('createdAt', 'priority', 'status', 'resolvedAt').default('createdAt'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10)
};

/**
 * @route   GET /api/reports
 * @desc    الحصول على قائمة البلاغات (للمشرفين)
 * @access  Private (Admin/Moderator)
 */
router.get('/', authenticate, authorize('admin', 'moderator'), validatePagination, async (req, res) => {
    try {
        const { status, targetType, priority, assignedTo, sortBy, order, page, limit } = req.query;

        // بناء استعلام البحث
        const query = {};
        
        if (status) query.status = status;
        if (targetType) query.targetType = targetType;
        if (priority) query.priority = priority;
        if (assignedTo) query.assignedTo = assignedTo;
        
        // للمشرفين العاديين، أظهر البلاغات المخصصة لهم أو غير المخصصة
        if (req.user.role === 'moderator') {
            query.$or = [
                { assignedTo: req.user.id },
                { assignedTo: null },
                { priority: { $in: ['high', 'critical'] } } // البلاغات عالية الأولوية
            ];
        }

        // حساب عدد الوثائق الكلية
        const totalCount = await Report.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        // تحديد الترتيب
        const sort = { [sortBy]: order === 'desc' ? -1 : 1 };
        // للأولوية، استخدم ترتيب خاص
        if (priority === undefined) {
            sort.priority = -1;
        }
        
        // جلب البيانات مع الترتيب والتوزيع
        const reports = await Report.find(query)
            .populate('reporter', 'username email avatar')
            .populate('assignedTo', 'username email')
            .populate('processedBy', 'username email')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        // إحصائيات البلاغات
        const stats = await Report.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                reports,
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
        console.error('خطأ في جلب البلاغات:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب البلاغات'
        });
    }
});

/**
 * @route   GET /api/reports/my-reports
 * @desc    الحصول على البلاغات التي قدمها المستخدم
 * @access  Private
 */
router.get('/my-reports', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const query = { reporter: req.user.id };
        const totalCount = await Report.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        const reports = await Report.find(query)
            .populate('assignedTo', 'username email')
            .populate('processedBy', 'username email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            success: true,
            data: {
                reports,
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
        console.error('خطأ في جلب بلاغات المستخدم:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب بلاغات المستخدم'
        });
    }
});

/**
 * @route   GET /api/reports/:id
 * @desc    الحصول على تفاصيل بلاغ محدد
 * @access  Private (Admin/Moderator or Report owner)
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate('reporter', 'username email avatar')
            .populate('assignedTo', 'username email')
            .populate('processedBy', 'username email')
            .populate({
                path: 'targetId',
                populate: [
                    { path: 'author', select: 'username avatar email' },
                    { path: 'organizer', select: 'username avatar email' }
                ]
            });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'البلاغ غير موجود'
            });
        }

        // التحقق من الصلاحية
        const canView = 
            req.user.role === 'admin' || 
            req.user.role === 'moderator' ||
            report.reporter._id.toString() === req.user.id;

        if (!canView) {
            return res.status(403).json({
                success: false,
                message: 'غير مسموح لك بعرض تفاصيل هذا البلاغ'
            });
        }

        res.json({
            success: true,
            data: { report }
        });
    } catch (error) {
        console.error('خطأ في جلب تفاصيل البلاغ:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب تفاصيل البلاغ'
        });
    }
});

/**
 * @route   POST /api/reports
 * @desc    إنشاء بلاغ جديد
 * @access  Private
 */
router.post('/', authenticate, validateCreateReport, async (req, res) => {
    try {
        const { targetType, targetId, reason, details } = req.body;

        // التحقق من وجود الهدف
        let targetExists = false;
        let targetTitle = '';

        switch (targetType) {
            case 'user':
                const targetUser = await User.findById(targetId);
                if (targetUser) {
                    targetExists = true;
                    targetTitle = targetUser.username;
                }
                break;
            case 'challenge':
                const targetChallenge = await Challenge.findById(targetId);
                if (targetChallenge) {
                    targetExists = true;
                    targetTitle = targetChallenge.title;
                }
                break;
            case 'comment':
                const targetComment = await Comment.findById(targetId);
                if (targetComment) {
                    targetExists = true;
                    targetTitle = targetComment.content.substring(0, 50) + '...';
                }
                break;
        }

        if (!targetExists) {
            return res.status(404).json({
                success: false,
                message: 'الهدف المبلغ عنه غير موجود'
            });
        }

        // التحقق من عدم الإبلاغ مسبقاً على نفس الهدف
        const existingReport = await Report.findOne({
            targetType,
            targetId,
            reporter: req.user.id,
            status: 'pending'
        });

        if (existingReport) {
            return res.status(400).json({
                success: false,
                message: 'لقد قمت بالإبلاغ عن هذا المحتوى مسبقاً'
            });
        }

        // تحديد أولوية البلاغ بناءً على السبب
        let priority = 'medium';
        const highPriorityReasons = ['harassment', 'hate_speech', 'violence', 'spam', 'illegal_content'];
        const criticalPriorityReasons = ['sexual_content', 'extremist_content', 'threats'];

        if (highPriorityReasons.some(r => reason.includes(r))) {
            priority = 'high';
        } else if (criticalPriorityReasons.some(r => reason.includes(r))) {
            priority = 'critical';
        }

        // إنشاء البلاغ الجديد
        const report = new Report({
            targetType,
            targetId,
            reporter: req.user.id,
            reason,
            details,
            priority,
            status: 'pending'
        });

        await report.save();

        // إشعار المشرفين عبر Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.to(['admin', 'moderator']).emit('new_report', {
                reportId: report._id,
                targetType,
                targetTitle,
                priority,
                reason: reason.substring(0, 100),
                createdAt: report.createdAt
            });
        }

        res.status(201).json({
            success: true,
            message: 'تم إرسال البلاغ بنجاح',
            data: { 
                report: {
                    _id: report._id,
                    targetType,
                    targetTitle,
                    reason,
                    priority,
                    status: report.status,
                    createdAt: report.createdAt
                }
            }
        });
    } catch (error) {
        console.error('خطأ في إنشاء البلاغ:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء البلاغ'
        });
    }
});

/**
 * @route   POST /api/reports/:id/assign
 * @desc    تعيين بلاغ لمشرف معين
 * @access  Private (Admin only)
 */
router.post('/:id/assign', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { moderatorId } = req.body;

        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'البلاغ غير موجود'
            });
        }

        // التحقق من وجود المشرف
        const moderator = await User.findById(moderatorId);
        if (!moderator || !['admin', 'moderator'].includes(moderator.role)) {
            return res.status(400).json({
                success: false,
                message: 'المشرف المحدد غير موجود أو ليس لديه صلاحية'
            });
        }

        report.assignedTo = moderatorId;
        report.assignedAt = new Date();
        await report.save();

        await report.populate('assignedTo', 'username email');

        // إشعار المشرف المعين
        const io = req.app.get('io');
        if (io) {
            io.to(moderatorId).emit('report_assigned', {
                reportId: report._id,
                assignedBy: req.user.username,
                assignedAt: report.assignedAt
            });
        }

        res.json({
            success: true,
            message: 'تم تعيين البلاغ بنجاح',
            data: { 
                report: {
                    _id: report._id,
                    assignedTo: report.assignedTo,
                    assignedAt: report.assignedAt
                }
            }
        });
    } catch (error) {
        console.error('خطأ في تعيين البلاغ:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تعيين البلاغ'
        });
    }
});

/**
 * @route   PATCH /api/reports/:id/process
 * @desc    معالجة بلاغ (حل أو رفض)
 * @access  Private (Admin/Moderator)
 */
router.patch('/:id/process', authenticate, authorize('admin', 'moderator'), async (req, res) => {
    try {
        const { status, action, moderatorNotes, duration } = req.body;

        const report = await Report.findById(req.params.id)
            .populate('reporter', 'username email')
            .populate({
                path: 'targetId',
                populate: [
                    { path: 'author', select: 'username avatar email' },
                    { path: 'organizer', select: 'username avatar email' }
                ]
            });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'البلاغ غير موجود'
            });
        }

        if (report.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'تم معالجة هذا البلاغ مسبقاً'
            });
        }

        // التحقق من الصلاحية (للمشرفين العاديين)
        if (req.user.role === 'moderator') {
            const canProcess = 
                report.assignedTo?.toString() === req.user.id ||
                report.assignedTo === null ||
                report.priority === 'critical';
            
            if (!canProcess) {
                return res.status(403).json({
                    success: false,
                    message: 'غير مسموح لك بمعالجة هذا البلاغ'
                });
            }
        }

        // معالجة البلاغ
        const result = await report.resolve(action, req.user.id, {
            moderatorNotes,
            duration
        });

        await report.save();

        // إشعار المبلغ والمشرفين
        const io = req.app.get('io');
        if (io) {
            // إشعار المبلغ
            io.to(report.reporter._id.toString()).emit('report_resolved', {
                reportId: report._id,
                status: report.status,
                action: result.action,
                processedAt: report.resolvedAt
            });

            // إشعار المشرفين الآخرين
            io.to(['admin', 'moderator']).emit('report_processed', {
                reportId: report._id,
                processedBy: req.user.username,
                status: report.status,
                action: result.action
            });
        }

        res.json({
            success: true,
            message: 'تم معالجة البلاغ بنجاح',
            data: {
                report: {
                    _id: report._id,
                    status: report.status,
                    action: result.action,
                    resolvedAt: report.resolvedAt,
                    processedBy: req.user.username
                },
                actions: result.details
            }
        });
    } catch (error) {
        console.error('خطأ في معالجة البلاغ:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في معالجة البلاغ'
        });
    }
});

/**
 * @route   DELETE /api/reports/:id
 * @desc    حذف بلاغ (فقط للإدارة)
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'البلاغ غير موجود'
            });
        }

        await Report.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'تم حذف البلاغ بنجاح'
        });
    } catch (error) {
        console.error('خطأ في حذف البلاغ:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف البلاغ'
        });
    }
});

/**
 * @route   GET /api/reports/statistics
 * @desc    إحصائيات البلاغات للمشرفين
 * @access  Private (Admin/Moderator)
 */
router.get('/statistics', authenticate, authorize('admin', 'moderator'), async (req, res) => {
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

        // إحصائيات عامة
        const generalStats = await Report.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    avgResolutionTime: {
                        $avg: {
                            $cond: [
                                { $eq: ['$status', { $in: ['resolved', 'dismissed'] }] },
                                {
                                    $divide: [
                                        { $subtract: ['$resolvedAt', '$createdAt'] },
                                        3600000 // تحويل إلى ساعات
                                    ]
                                },
                                null
                            ]
                        }
                    }
                }
            }
        ]);

        // البلاغات حسب النوع
        const reportsByType = await Report.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$targetType',
                    count: { $sum: 1 }
                }
            }
        ]);

        // البلاغات حسب الأولوية
        const reportsByPriority = await Report.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }
            }
        ]);

        // أكثر البلاغات تكراراً
        const topReasons = await Report.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$reason',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // إحصائيات المشرفين
        const moderatorStats = await Report.aggregate([
            { $match: { ...dateFilter, assignedTo: { $ne: null } } },
            {
                $group: {
                    _id: '$assignedTo',
                    processedReports: { $sum: 1 },
                    avgResolutionTime: {
                        $avg: {
                            $cond: [
                                { $eq: ['$status', { $in: ['resolved', 'dismissed'] }] },
                                {
                                    $divide: [
                                        { $subtract: ['$resolvedAt', '$createdAt'] },
                                        3600000 // تحويل إلى ساعات
                                    ]
                                },
                                null
                            ]
                        }
                    }
                }
            },
            { $sort: { processedReports: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'moderator'
                }
            },
            { $unwind: '$moderator' }
        ]);

        res.json({
            success: true,
            data: {
                period,
                generalStats,
                reportsByType,
                reportsByPriority,
                topReasons,
                moderatorStats
            }
        });
    } catch (error) {
        console.error('خطأ في جلب إحصائيات البلاغات:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب إحصائيات البلاغات'
        });
    }
});

/**
 * @route   GET /api/reports/targets/:targetType/:targetId
 * @desc    الحصول على بلاغات هدف محدد
 * @access  Private (Admin/Moderator or Target owner)
 */
router.get('/targets/:targetType/:targetId', authenticate, async (req, res) => {
    try {
        const { targetType, targetId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const query = { targetType, targetId };

        // التحقق من الصلاحية
        let canView = req.user.role === 'admin' || req.user.role === 'moderator';

        if (!canView) {
            // يمكن للمالك رؤية بلاغات محتواه
            switch (targetType) {
                case 'challenge':
                    const challenge = await Challenge.findById(targetId);
                    canView = challenge && challenge.organizer.toString() === req.user.id;
                    break;
                case 'comment':
                    const comment = await Comment.findById(targetId);
                    canView = comment && comment.author.toString() === req.user.id;
                    break;
                case 'user':
                    canView = targetId === req.user.id;
                    break;
            }
        }

        if (!canView) {
            return res.status(403).json({
                success: false,
                message: 'غير مسموح لك بعرض بلاغات هذا الهدف'
            });
        }

        const totalCount = await Report.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        const reports = await Report.find(query)
            .populate('reporter', 'username email avatar')
            .populate('assignedTo', 'username email')
            .populate('processedBy', 'username email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            success: true,
            data: {
                target: { type: targetType, id: targetId },
                reports,
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
        console.error('خطأ في جلب بلاغات الهدف:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب بلاغات الهدف'
        });
    }
});

module.exports = router;