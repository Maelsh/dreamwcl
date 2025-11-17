const express = require('express');
const Joi = require('joi');
const { authenticate, authorize } = require('../middleware/auth');
const { validateFinanceId, validatePagination } = require('../middleware/validateRequest');
const validateRequest = require('../middleware/validateRequest');
const Finance = require('../models/Finance');
const User = require('../models/User');
const Challenge = require('../models/Challenge');

const router = express.Router();

// التحقق من صحة بيانات طلب السحب
const createWithdrawalSchema = {
    amount: Joi.number().required().min(10).messages({
        'number.min': 'مبلغ السحب يجب أن يكون 10 ريال على الأقل',
        'any.required': 'مبلغ السحب مطلوب'
    }),
    method: Joi.string().required().valid('bank_transfer', 'paypal', 'cryptocurrency').messages({
        'any.only': 'طريقة السحب غير صحيحة',
        'any.required': 'طريقة السحب مطلوبة'
    }),
    accountDetails: Joi.object().required().messages({
        'object.base': 'تفاصيل الحساب مطلوبة',
        'any.required': 'تفاصيل الحساب مطلوبة'
    })
};

// التحقق من صحة معاملات البحث
const getTransactionsSchema = {
    type: Joi.string().valid('income', 'expense', 'refund', 'withdrawal', 'deposit').optional(),
    status: Joi.string().valid('pending', 'completed', 'failed', 'cancelled').optional(),
    method: Joi.string().valid('bank_transfer', 'paypal', 'cryptocurrency', 'balance').optional(),
    fromDate: Joi.date().optional(),
    toDate: Joi.date().optional(),
    minAmount: Joi.number().min(0).optional(),
    maxAmount: Joi.number().min(0).optional(),
    sortBy: Joi.string().valid('createdAt', 'amount', 'status').default('createdAt'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10)
};

/**
 * @route   GET /api/finance/balance
 * @desc    الحصول على رصيد المستخدم الحالي
 * @access  Private
 */
router.get('/balance', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // جلب رصيد المستخدم من قاعدة البيانات
        const user = await User.findById(userId).select('balance currency');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        // حساب إجمالي الأرباح والخسائر
        const totalIncome = await Finance.aggregate([
            { $match: { user: user._id, type: 'income', status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalExpenses = await Finance.aggregate([
            { $match: { user: user._id, type: 'expense', status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalWithdrawals = await Finance.aggregate([
            { $match: { user: user._id, type: 'withdrawal', status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const availableBalance = user.balance || 0;
        const pendingWithdrawals = await Finance.aggregate([
            { $match: { user: user._id, type: 'withdrawal', status: 'pending' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            success: true,
            data: {
                currentBalance: availableBalance,
                currency: user.currency || 'SAR',
                totalEarnings: totalIncome[0]?.total || 0,
                totalExpenses: totalExpenses[0]?.total || 0,
                totalWithdrawn: totalWithdrawals[0]?.total || 0,
                pendingWithdrawals: pendingWithdrawals[0]?.total || 0,
                availableForWithdrawal: availableBalance - (pendingWithdrawals[0]?.total || 0)
            }
        });
    } catch (error) {
        console.error('خطأ في جلب الرصيد:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الرصيد'
        });
    }
});

/**
 * @route   GET /api/finance/transactions
 * @desc    الحصول على معاملات المستخدم
 * @access  Private
 */
router.get('/transactions', authenticate, validatePagination, async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, status, method, fromDate, toDate, minAmount, maxAmount, sortBy, order, page, limit } = req.query;

        // بناء استعلام البحث
        const query = { user: userId };
        
        if (type) query.type = type;
        if (status) query.status = status;
        if (method) query.method = method;
        
        // فلترة بالتاريخ
        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) query.createdAt.$gte = new Date(fromDate);
            if (toDate) query.createdAt.$lte = new Date(toDate);
        }
        
        // فلترة بالمبلغ
        if (minAmount || maxAmount) {
            query.amount = {};
            if (minAmount) query.amount.$gte = minAmount;
            if (maxAmount) query.amount.$lte = maxAmount;
        }

        // حساب عدد الوثائق الكلية
        const totalCount = await Finance.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        // تحديد الترتيب
        const sort = { [sortBy]: order === 'desc' ? -1 : 1 };
        
        // جلب البيانات مع الترتيب والتوزيع
        const transactions = await Finance.find(query)
            .populate('challenge', 'title category status')
            .populate('processedBy', 'username')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        // حساب الإحصائيات
        const stats = await Finance.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$status',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                transactions,
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
        console.error('خطأ في جلب المعاملات:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب المعاملات'
        });
    }
});

/**
 * @route   GET /api/finance/transactions/:id
 * @desc    الحصول على تفاصيل معاملة محددة
 * @access  Private
 */
router.get('/transactions/:id', authenticate, async (req, res) => {
    try {
        const transaction = await Finance.findById(req.params.id)
            .populate('user', 'username email avatar')
            .populate('challenge', 'title category status organizer')
            .populate('processedBy', 'username email');

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'المعاملة غير موجودة'
            });
        }

        // التحقق من الصلاحية
        if (transaction.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'غير مسموح لك بعرض تفاصيل هذه المعاملة'
            });
        }

        res.json({
            success: true,
            data: { transaction }
        });
    } catch (error) {
        console.error('خطأ في جلب تفاصيل المعاملة:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب تفاصيل المعاملة'
        });
    }
});

/**
 * @route   POST /api/finance/withdraw
 * @desc    طلب سحب أموال
 * @access  Private
 */
router.post('/withdraw', authenticate, async (req, res) => {
    try {
        const { amount, method, accountDetails } = req.body;
        const userId = req.user.id;

        // التحقق من رصيد المستخدم
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        // التحقق من وجود رصيد كافي
        if (user.balance < amount) {
            return res.status(400).json({
                success: false,
                message: 'رصيدك غير كافي لهذا المبلغ'
            });
        }

        // التحقق من عدم وجود طلب سحب معلق
        const pendingWithdrawal = await Finance.findOne({
            user: userId,
            type: 'withdrawal',
            status: 'pending'
        });

        if (pendingWithdrawal) {
            return res.status(400).json({
                success: false,
                message: 'لديك طلب سحب معلق مسبقاً'
            });
        }

        // إنشاء طلب السحب
        const withdrawal = new Finance({
            user: userId,
            type: 'withdrawal',
            amount: -amount, // سالب للمعاملات الخارجة
            description: `طلب سحب ${amount} ريال عبر ${method}`,
            method,
            accountDetails,
            status: 'pending'
        });

        await withdrawal.save();
        await withdrawal.populate('user', 'username email');

        // إرسال إشعار للإدارة عبر Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.to('admin').emit('new_withdrawal_request', {
                withdrawalId: withdrawal._id,
                user: withdrawal.user,
                amount,
                method,
                createdAt: withdrawal.createdAt
            });
        }

        res.status(201).json({
            success: true,
            message: 'تم إرسال طلب السحب بنجاح',
            data: { 
                withdrawal: {
                    _id: withdrawal._id,
                    amount,
                    method,
                    status: withdrawal.status,
                    createdAt: withdrawal.createdAt
                }
            }
        });
    } catch (error) {
        console.error('خطأ في طلب السحب:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في طلب السحب'
        });
    }
});

/**
 * @route   GET /api/finance/earnings
 * @desc    الحصول على إحصائيات الأرباح
 * @access  Private
 */
router.get('/earnings', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = '30d' } = req.query;

        // تحديد الفترة الزمنية
        let dateFilter = {};
        const now = new Date();
        
        switch (period) {
            case '7d':
                dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
                break;
            case '30d':
                dateFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
                break;
            case '90d':
                dateFilter = { createdAt: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } };
                break;
            case '1y':
                dateFilter = { createdAt: { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) } };
                break;
        }

        // الأرباح حسب الفئة
        const earningsByCategory = await Finance.aggregate([
            { 
                $match: { 
                    user: userId, 
                    type: 'income', 
                    status: 'completed',
                    ...dateFilter
                } 
            },
            { 
                $lookup: { 
                    from: 'challenges', 
                    localField: 'challenge', 
                    foreignField: '_id', 
                    as: 'challengeData' 
                } 
            },
            { $unwind: '$challengeData' },
            { 
                $group: { 
                    _id: '$challengeData.category', 
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                } 
            },
            { $sort: { totalAmount: -1 } }
        ]);

        // الأرباح اليومية للأسبوع الماضي
        const dailyEarnings = await Finance.aggregate([
            { 
                $match: { 
                    user: userId, 
                    type: 'income', 
                    status: 'completed',
                    createdAt: { 
                        $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) 
                    }
                } 
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    amount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // أفضل المنافسات ربحاً
        const topEarningChallenges = await Finance.aggregate([
            { 
                $match: { 
                    user: userId, 
                    type: 'income', 
                    status: 'completed',
                    ...dateFilter
                } 
            },
            { 
                $lookup: { 
                    from: 'challenges', 
                    localField: 'challenge', 
                    foreignField: '_id', 
                    as: 'challengeData' 
                } 
            },
            { $unwind: '$challengeData' },
            {
                $group: {
                    _id: '$challenge',
                    challengeTitle: { $first: '$challengeData.title' },
                    challengeCategory: { $first: '$challengeData.category' },
                    totalEarnings: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalEarnings: -1 } },
            { $limit: 10 }
        ]);

        // الإحصائيات العامة
        const totalStats = await Finance.aggregate([
            { $match: { user: userId, status: 'completed' } },
            {
                $group: {
                    _id: '$type',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                period,
                earningsByCategory,
                dailyEarnings,
                topEarningChallenges,
                totalStats
            }
        });
    } catch (error) {
        console.error('خطأ في جلب إحصائيات الأرباح:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب إحصائيات الأرباح'
        });
    }
});

/**
 * @route   POST /api/finance/deposit
 * @desc    إيداع أموال (للاختبار أو الدعم)
 * @access  Private (Admin only for production)
 */
router.post('/deposit', authenticate, async (req, res) => {
    try {
        const { amount, description = 'إيداع يدوي' } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'مبلغ الإيداع يجب أن يكون أكبر من صفر'
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        // إضافة المبلغ إلى رصيد المستخدم
        user.balance = (user.balance || 0) + amount;
        await user.save();

        // إنشاء معاملة إيداع
        const deposit = new Finance({
            user: req.user.id,
            type: 'deposit',
            amount: amount,
            description: description,
            status: 'completed'
        });

        await deposit.save();

        res.json({
            success: true,
            message: 'تم إيداع المبلغ بنجاح',
            data: {
                newBalance: user.balance,
                deposit
            }
        });
    } catch (error) {
        console.error('خطأ في الإيداع:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الإيداع'
        });
    }
});

/**
 * @route   GET /api/finance/admin/withdrawals
 * @desc    الحصول على طلبات السحب للمشرفين
 * @access  Private (Admin only)
 */
router.get('/admin/withdrawals', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { status = 'pending', page = 1, limit = 10 } = req.query;

        const query = { type: 'withdrawal' };
        if (status) query.status = status;

        const totalCount = await Finance.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        const withdrawals = await Finance.find(query)
            .populate('user', 'username email avatar balance')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // إحصائيات الطلبات
        const stats = await Finance.aggregate([
            { $match: { type: 'withdrawal' } },
            {
                $group: {
                    _id: '$status',
                    totalAmount: { $sum: { $abs: '$amount' } },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                withdrawals,
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
        console.error('خطأ في جلب طلبات السحب:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب طلبات السحب'
        });
    }
});

/**
 * @route   PATCH /api/finance/admin/withdrawals/:id/process
 * @desc    معالجة طلب سحب للمشرفين
 * @access  Private (Admin only)
 */
router.patch('/admin/withdrawals/:id/process', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { status, notes } = req.body;
        
        if (!['completed', 'failed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'حالة غير صحيحة'
            });
        }

        const withdrawal = await Finance.findById(req.params.id).populate('user', 'username email balance');

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'طلب السحب غير موجود'
            });
        }

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'تم معالجة طلب السحب مسبقاً'
            });
        }

        // تحديث حالة طلب السحب
        withdrawal.status = status;
        withdrawal.processedBy = req.user.id;
        withdrawal.processedAt = new Date();
        if (notes) withdrawal.notes = notes;

        await withdrawal.save();

        // إذا تم رفض الطلب، إعادة المبلغ إلى رصيد المستخدم
        if (status === 'cancelled') {
            const user = await User.findById(withdrawal.user._id);
            user.balance = (user.balance || 0) + Math.abs(withdrawal.amount);
            await user.save();
        }

        res.json({
            success: true,
            message: 'تم معالجة طلب السحب بنجاح',
            data: { withdrawal }
        });
    } catch (error) {
        console.error('خطأ في معالجة طلب السحب:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في معالجة طلب السحب'
        });
    }
});

/**
 * @route   GET /api/finance/admin/stats
 * @desc    إحصائيات مالية للمشرفين
 * @access  Private (Admin only)
 */
router.get('/admin/stats', authenticate, authorize('admin'), async (req, res) => {
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

        // إحصائيات المعاملات
        const transactionStats = await Finance.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: { type: '$type', status: '$status' },
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        // إجمالي الرصيد المحتجز
        const totalLocked = await Finance.aggregate([
            {
                $match: {
                    type: { $in: ['withdrawal'] },
                    status: 'pending'
                }
            },
            { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
        ]);

        // أكبر المستفيدين
        const topEarners = await Finance.aggregate([
            { 
                $match: { 
                    type: 'income', 
                    status: 'completed',
                    ...dateFilter
                } 
            },
            { 
                $group: { 
                    _id: '$user', 
                    totalEarnings: { $sum: '$amount' },
                    count: { $sum: 1 }
                } 
            },
            { $sort: { totalEarnings: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userData'
                }
            },
            { $unwind: '$userData' }
        ]);

        res.json({
            success: true,
            data: {
                period,
                transactionStats,
                totalLocked: totalLocked[0]?.total || 0,
                topEarners
            }
        });
    } catch (error) {
        console.error('خطأ في جلب الإحصائيات المالية:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الإحصائيات المالية'
        });
    }
});

module.exports = router;