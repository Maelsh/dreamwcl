const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
    // Basic Information
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'معرف المستخدم مطلوب']
    },
    challenge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
        default: null
    },
    transactionId: {
        type: String,
        unique: true,
        required: true
    },
    
    // Transaction Type
    type: {
        type: String,
        required: [true, 'نوع المعاملة مطلوب'],
        enum: [
            'earning',           // أرباح
            'payout',            // مدفوعات
            'entry_fee',         // رسوم دخول
            'platform_fee',      // رسوم المنصة
            'refund',            // استرداد
            'bonus',             // مكافآت
            'penalty',           // عقوبات مالية
            'withdrawal',        // سحب
            'deposit'            // إيداع
        ]
    },
    category: {
        type: String,
        enum: [
            'competition_earning',
            'competition_payout',
            'subscription',
            'tip',
            'refund',
            'penalty',
            'bonus',
            'withdrawal',
            'deposit'
        ],
        required: true
    },
    
    // Amount and Currency
    amount: {
        type: Number,
        required: [true, 'المبلغ مطلوب'],
        min: [0, 'المبلغ لا يمكن أن يكون سالباً']
    },
    currency: {
        type: String,
        required: [true, 'العملة مطلوبة'],
        enum: ['USD', 'EUR', 'AED', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR'],
        default: 'USD'
    },
    exchangeRate: {
        type: Number,
        default: 1
    },
    originalAmount: {
        type: Number,
        default: null
    },
    originalCurrency: {
        type: String,
        default: null
    },
    
    // Status
    status: {
        type: String,
        enum: [
            'pending',       // في الانتظار
            'processing',    // قيد المعالجة
            'completed',     // مكتملة
            'failed',        // فاشلة
            'cancelled',     // ملغاة
            'reversed'       // ملغاة
        ],
        default: 'pending'
    },
    
    // Payment Method
    paymentMethod: {
        type: String,
        enum: [
            'credit_card',
            'debit_card',
            'paypal',
            'bank_transfer',
            'crypto',
            'wallet',
            'platform_credit'
        ],
        default: 'platform_credit'
    },
    paymentDetails: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // Fees and Calculations
    fees: {
        platform: {
            type: Number,
            default: 0
        },
        payment: {
            type: Number,
            default: 0
        },
        tax: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            default: 0
        }
    },
    netAmount: {
        type: Number,
        required: true
    },
    
    // Bank/Payment Information
    bankDetails: {
        accountHolder: String,
        bankName: String,
        accountNumber: String,
        iban: String,
        swift: String,
        routingNumber: String
    },
    
    // Related Records
    relatedTransactions: [{
        transaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Finance'
        },
        relationship: {
            type: String,
            enum: ['related', 'refund_of', 'split_from']
        }
    }],
    
    // Tax Information
    taxInfo: {
        taxId: String,
        taxCountry: String,
        taxAmount: {
            type: Number,
            default: 0
        },
        taxRate: {
            type: Number,
            default: 0
        },
        taxYear: String,
        taxDocument: String
    },
    
    // Compliance
    compliance: {
        kycStatus: {
            type: String,
            enum: ['pending', 'verified', 'failed', 'expired'],
            default: 'pending'
        },
        taxCompliance: {
            type: String,
            enum: ['compliant', 'non_compliant', 'pending_review'],
            default: 'pending_review'
        },
        amlCheck: {
            type: String,
            enum: ['passed', 'failed', 'pending'],
            default: 'pending'
        }
    },
    
    // Timestamps for Processing
    scheduledAt: {
        type: Date,
        default: null
    },
    processedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    },
    failedAt: {
        type: Date,
        default: null
    },
    
    // External References
    externalTransactionId: {
        type: String,
        default: ''
    },
    externalReference: {
        type: String,
        default: ''
    },
    webhookData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // Error Information
    errorCode: {
        type: String,
        default: ''
    },
    errorMessage: {
        type: String,
        default: ''
    },
    retryCount: {
        type: Number,
        default: 0
    },
    maxRetries: {
        type: Number,
        default: 3
    },
    
    // Metadata
    description: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
financeSchema.index({ user: 1, createdAt: -1 });
financeSchema.index({ challenge: 1 });
financeSchema.index({ transactionId: 1 }, { unique: true });
financeSchema.index({ type: 1, status: 1 });
financeSchema.index({ category: 1, createdAt: -1 });
financeSchema.index({ status: 1, scheduledAt: 1 });
financeSchema.index({ completedAt: -1 });
financeSchema.index({ 'paymentMethod': 1 });

// Compound indexes
financeSchema.index({ user: 1, type: 1, createdAt: -1 });
financeSchema.index({ status: 1, type: 1, createdAt: -1 });
financeSchema.index({ category: 1, status: 1, createdAt: -1 });

// Text search index
financeSchema.index({
    transactionId: 'text',
    description: 'text'
});

// Virtual for formatted amount
financeSchema.virtual('formattedAmount').get(function() {
    const sign = this.type === 'earning' || this.type === 'refund' || this.type === 'bonus' ? '+' : '-';
    return `${sign}${this.netAmount.toFixed(2)} ${this.currency}`;
});

// Virtual for processing time
financeSchema.virtual('processingTime').get(function() {
    if (this.status === 'completed' && this.processedAt) {
        return this.processedAt.getTime() - this.createdAt.getTime();
    }
    return null;
});

// Virtual for total cost (including fees)
financeSchema.virtual('totalCost').get(function() {
    return Math.abs(this.amount) + this.fees.total;
});

// Pre-save middleware
financeSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // Calculate net amount
    this.netAmount = this.amount - this.fees.total;
    
    // Set timestamps based on status
    if (this.isModified('status')) {
        if (this.status === 'processing' && !this.processedAt) {
            this.processedAt = new Date();
        } else if (this.status === 'completed' && !this.completedAt) {
            this.completedAt = new Date();
        } else if (this.status === 'failed' && !this.failedAt) {
            this.failedAt = new Date();
        }
    }
    
    // Generate transaction ID if new
    if (this.isNew && !this.transactionId) {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.transactionId = `TXN-${timestamp}-${random}`;
    }
    
    next();
});

// Instance method to process transaction
financeSchema.methods.process = function() {
    if (this.status !== 'pending') {
        throw new Error('لا يمكن معالجة معاملة غير في حالة الانتظار');
    }
    
    this.status = 'processing';
    this.processedAt = new Date();
    
    return this.save();
};

// Instance method to complete transaction
financeSchema.methods.complete = function(externalTransactionId = '') {
    if (this.status !== 'processing') {
        throw new Error('لا يمكن إكمال معاملة غير قيد المعالجة');
    }
    
    this.status = 'completed';
    this.completedAt = new Date();
    
    if (externalTransactionId) {
        this.externalTransactionId = externalTransactionId;
    }
    
    return this.save();
};

// Instance method to fail transaction
financeSchema.methods.fail = function(errorCode, errorMessage) {
    this.status = 'failed';
    this.failedAt = new Date();
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
    
    return this.save();
};

// Instance method to retry transaction
financeSchema.methods.retry = function() {
    if (this.retryCount >= this.maxRetries) {
        throw new Error('تم تجاوز الحد الأقصى للمحاولات');
    }
    
    this.status = 'pending';
    this.processedAt = null;
    this.failedAt = null;
    this.retryCount += 1;
    
    return this.save();
};

// Instance method to calculate fees
financeSchema.methods.calculateFees = function(feeRates = {}) {
    const platformRate = feeRates.platform || 0.20; // 20% default
    const paymentRate = feeRates.payment || 0.029; // 2.9% default
    const taxRate = feeRates.tax || 0.05; // 5% default
    
    this.fees.platform = Math.abs(this.amount) * platformRate;
    this.fees.payment = Math.abs(this.amount) * paymentRate;
    this.fees.tax = (this.amount - this.fees.platform) * taxRate;
    this.fees.total = this.fees.platform + this.fees.payment + this.fees.tax;
    
    return this;
};

// Static method to get user balance
financeSchema.statics.getUserBalance = async function(userId, currency = 'USD') {
    const result = await this.aggregate([
        {
            $match: {
                user: mongoose.Types.ObjectId(userId),
                status: 'completed',
                currency: currency
            }
        },
        {
            $group: {
                _id: null,
                totalEarnings: {
                    $sum: {
                        $cond: [
                            { $in: ['$type', ['earning', 'refund', 'bonus']] },
                            '$netAmount',
                            0
                        ]
                    }
                },
                totalSpent: {
                    $sum: {
                        $cond: [
                            { $in: ['$type', ['entry_fee', 'penalty', 'withdrawal']] },
                            { $abs: '$netAmount' },
                            0
                        ]
                    }
                }
            }
        }
    ]);
    
    const balance = result[0] || { totalEarnings: 0, totalSpent: 0 };
    return {
        balance: balance.totalEarnings - balance.totalSpent,
        totalEarnings: balance.totalEarnings,
        totalSpent: balance.totalSpent
    };
};

// Static method to get transaction history
financeSchema.statics.getTransactionHistory = function(userId, options = {}) {
    const {
        limit = 50,
        offset = 0,
        type = null,
        status = null,
        startDate = null,
        endDate = null,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = options;
    
    let query = { user: userId };
    
    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = startDate;
        if (endDate) query.createdAt.$lte = endDate;
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    return this.find(query)
        .populate('challenge', 'title')
        .sort(sortOptions)
        .limit(limit)
        .skip(offset);
};

// Static method to get earnings summary
financeSchema.statics.getEarningsSummary = async function(userId, timeframe = '30d') {
    const now = new Date();
    let startTime;
    
    switch (timeframe) {
        case '7d':
            startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
        default:
            startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90d':
            startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case '1y':
            startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
    }
    
    return this.aggregate([
        {
            $match: {
                user: mongoose.Types.ObjectId(userId),
                status: 'completed',
                createdAt: { $gte: startTime },
                type: { $in: ['earning', 'refund', 'bonus'] }
            }
        },
        {
            $group: {
                _id: '$category',
                totalAmount: { $sum: '$netAmount' },
                transactionCount: { $sum: 1 },
                averageAmount: { $avg: '$netAmount' }
            }
        },
        {
            $sort: { totalAmount: -1 }
        }
    ]);
};

// Static method to get platform statistics
financeSchema.statics.getPlatformStatistics = async function(timeframe = '30d') {
    const now = new Date();
    let startTime;
    
    switch (timeframe) {
        case '1d':
            startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case '7d':
            startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
        default:
            startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
    }
    
    return this.aggregate([
        {
            $match: {
                createdAt: { $gte: startTime },
                status: 'completed'
            }
        },
        {
            $group: {
                _id: '$type',
                totalAmount: { $sum: '$netAmount' },
                transactionCount: { $sum: 1 },
                totalFees: { $sum: '$fees.platform' }
            }
        }
    ]);
};

// Static method to find pending payouts
financeSchema.statics.findPendingPayouts = function(options = {}) {
    const {
        minAmount = 10,
        currency = 'USD',
        limit = 100
    } = options;
    
    return this.aggregate([
        {
            $match: {
                type: 'earning',
                status: 'completed',
                currency: currency,
                netAmount: { $gte: minAmount }
            }
        },
        {
            $group: {
                _id: '$user',
                totalEarnings: { $sum: '$netAmount' },
                lastEarning: { $max: '$completedAt' },
                transactionCount: { $sum: 1 }
            }
        },
        {
            $match: {
                totalEarnings: { $gte: minAmount }
            }
        },
        {
            $sort: { lastEarning: -1 }
        },
        {
            $limit: limit
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user'
            }
        }
    ]);
};

module.exports = mongoose.model('Finance', financeSchema);