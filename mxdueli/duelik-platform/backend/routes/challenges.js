const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const { validateChallengeQuery, validateCreateChallenge, validateUpdateChallenge } = require('../middleware/validateRequest');
const validateRequest = require('../middleware/validateRequest');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Rating = require('../models/Rating');
const Finance = require('../models/Finance');
const { uploadImage } = require('../utils/upload');

const router = express.Router();

// التحقق من صحة بيانات إنشاء المنافسة
const createChallengeSchema = {
    title: Joi.string().required().min(5).max(100).messages({
        'string.empty': 'عنوان المنافسة مطلوب',
        'string.min': 'عنوان المنافسة يجب أن يكون 5 أحرف على الأقل',
        'string.max': 'عنوان المنافسة يجب ألا يزيد عن 100 حرف'
    }),
    description: Joi.string().required().min(20).max(1000).messages({
        'string.empty': 'وصف المنافسة مطلوب',
        'string.min': 'وصف المنافسة يجب أن يكون 20 حرف على الأقل',
        'string.max': 'وصف المنافسة يجب ألا يزيد عن 1000 حرف'
    }),
    category: Joi.string().required().valid('debate', 'science', 'talents', 'culture').messages({
        'any.only': 'فئة المنافسة غير صحيحة',
        'string.empty': 'فئة المنافسة مطلوبة'
    }),
    topic: Joi.string().required().min(3).max(200).messages({
        'string.empty': 'موضوع المنافسة مطلوب',
        'string.min': 'موضوع المنافسة يجب أن يكون 3 أحرف على الأقل',
        'string.max': 'موضوع المنافسة يجب ألا يزيد عن 200 حرف'
    }),
    difficulty: Joi.string().required().valid('beginner', 'intermediate', 'advanced').messages({
        'any.only': 'مستوى الصعوبة يجب أن يكون: مبتدئ، متوسط، متقدم'
    }),
    maxParticipants: Joi.number().integer().min(2).max(10).default(2),
    entryFee: Joi.number().min(0).default(0),
    prizePool: Joi.number().min(0).default(0),
    scheduledStartTime: Joi.date().greater('now').required().messages({
        'date.greater': 'يجب أن تكون وقت البدء في المستقبل',
        'any.required': 'وقت البدء مطلوب'
    })
};

// التحقق من صحة بيانات تحديث المنافسة
const updateChallengeSchema = {
    title: Joi.string().min(5).max(100),
    description: Joi.string().min(20).max(1000),
    topic: Joi.string().min(3).max(200),
    maxParticipants: Joi.number().integer().min(2).max(10),
    entryFee: Joi.number().min(0),
    prizePool: Joi.number().min(0),
    scheduledStartTime: Joi.date().greater('now')
};

// التحقق من صحة البحث والفلترة
const filterChallengesSchema = {
    category: Joi.string().valid('debate', 'science', 'talents', 'culture'),
    status: Joi.string().valid('upcoming', 'active', 'completed', 'cancelled'),
    difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced'),
    search: Joi.string().max(100),
    sortBy: Joi.string().valid('createdAt', 'scheduledStartTime', 'participants', 'prizePool').default('scheduledStartTime'),
    order: Joi.string().valid('asc', 'desc').default('asc'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10)
};

/**
 * @route   GET /api/challenges
 * @desc    الحصول على قائمة المنافسات مع إمكانية البحث والفلترة
 * @access  Public
 */
router.get('/', validateChallengeQuery, async (req, res) => {
    try {
        const { category, status, difficulty, search, sortBy, order, page, limit } = req.query;

        // بناء استعلام البحث
        const query = {};
        
        if (category) query.category = category;
        if (status) query.status = status;
        if (difficulty) query.difficulty = difficulty;
        
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { topic: { $regex: search, $options: 'i' } }
            ];
        }

        // حساب عدد الوثائق الكلية
        const totalCount = await Challenge.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        // تحديد الترتيب
        const sort = { [sortBy]: order === 'desc' ? -1 : 1 };
        
        // جلب البيانات مع الترتيب والتوزيع
        const challenges = await Challenge.find(query)
            .populate('organizer', 'username email avatar')
            .populate('participants.user', 'username email avatar')
            .populate('winner', 'username email avatar')
            .sort(sort)
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
 * @route   GET /api/challenges/my-challenges
 * @desc    الحصول على منافسات المستخدم الحالي
 * @access  Private
 */
router.get('/my-challenges', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;

        const query = {
            $or: [
                { organizer: userId },
                { 'participants.user': userId }
            ]
        };

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
        console.error('خطأ في جلب منافسات المستخدم:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب منافسات المستخدم'
        });
    }
});

/**
 * @route   GET /api/challenges/:id
 * @desc    الحصول على تفاصيل منافسة محددة
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id)
            .populate('organizer', 'username email avatar bio')
            .populate('participants.user', 'username email avatar bio')
            .populate('winner', 'username email avatar bio')
            .populate('moderators', 'username email avatar');

        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: 'المنافسة غير موجودة'
            });
        }

        // زيادة عدد المشاهدات
        await Challenge.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

        // جلب التقييمات والتعليقات
        const ratings = await Rating.find({ challenge: req.params.id })
            .populate('rater', 'username avatar')
            .sort({ createdAt: -1 });

        const comments = await Comment.find({ challenge: req.params.id })
            .populate('author', 'username avatar')
            .populate({
                path: 'replies.author',
                select: 'username avatar'
            })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                challenge,
                ratings,
                comments
            }
        });
    } catch (error) {
        console.error('خطأ في جلب تفاصيل المنافسة:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب تفاصيل المنافسة'
        });
    }
});

/**
 * @route   POST /api/challenges
 * @desc    إنشاء منافسة جديدة
 * @access  Private
 */
router.post('/', authenticate, validateCreateChallenge, async (req, res) => {
    try {
        const challengeData = {
            ...req.body,
            organizer: req.user.id
        };

        const challenge = new Challenge(challengeData);
        await challenge.save();

        await challenge.populate('organizer', 'username email avatar');

        res.status(201).json({
            success: true,
            message: 'تم إنشاء المنافسة بنجاح',
            data: { challenge }
        });
    } catch (error) {
        console.error('خطأ في إنشاء المنافسة:', error);
        res.status(400).json({
            success: false,
            message: 'خطأ في إنشاء المنافسة',
            errors: error.errors ? Object.values(error.errors).map(err => err.message) : []
        });
    }
});

/**
 * @route   PATCH /api/challenges/:id
 * @desc    تحديث منافسة
 * @access  Private (Organizer only)
 */
router.patch('/:id', authenticate, validateUpdateChallenge, async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);

        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: 'المنافسة غير موجودة'
            });
        }

        // التحقق من الصلاحية
        if (challenge.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'غير مسموح لك بتحديث هذه المنافسة'
            });
        }

        // منع تحديث المنافسة إذا كانت نشطة أو مكتملة
        if (['active', 'completed'].includes(challenge.status)) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن تحديث منافسة نشطة أو مكتملة'
            });
        }

        const updatedChallenge = await Challenge.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('organizer', 'username email avatar')
         .populate('participants.user', 'username email avatar');

        res.json({
            success: true,
            message: 'تم تحديث المنافسة بنجاح',
            data: { challenge: updatedChallenge }
        });
    } catch (error) {
        console.error('خطأ في تحديث المنافسة:', error);
        res.status(400).json({
            success: false,
            message: 'خطأ في تحديث المنافسة',
            errors: error.errors ? Object.values(error.errors).map(err => err.message) : []
        });
    }
});

/**
 * @route   POST /api/challenges/:id/join
 * @desc    الانضمام إلى منافسة
 * @access  Private
 */
router.post('/:id/join', authenticate, async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);

        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: 'المنافسة غير موجودة'
            });
        }

        // التحقق من حالة المنافسة
        if (challenge.status !== 'upcoming') {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن الانضمام إلى منافسة نشطة أو مكتملة'
            });
        }

        // التحقق من الوقت المتبقي للانضمام
        const timeUntilStart = new Date(challenge.scheduledStartTime) - new Date();
        if (timeUntilStart < 30 * 60 * 1000) { // 30 دقيقة قبل البداية
            return res.status(400).json({
                success: false,
                message: 'لم يعد بإمكان الانضمام إلى هذه المنافسة (أقل من 30 دقيقة على البداية)'
            });
        }

        // التحقق من عدد المشاركين
        if (challenge.participants.length >= challenge.maxParticipants) {
            return res.status(400).json({
                success: false,
                message: 'المنافسة ممتلئة'
            });
        }

        // التحقق من عدم انضمام المستخدم مسبقاً
        const alreadyJoined = challenge.participants.some(p => p.user.toString() === req.user.id);
        if (alreadyJoined) {
            return res.status(400).json({
                success: false,
                message: 'أنت منضم بالفعل إلى هذه المنافسة'
            });
        }

        // التحقق من رسوم الانضمام
        if (challenge.entryFee > 0) {
            const user = await User.findById(req.user.id);
            if (user.balance < challenge.entryFee) {
                return res.status(400).json({
                    success: false,
                    message: 'رصيدك غير كافي لدفع رسوم الانضمام'
                });
            }

            // خصم الرسوم من رصيد المستخدم
            user.balance -= challenge.entryFee;
            await user.save();

            // إضافة معاملة مالية
            const finance = new Finance({
                user: req.user.id,
                type: 'expense',
                amount: challenge.entryFee,
                description: `رسوم الانضمام إلى منافسة: ${challenge.title}`,
                challenge: req.params.id,
                status: 'completed'
            });
            await finance.save();
        }

        // إضافة المستخدم إلى المشاركين
        challenge.participants.push({
            user: req.user.id,
            joinedAt: new Date(),
            status: 'confirmed'
        });

        await challenge.save();
        await challenge.populate('participants.user', 'username email avatar');

        res.json({
            success: true,
            message: 'تم الانضمام إلى المنافسة بنجاح',
            data: { 
                participants: challenge.participants,
                entryFee: challenge.entryFee 
            }
        });
    } catch (error) {
        console.error('خطأ في الانضمام إلى المنافسة:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الانضمام إلى المنافسة'
        });
    }
});

/**
 * @route   POST /api/challenges/:id/leave
 * @desc    مغادرة منافسة
 * @access  Private
 */
router.post('/:id/leave', authenticate, async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);

        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: 'المنافسة غير موجودة'
            });
        }

        // التحقق من حالة المنافسة
        if (challenge.status !== 'upcoming') {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن مغادرة منافسة نشطة أو مكتملة'
            });
        }

        // التحقق من الوقت المتبقي للمغادرة
        const timeUntilStart = new Date(challenge.scheduledStartTime) - new Date();
        if (timeUntilStart < 30 * 60 * 1000) { // 30 دقيقة قبل البداية
            return res.status(400).json({
                success: false,
                message: 'لم يعد بإمكان مغادرة هذه المنافسة (أقل من 30 دقيقة على البداية)'
            });
        }

        // التحقق من انضمام المستخدم
        const participantIndex = challenge.participants.findIndex(p => p.user.toString() === req.user.id);
        if (participantIndex === -1) {
            return res.status(400).json({
                success: false,
                message: 'أنت لست منضم إلى هذه المنافسة'
            });
        }

        // استرداد رسوم الانضمام
        if (challenge.entryFee > 0) {
            const user = await User.findById(req.user.id);
            user.balance += challenge.entryFee;
            await user.save();

            // إضافة معاملة مالية
            const finance = new Finance({
                user: req.user.id,
                type: 'refund',
                amount: challenge.entryFee,
                description: `استرداد رسوم الانضمام إلى منافسة: ${challenge.title}`,
                challenge: req.params.id,
                status: 'completed'
            });
            await finance.save();
        }

        // إزالة المستخدم من المشاركين
        challenge.participants.splice(participantIndex, 1);
        await challenge.save();

        res.json({
            success: true,
            message: 'تم مغادرة المنافسة بنجاح',
            data: { refundAmount: challenge.entryFee }
        });
    } catch (error) {
        console.error('خطأ في مغادرة المنافسة:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في مغادرة المنافسة'
        });
    }
});

/**
 * @route   POST /api/challenges/:id/start
 * @desc    بدء منافسة
 * @access  Private (Organizer only)
 */
router.post('/:id/start', authenticate, async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id)
            .populate('organizer', 'username email')
            .populate('participants.user', 'username email');

        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: 'المنافسة غير موجودة'
            });
        }

        // التحقق من الصلاحية
        if (challenge.organizer._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'غير مسموح لك ببدء هذه المنافسة'
            });
        }

        // التحقق من حالة المنافسة
        if (challenge.status !== 'upcoming') {
            return res.status(400).json({
                success: false,
                message: 'يمكن بدء المنافسة المخططة فقط'
            });
        }

        // التحقق من وجود مشاركين كافيين
        if (challenge.participants.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'يجب أن يكون هناك مشاركين على الأقل 2 لبدء المنافسة'
            });
        }

        // بدء المنافسة
        challenge.status = 'active';
        challenge.startedAt = new Date();
        await challenge.save();

        // إشعار جميع المشاركين عبر Socket.IO
        const io = req.app.get('io');
        if (io) {
            challenge.participants.forEach(participant => {
                io.to(participant.user._id.toString()).emit('challenge_started', {
                    challengeId: challenge._id,
                    title: challenge.title,
                    category: challenge.category,
                    startTime: challenge.startedAt
                });
            });
        }

        res.json({
            success: true,
            message: 'تم بدء المنافسة بنجاح',
            data: { 
                challenge: {
                    _id: challenge._id,
                    title: challenge.title,
                    status: challenge.status,
                    startedAt: challenge.startedAt
                }
            }
        });
    } catch (error) {
        console.error('خطأ في بدء المنافسة:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في بدء المنافسة'
        });
    }
});

/**
 * @route   POST /api/challenges/:id/end
 * @desc    إنهاء منافسة
 * @access  Private (Organizer or Admin)
 */
router.post('/:id/end', authenticate, async (req, res) => {
    try {
        const { winnerId, endReason } = req.body;

        const challenge = await Challenge.findById(req.params.id)
            .populate('organizer', 'username email')
            .populate('participants.user', 'username email')
            .populate('winner', 'username email');

        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: 'المنافسة غير موجودة'
            });
        }

        // التحقق من الصلاحية
        if (challenge.organizer._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'غير مسموح لك بإنهاء هذه المنافسة'
            });
        }

        // التحقق من حالة المنافسة
        if (challenge.status !== 'active') {
            return res.status(400).json({
                valid: false,
                message: 'يمكن إنهاء المنافسة النشطة فقط'
            });
        }

        // التحقق من صحة الفائز
        if (winnerId) {
            const validParticipant = challenge.participants.some(p => p.user._id.toString() === winnerId);
            if (!validParticipant) {
                return res.status(400).json({
                    success: false,
                    message: 'الفائز يجب أن يكون من المشاركين في المنافسة'
                });
            }
        }

        // إنهاء المنافسة
        challenge.status = 'completed';
        challenge.completedAt = new Date();
        challenge.endReason = endReason || 'completed';
        
        if (winnerId) {
            challenge.winner = winnerId;
        }

        await challenge.save();

        // حساب وإجراء المدفوعات إذا كان هناك جوائز
        if (challenge.prizePool > 0 && challenge.winner) {
            const finance = new Finance();
            await finance.processChallengePayout(challenge._id);
        }

        // إشعار جميع المشاركين
        const io = req.app.get('io');
        if (io) {
            challenge.participants.forEach(participant => {
                io.to(participant.user._id.toString()).emit('challenge_ended', {
                    challengeId: challenge._id,
                    title: challenge.title,
                    winner: challenge.winner,
                    prizePool: challenge.prizePool,
                    endReason: challenge.endReason
                });
            });
        }

        res.json({
            success: true,
            message: 'تم إنهاء المنافسة بنجاح',
            data: { 
                challenge: {
                    _id: challenge._id,
                    title: challenge.title,
                    status: challenge.status,
                    completedAt: challenge.completedAt,
                    winner: challenge.winner,
                    prizePool: challenge.prizePool,
                    endReason: challenge.endReason
                }
            }
        });
    } catch (error) {
        console.error('خطأ في إنهاء المنافسة:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنهاء المنافسة'
        });
    }
});

/**
 * @route   DELETE /api/challenges/:id
 * @desc    حذف منافسة
 * @access  Private (Organizer or Admin)
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);

        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: 'المنافسة غير موجودة'
            });
        }

        // التحقق من الصلاحية
        if (challenge.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'غير مسموح لك بحذف هذه المنافسة'
            });
        }

        // منع حذف المنافسة النشطة
        if (challenge.status === 'active') {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن حذف منافسة نشطة'
            });
        }

        // استرداد رسوم الانضمام لجميع المشاركين إذا كانت هناك رسوم
        if (challenge.entryFee > 0) {
            for (const participant of challenge.participants) {
                if (participant.status === 'confirmed') {
                    const user = await User.findById(participant.user);
                    user.balance += challenge.entryFee;
                    await user.save();

                    // إضافة معاملة مالية
                    const finance = new Finance({
                        user: participant.user,
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

        // حذف المنافسة وجميع البيانات المرتبطة
        await Challenge.findByIdAndDelete(req.params.id);

        // حذف التعليقات والتقييمات والبلاغات المرتبطة
        await Comment.deleteMany({ challenge: req.params.id });
        await Rating.deleteMany({ challenge: req.params.id });
        await require('../models/Report').deleteMany({ challenge: req.params.id });

        res.json({
            success: true,
            message: 'تم حذف المنافسة بنجاح'
        });
    } catch (error) {
        console.error('خطأ في حذف المنافسة:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف المنافسة'
        });
    }
});

module.exports = router;