const express = require('express');
const Joi = require('joi');
const { authenticate } = require('../middleware/auth');
const { validateCreateComment, validateCommentId, validatePagination } = require('../middleware/validateRequest');
const validateRequest = require('../middleware/validateRequest');
const Comment = require('../models/Comment');
const Challenge = require('../models/Challenge');
const User = require('../models/User');

const router = express.Router();

// التحقق من صحة بيانات إضافة تعليق
const createCommentSchema = {
    challenge: Joi.string().required().messages({
        'string.empty': 'معرف المنافسة مطلوب'
    }),
    content: Joi.string().required().min(1).max(1000).messages({
        'string.empty': 'محتوى التعليق مطلوب',
        'string.min': 'محتوى التعليق لا يمكن أن يكون فارغاً',
        'string.max': 'محتوى التعليق يجب ألا يزيد عن 1000 حرف'
    }),
    parentComment: Joi.string().optional() // للردود
};

// التحقق من صحة بيانات تحديث تعليق
const updateCommentSchema = {
    content: Joi.string().required().min(1).max(1000).messages({
        'string.empty': 'محتوى التعليق مطلوب',
        'string.min': 'محتوى التعليق لا يمكن أن يكون فارغاً',
        'string.max': 'محتوى التعليق يجب ألا يزيد عن 1000 حرف'
    })
};

// التحقق من صحة معاملات البحث
const getCommentsSchema = {
    challenge: Joi.string().optional(),
    author: Joi.string().optional(),
    parentComment: Joi.string().allow(null, '').optional(),
    sortBy: Joi.string().valid('createdAt', 'likes', 'replies').default('createdAt'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10)
};

/**
 * @route   GET /api/comments
 * @desc    الحصول على قائمة التعليقات مع إمكانية البحث والفلترة
 * @access  Public
 */
router.get('/', validatePagination, async (req, res) => {
    try {
        const { challenge, author, parentComment, sortBy, order, page, limit } = req.query;

        // بناء استعلام البحث
        const query = {};
        
        if (challenge) query.challenge = challenge;
        if (author) query.author = author;
        if (parentComment !== undefined) query.parentComment = parentComment || null;

        // حساب عدد الوثائق الكلية
        const totalCount = await Comment.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        // تحديد الترتيب
        const sort = { [sortBy]: order === 'desc' ? -1 : 1 };
        
        // جلب البيانات مع الترتيب والتوزيع
        const comments = await Comment.find(query)
            .populate('author', 'username email avatar')
            .populate({
                path: 'challenge',
                select: 'title category status',
                populate: { path: 'organizer', select: 'username avatar' }
            })
            .populate({
                path: 'parentComment',
                select: 'content author',
                populate: { path: 'author', select: 'username avatar' }
            })
            .populate({
                path: 'replies.author',
                select: 'username avatar'
            })
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            success: true,
            data: {
                comments,
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
        console.error('خطأ في جلب التعليقات:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب التعليقات'
        });
    }
});

/**
 * @route   GET /api/comments/challenge/:challengeId
 * @desc    الحصول على تعليقات منافسة محددة
 * @access  Public
 */
router.get('/challenge/:challengeId', async (req, res) => {
    try {
        const { challengeId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        // التحقق من وجود المنافسة
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: 'المنافسة غير موجودة'
            });
        }

        // جلب التعليقات الرئيسية فقط (بدون ردود)
        const query = { challenge: challengeId, parentComment: null };
        
        const totalCount = await Comment.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        const comments = await Comment.find(query)
            .populate('author', 'username email avatar')
            .populate({
                path: 'replies',
                options: { sort: { createdAt: -1 } },
                populate: { path: 'author', select: 'username avatar' }
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            success: true,
            data: {
                challenge: {
                    _id: challenge._id,
                    title: challenge.title,
                    category: challenge.category,
                    status: challenge.status
                },
                comments,
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
        console.error('خطأ في جلب تعليقات المنافسة:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب تعليقات المنافسة'
        });
    }
});

/**
 * @route   GET /api/comments/:id
 * @desc    الحصول على تفاصيل تعليق محدد
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id)
            .populate('author', 'username email avatar')
            .populate({
                path: 'challenge',
                select: 'title category status organizer',
                populate: { path: 'organizer', select: 'username avatar' }
            })
            .populate({
                path: 'parentComment',
                select: 'content author',
                populate: { path: 'author', select: 'username avatar' }
            })
            .populate({
                path: 'replies',
                populate: { path: 'author', select: 'username avatar' },
                options: { sort: { createdAt: -1 } }
            });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'التعليق غير موجود'
            });
        }

        res.json({
            success: true,
            data: { comment }
        });
    } catch (error) {
        console.error('خطأ في جلب تفاصيل التعليق:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب تفاصيل التعليق'
        });
    }
});

/**
 * @route   POST /api/comments
 * @desc    إضافة تعليق جديد
 * @access  Private
 */
router.post('/', authenticate, validateCreateComment, async (req, res) => {
    try {
        const { challenge: challengeId, content, parentComment: parentCommentId } = req.body;
        
        // التحقق من وجود المنافسة
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: 'المنافسة غير موجودة'
            });
        }

        // التحقق من حالة المنافسة (يمكن التعليق على المنافسات النشطة والمكتملة)
        if (!['active', 'completed'].includes(challenge.status)) {
            return res.status(400).json({
                success: false,
                message: 'يمكن التعليق على المنافسات النشطة والمكتملة فقط'
            });
        }

        const commentData = {
            content,
            challenge: challengeId,
            author: req.user.id
        };

        // إذا كان التعليق رداً على تعليق آخر
        if (parentCommentId) {
            const parentComment = await Comment.findById(parentCommentId);
            if (!parentComment) {
                return res.status(404).json({
                    success: false,
                    message: 'التعليق المراد الرد عليه غير موجود'
                });
            }

            // التأكد من أن التعليق الأساسي ينتمي لنفس المنافسة
            if (parentComment.challenge.toString() !== challengeId) {
                return res.status(400).json({
                    success: false,
                    message: 'التعليق المراد الرد عليه لا ينتمي لنفس المنافسة'
                });
            }

            commentData.parentComment = parentCommentId;
        }

        // إنشاء التعليق الجديد
        const comment = new Comment(commentData);
        await comment.save();

        // إذا كان الرد، تحديث التعليق الأساسي بإضافة الرد
        if (parentCommentId) {
            await Comment.findByIdAndUpdate(parentCommentId, {
                $push: { replies: comment._id }
            });
        }

        await comment.populate('author', 'username email avatar');
        await comment.populate({
            path: 'challenge',
            select: 'title category status',
            populate: { path: 'organizer', select: 'username avatar' }
        });

        res.status(201).json({
            success: true,
            message: 'تم إضافة التعليق بنجاح',
            data: { comment }
        });
    } catch (error) {
        console.error('خطأ في إضافة التعليق:', error);
        res.status(400).json({
            success: false,
            message: 'خطأ في إضافة التعليق',
            errors: error.errors ? Object.values(error.errors).map(err => err.message) : []
        });
    }
});

/**
 * @route   PATCH /api/comments/:id
 * @desc    تحديث تعليق
 * @access  Private (Comment author only)
 */
router.patch('/:id', authenticate, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'التعليق غير موجود'
            });
        }

        // التحقق من الصلاحية
        if (comment.author.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'غير مسموح لك بتحديث هذا التعليق'
            });
        }

        // التحقق من عدم تعديل التعليقات المكثفة (محتوى حساس)
        if (comment.isModerated) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن تعديل التعليق بعد مراجعته من قبل الإدارة'
            });
        }

        const updatedComment = await Comment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('author', 'username email avatar')
         .populate({
            path: 'challenge',
            select: 'title category status',
            populate: { path: 'organizer', select: 'username avatar' }
         });

        res.json({
            success: true,
            message: 'تم تحديث التعليق بنجاح',
            data: { comment: updatedComment }
        });
    } catch (error) {
        console.error('خطأ في تحديث التعليق:', error);
        res.status(400).json({
            success: false,
            message: 'خطأ في تحديث التعليق',
            errors: error.errors ? Object.values(error.errors).map(err => err.message) : []
        });
    }
});

/**
 * @route   DELETE /api/comments/:id
 * @desc    حذف تعليق
 * @access  Private (Comment author, Challenge organizer, or Admin)
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'التعليق غير موجود'
            });
        }

        // التحقق من الصلاحية
        const canDelete = 
            comment.author.toString() === req.user.id || // مؤلف التعليق
            req.user.role === 'admin'; // الإدارة

        // إذا لم يكن مؤلف التعليق أو إداري، تحقق من صلاحية منظم المنافسة
        if (!canDelete) {
            const challenge = await Challenge.findById(comment.challenge);
            if (challenge && challenge.organizer.toString() === req.user.id) {
                canDelete = true;
            }
        }

        if (!canDelete) {
            return res.status(403).json({
                success: false,
                message: 'غير مسموح لك بحذف هذا التعليق'
            });
        }

        // حذف التعليق وجميع الردود المرتبطة به
        if (comment.replies && comment.replies.length > 0) {
            // حذف الردود أولاً
            await Comment.deleteMany({ parentComment: req.params.id });
        }

        // تحديث التعليق الأب إذا كان هذا تعليق فرعي
        if (comment.parentComment) {
            await Comment.findByIdAndUpdate(comment.parentComment, {
                $pull: { replies: req.params.id }
            });
        }

        // حذف التعليق
        await Comment.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'تم حذف التعليق بنجاح'
        });
    } catch (error) {
        console.error('خطأ في حذف التعليق:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف التعليق'
        });
    }
});

/**
 * @route   POST /api/comments/:id/like
 * @desc    إعجاب أو إلغاء إعجاب تعليق
 * @access  Private
 */
router.post('/:id/like', authenticate, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'التعليق غير موجود'
            });
        }

        const userId = req.user.id;
        const userIndex = comment.likes.indexOf(userId);

        let isLiked, likeCount;

        if (userIndex > -1) {
            // إلغاء الإعجاب
            comment.likes.splice(userIndex, 1);
            isLiked = false;
        } else {
            // إضافة إعجاب
            comment.likes.push(userId);
            isLiked = true;
        }

        await comment.save();
        likeCount = comment.likes.length;

        res.json({
            success: true,
            message: isLiked ? 'تم الإعجاب بالتعليق' : 'تم إلغاء الإعجاب بالتعليق',
            data: { isLiked, likeCount }
        });
    } catch (error) {
        console.error('خطأ في الإعجاب بالتعليق:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الإعجاب بالتعليق'
        });
    }
});

/**
 * @route   GET /api/comments/user/:userId
 * @desc    الحصول على تعليقات المستخدم
 * @access  Public
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // التحقق من وجود المستخدم
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        // حساب عدد التعليقات
        const totalCount = await Comment.countDocuments({ author: userId });
        const totalPages = Math.ceil(totalCount / limit);

        // جلب التعليقات
        const comments = await Comment.find({ author: userId })
            .populate('challenge', 'title category status')
            .populate({
                path: 'parentComment',
                select: 'content author',
                populate: { path: 'author', select: 'username avatar' }
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    avatar: user.avatar
                },
                totalComments: totalCount,
                comments,
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
        console.error('خطأ في جلب تعليقات المستخدم:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب تعليقات المستخدم'
        });
    }
});

/**
 * @route   POST /api/comments/:id/report
 * @desc    الإبلاغ عن تعليق
 * @access  Private
 */
router.post('/:id/report', authenticate, async (req, res) => {
    try {
        const { reason, details } = req.body;
        
        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'سبب الإبلاغ مطلوب'
            });
        }

        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'التعليق غير موجود'
            });
        }

        // التحقق من عدم الإبلاغ مسبقاً
        const existingReport = await require('../models/Report').findOne({
            targetType: 'comment',
            targetId: req.params.id,
            reporter: req.user.id,
            status: 'pending'
        });

        if (existingReport) {
            return res.status(400).json({
                success: false,
                message: 'لقد قمت بالإبلاغ عن هذا التعليق مسبقاً'
            });
        }

        // إنشاء بلاغ جديد
        const Report = require('../models/Report');
        const report = new Report({
            targetType: 'comment',
            targetId: req.params.id,
            reporter: req.user.id,
            reason,
            details,
            status: 'pending'
        });

        await report.save();

        res.json({
            success: true,
            message: 'تم الإبلاغ عن التعليق بنجاح'
        });
    } catch (error) {
        console.error('خطأ في الإبلاغ عن التعليق:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الإبلاغ عن التعليق'
        });
    }
});

module.exports = router;