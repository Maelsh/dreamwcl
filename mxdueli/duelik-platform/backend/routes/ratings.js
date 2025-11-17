const express = require('express');
const Joi = require('joi');
const { authenticate, authorize } = require('../middleware/auth');
const { validatePagination, validateCreateRating } = require('../middleware/validateRequest');
const validateRequest = require('../middleware/validateRequest');
const Rating = require('../models/Rating');
const Challenge = require('../models/Challenge');
const User = require('../models/User');

const router = express.Router();

// التحقق من صحة بيانات إضافة تقييم
const createRatingSchema = {
    challenge: Joi.string().required().messages({
        'string.empty': 'معرف المنافسة مطلوب'
    }),
    overallScore: Joi.number().integer().min(1).max(5).required().messages({
        'number.min': 'التقييم العام يجب أن يكون من 1 إلى 5',
        'number.max': 'التقييم العام يجب أن يكون من 1 إلى 5',
        'any.required': 'التقييم العام مطلوب'
    }),
    contentQuality: Joi.number().integer().min(1).max(5).required().messages({
        'number.min': 'تقييم جودة المحتوى يجب أن يكون من 1 إلى 5',
        'number.max': 'تقييم جودة المحتوى يجب أن يكون من 1 إلى 5',
        'any.required': 'تقييم جودة المحتوى مطلوب'
    }),
    presentation: Joi.number().integer().min(1).max(5).required().messages({
        'number.min': 'تقييم العرض يجب أن يكون من 1 إلى 5',
        'number.max': 'تقييم العرض يجب أن يكون من 1 إلى 5',
        'any.required': 'تقييم العرض مطلوب'
    }),
    engagement: Joi.number().integer().min(1).max(5).required().messages({
        'number.min': 'تقييم التفاعل يجب أن يكون من 1 إلى 5',
        'number.max': 'تقييم التفاعل يجب أن يكون من 1 إلى 5',
        'any.required': 'تقييم التفاعل مطلوب'
    }),
    innovation: Joi.number().integer().min(1).max(5).required().messages({
        'number.min': 'تقييم الإبداع يجب أن يكون من 1 إلى 5',
        'number.max': 'تقييم الإبداع يجب أن يكون من 1 إلى 5',
        'any.required': 'تقييم الإبداع مطلوب'
    }),
    review: Joi.string().max(500).allow('').optional()
};

// التحقق من صحة بيانات تحديث تقييم
const updateRatingSchema = {
    overallScore: Joi.number().integer().min(1).max(5),
    contentQuality: Joi.number().integer().min(1).max(5),
    presentation: Joi.number().integer().min(1).max(5),
    engagement: Joi.number().integer().min(1).max(5),
    innovation: Joi.number().integer().min(1).max(5),
    review: Joi.string().max(500).allow('').optional()
};

// التحقق من صحة معاملات البحث
const getRatingsSchema = {
    challenge: Joi.string().optional(),
    rater: Joi.string().optional(),
    sortBy: Joi.string().valid('createdAt', 'overallScore', 'contentQuality', 'presentation', 'engagement', 'innovation').default('createdAt'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10)
};

/**
 * @route   GET /api/ratings
 * @desc    الحصول على قائمة التقييمات مع إمكانية البحث والفلترة
 * @access  Public
 */
router.get('/', validatePagination, async (req, res) => {
    try {
        const { challenge, rater, sortBy, order, page, limit } = req.query;

        // بناء استعلام البحث
        const query = {};
        
        if (challenge) query.challenge = challenge;
        if (rater) query.rater = rater;

        // حساب عدد الوثائق الكلية
        const totalCount = await Rating.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        // تحديد الترتيب
        const sort = { [sortBy]: order === 'desc' ? -1 : 1 };
        
        // جلب البيانات مع الترتيب والتوزيع
        const ratings = await Rating.find(query)
            .populate('rater', 'username email avatar')
            .populate('challenge', 'title category status')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            success: true,
            data: {
                ratings,
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
        console.error('خطأ في جلب التقييمات:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب التقييمات'
        });
    }
});

/**
 * @route   GET /api/ratings/challenge/:challengeId
 * @desc    الحصول على تقييمات منافسة محددة
 * @access  Public
 */
router.get('/challenge/:challengeId', async (req, res) => {
    try {
        const { challengeId } = req.params;
        
        // التحقق من وجود المنافسة
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: 'المنافسة غير موجودة'
            });
        }

        // حساب متوسط التقييمات
        const averages = await Rating.getAverageRating(challengeId);
        
        // جلب جميع التقييمات
        const ratings = await Rating.find({ challenge: challengeId })
            .populate('rater', 'username email avatar')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                challenge: {
                    _id: challenge._id,
                    title: challenge.title,
                    category: challenge.category,
                    status: challenge.status
                },
                averages,
                totalRatings: ratings.length,
                ratings
            }
        });
    } catch (error) {
        console.error('خطأ في جلب تقييمات المنافسة:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب تقييمات المنافسة'
        });
    }
});

/**
 * @route   GET /api/ratings/:id
 * @desc    الحصول على تفاصيل تقييم محدد
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const rating = await Rating.findById(req.params.id)
            .populate('rater', 'username email avatar')
            .populate('challenge', 'title category status organizer');

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: 'التقييم غير موجود'
            });
        }

        res.json({
            success: true,
            data: { rating }
        });
    } catch (error) {
        console.error('خطأ في جلب تفاصيل التقييم:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب تفاصيل التقييم'
        });
    }
});

/**
 * @route   POST /api/ratings
 * @desc    إضافة تقييم جديد
 * @access  Private
 */
router.post('/', authenticate, validateCreateRating, async (req, res) => {
    try {
        const { challenge: challengeId, ...ratingData } = req.body;
        
        // التحقق من وجود المنافسة
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: 'المنافسة غير موجودة'
            });
        }

        // التحقق من أن المنافسة مكتملة
        if (challenge.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'يمكن تقييم المنافسات المكتملة فقط'
            });
        }

        // التحقق من عدم تقييم المستخدم لنفسه
        if (challenge.organizer.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن تقييم منافستك الشخصية'
            });
        }

        // التحقق من عدم تقييم المستخدم لنفسه كمشارك
        const isParticipant = challenge.participants.some(p => p.user.toString() === req.user.id);
        if (isParticipant) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن تقييم مشاركتك الشخصية في المنافسة'
            });
        }

        // التحقق من عدم تقييم المستخدم مسبقاً
        const existingRating = await Rating.findOne({
            challenge: challengeId,
            rater: req.user.id
        });

        if (existingRating) {
            return res.status(400).json({
                success: false,
                message: 'لقد قمت بتقييم هذه المنافسة مسبقاً'
            });
        }

        // إنشاء التقييم الجديد
        const rating = new Rating({
            ...ratingData,
            challenge: challengeId,
            rater: req.user.id
        });

        await rating.save();
        await rating.populate('rater', 'username email avatar');
        await rating.populate('challenge', 'title category organizer');

        res.status(201).json({
            success: true,
            message: 'تم إضافة التقييم بنجاح',
            data: { rating }
        });
    } catch (error) {
        console.error('خطأ في إضافة التقييم:', error);
        res.status(400).json({
            success: false,
            message: 'خطأ في إضافة التقييم',
            errors: error.errors ? Object.values(error.errors).map(err => err.message) : []
        });
    }
});

/**
 * @route   PATCH /api/ratings/:id
 * @desc    تحديث تقييم
 * @access  Private (Rating owner only)
 */
router.patch('/:id', authenticate, async (req, res) => {
    try {
        const rating = await Rating.findById(req.params.id);

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: 'التقييم غير موجود'
            });
        }

        // التحقق من الصلاحية
        if (rating.rater.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'غير مسموح لك بتحديث هذا التقييم'
            });
        }

        // التحقق من عدم تغيير معرف المنافسة
        if (req.body.challenge && req.body.challenge !== rating.challenge.toString()) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن تغيير معرف المنافسة'
            });
        }

        const updatedRating = await Rating.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('rater', 'username email avatar')
         .populate('challenge', 'title category organizer');

        res.json({
            success: true,
            message: 'تم تحديث التقييم بنجاح',
            data: { rating: updatedRating }
        });
    } catch (error) {
        console.error('خطأ في تحديث التقييم:', error);
        res.status(400).json({
            success: false,
            message: 'خطأ في تحديث التقييم',
            errors: error.errors ? Object.values(error.errors).map(err => err.message) : []
        });
    }
});

/**
 * @route   DELETE /api/ratings/:id
 * @desc    حذف تقييم
 * @access  Private (Rating owner or Admin)
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const rating = await Rating.findById(req.params.id);

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: 'التقييم غير موجود'
            });
        }

        // التحقق من الصلاحية
        if (rating.rater.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'غير مسموح لك بحذف هذا التقييم'
            });
        }

        // حذف التقييم
        await Rating.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'تم حذف التقييم بنجاح'
        });
    } catch (error) {
        console.error('خطأ في حذف التقييم:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف التقييم'
        });
    }
});

/**
 * @route   GET /api/ratings/user/:userId
 * @desc    الحصول على تقييمات المستخدم
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

        // حساب عدد التقييمات
        const totalCount = await Rating.countDocuments({ rater: userId });
        const totalPages = Math.ceil(totalCount / limit);

        // جلب التقييمات
        const ratings = await Rating.find({ rater: userId })
            .populate('challenge', 'title category status')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // حساب متوسط تقييمات المستخدم
        const averages = await Rating.getUserAverageRatings(userId);

        res.json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    avatar: user.avatar
                },
                averages,
                totalRatings: totalCount,
                ratings,
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
        console.error('خطأ في جلب تقييمات المستخدم:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب تقييمات المستخدم'
        });
    }
});

/**
 * @route   GET /api/ratings/statistics
 * @desc    الحصول على إحصائيات التقييمات
 * @access  Private
 */
router.get('/statistics', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;

        // إحصائيات تقييمات المستخدم
        const userRatings = await Rating.find({ rater: userId });
        const userStats = {
            totalRatings: userRatings.length,
            averageRatings: {
                overallScore: 0,
                contentQuality: 0,
                presentation: 0,
                engagement: 0,
                innovation: 0
            },
            ratingsByCategory: {},
            recentActivity: []
        };

        if (userRatings.length > 0) {
            // حساب المتوسطات
            userStats.averageRatings.overallScore = userRatings.reduce((sum, r) => sum + r.overallScore, 0) / userRatings.length;
            userStats.averageRatings.contentQuality = userRatings.reduce((sum, r) => sum + r.contentQuality, 0) / userRatings.length;
            userStats.averageRatings.presentation = userRatings.reduce((sum, r) => sum + r.presentation, 0) / userRatings.length;
            userStats.averageRatings.engagement = userRatings.reduce((sum, r) => sum + r.engagement, 0) / userRatings.length;
            userStats.averageRatings.innovation = userRatings.reduce((sum, r) => sum + r.innovation, 0) / userRatings.length;

            // إحصائيات حسب الفئة
            const ratingCountsByCategory = {};
            userRatings.forEach(rating => {
                const challenge = rating.challenge;
                if (challenge) {
                    const category = challenge.category;
                    if (!ratingCountsByCategory[category]) {
                        ratingCountsByCategory[category] = { count: 0, totalScore: 0 };
                    }
                    ratingCountsByCategory[category].count++;
                    ratingCountsByCategory[category].totalScore += rating.overallScore;
                }
            });

            userStats.ratingsByCategory = ratingCountsByCategory;

            // آخر النشاطات
            userStats.recentActivity = await Rating.find({ rater: userId })
                .populate('challenge', 'title category')
                .sort({ createdAt: -1 })
                .limit(5)
                .select('overallScore contentQuality presentation engagement innovation review createdAt challenge');
        }

        // إحصائيات عامة للمنصة
        const platformStats = {
            totalRatings: await Rating.countDocuments(),
            averageRating: await Rating.aggregate([
                { $group: { _id: null, avg: { $avg: '$overallScore' } } }
            ]),
            ratingsByCategory: await Rating.aggregate([
                { $lookup: { from: 'challenges', localField: 'challenge', foreignField: '_id', as: 'challengeData' } },
                { $unwind: '$challengeData' },
                { $group: { _id: '$challengeData.category', count: { $sum: 1 }, avgRating: { $avg: '$overallScore' } } }
            ]),
            topRatedChallenges: await Rating.aggregate([
                { $lookup: { from: 'challenges', localField: 'challenge', foreignField: '_id', as: 'challengeData' } },
                { $unwind: '$challengeData' },
                { $group: { _id: '$challenge', avgRating: { $avg: '$overallScore' }, reviewCount: { $sum: 1 } } },
                { $sort: { avgRating: -1, reviewCount: -1 } },
                { $limit: 10 },
                { $lookup: { from: 'challenges', localField: '_id', foreignField: '_id', as: 'challengeInfo' } },
                { $unwind: '$challengeInfo' }
            ])
        };

        res.json({
            success: true,
            data: {
                user: userStats,
                platform: platformStats
            }
        });
    } catch (error) {
        console.error('خطأ في جلب إحصائيات التقييمات:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب إحصائيات التقييمات'
        });
    }
});

module.exports = router;