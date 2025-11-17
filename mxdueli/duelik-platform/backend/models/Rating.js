const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    // Basic Information
    challenge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
        required: [true, 'معرف المنافسة مطلوب']
    },
    rater: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'معرف المقيم مطلوب']
    },
    ratedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'معرف المستخدم المُقيّم مطلوب']
    },
    
    // Rating Details
    category: {
        type: String,
        required: [true, 'فئة التقييم مطلوبة'],
        enum: [
            'performance',      // الأداء العام
            'knowledge',        // المعرفة
            'presentation',     // العرض
            'persuasion',       // الإقناع
            'creativity',       // الإبداع
            'fairness'          // الإنصاف
        ]
    },
    rating: {
        type: Number,
        required: [true, 'نقاط التقييم مطلوبة'],
        min: [1, 'التقييم يجب أن يكون بين 1 و 10'],
        max: [10, 'التقييم يجب أن يكون بين 1 و 10']
    },
    
    // Additional Feedback
    comment: {
        type: String,
        maxlength: [500, 'التعليق يجب ألا يتجاوز 500 حرف'],
        default: ''
    },
    
    // Rating Context
    ratingType: {
        type: String,
        enum: ['live', 'post_challenge', 'appeal'],
        default: 'live'
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    
    // Moderation
    isModerated: {
        type: Boolean,
        default: false
    },
    moderationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'flagged'],
        default: 'pending'
    },
    moderationReason: {
        type: String,
        default: ''
    },
    moderatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    moderatedAt: {
        type: Date,
        default: null
    },
    
    // Flags and Reports
    flags: [{
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        reason: {
            type: String,
            enum: [
                'inappropriate_content',
                'fake_rating',
                'vote_manipulation',
                'harassment',
                'spam',
                'conflict_of_interest',
                'other'
            ],
            required: true
        },
        description: String,
        reportedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
            default: 'pending'
        }
    }],
    
    // Timestamp
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
ratingSchema.index({ challenge: 1, ratedUser: 1 });
ratingSchema.index({ rater: 1 });
ratingSchema.index({ ratedUser: 1, category: 1 });
ratingSchema.index({ ratingType: 1, moderationStatus: 1 });
ratingSchema.index({ createdAt: -1 });
ratingSchema.index({ rating: -1 });

// Compound indexes
ratingSchema.index({ challenge: 1, category: 1, rating: -1 });
ratingSchema.index({ ratedUser: 1, moderationStatus: 1, createdAt: -1 });

// Unique constraint to prevent duplicate ratings
ratingSchema.index(
    { challenge: 1, rater: 1, ratedUser: 1, category: 1 },
    { unique: true, partialFilterExpression: { moderationStatus: { $in: ['approved', 'pending'] } } }
);

// Virtual for rating letter grade
ratingSchema.virtual('letterGrade').get(function() {
    if (this.rating >= 9) return 'A+';
    if (this.rating >= 8) return 'A';
    if (this.rating >= 7) return 'B+';
    if (this.rating >= 6) return 'B';
    if (this.rating >= 5) return 'C+';
    if (this.rating >= 4) return 'C';
    if (this.rating >= 3) return 'D+';
    if (this.rating >= 2) return 'D';
    return 'F';
});

// Virtual for rating description
ratingSchema.virtual('ratingDescription').get(function() {
    const descriptions = {
        performance: {
            10: 'أداء استثنائي ومتميز',
            9: 'أداء ممتاز جداً',
            8: 'أداء ممتاز',
            7: 'أداء جيد جداً',
            6: 'أداء جيد',
            5: 'أداء مقبول',
            4: 'أداء ضعيف نسبياً',
            3: 'أداء ضعيف',
            2: 'أداء ضعيف جداً',
            1: 'أداء سيء'
        },
        knowledge: {
            10: 'معرفة شاملة ومتعمقة',
            9: 'معرفة واسعة جداً',
            8: 'معرفة واسعة',
            7: 'معرفة جيدة جداً',
            6: 'معرفة جيدة',
            5: 'معرفة أساسية',
            4: 'معرفة محدودة',
            3: 'معرفة ضعيفة',
            2: 'معرفة ضعيفة جداً',
            1: 'معرفة غير كافية'
        },
        presentation: {
            10: 'عرض احترافي ومتطور',
            9: 'عرض ممتاز جداً',
            8: 'عرض ممتاز',
            7: 'عرض جيد جداً',
            6: 'عرض جيد',
            5: 'عرض مقبول',
            4: 'عرض ضعيف نسبياً',
            3: 'عرض ضعيف',
            2: 'عرض ضعيف جداً',
            1: 'عرض فوضوي'
        },
        persuasion: {
            10: 'قدرة إقناع استثنائية',
            9: 'قدرة إقناع ممتازة',
            8: 'قدرة إقناع جيدة جداً',
            7: 'قدرة إقناع جيدة',
            6: 'قدرة إقناع مقبولة',
            5: 'قدرة إقناع متوسطة',
            4: 'قدرة إقناع ضعيفة',
            3: 'قدرة إقناع ضعيفة جداً',
            2: 'صعوبة في الإقناع',
            1: 'عدم القدرة على الإقناع'
        },
        creativity: {
            10: 'إبداع استثنائي',
            9: 'إبداع ممتاز',
            8: 'إبداع جيد جداً',
            7: 'إبداع جيد',
            6: 'إبداع مقبول',
            5: 'إبداع بسيط',
            4: 'إبداع محدود',
            3: 'قلة الإبداع',
            2: 'عدم الإبداع',
            1: 'أفكار مبتذلة'
        },
        fairness: {
            10: 'إنصاف استثنائي',
            9: 'إنصاف ممتاز',
            8: 'إنصاف جيد جداً',
            7: 'إنصاف جيد',
            6: 'إنصاف مقبول',
            5: 'إنصاف متوسط',
            4: 'إنصاف ضعيف',
            3: 'إنصاف ضعيف جداً',
            2: 'تجاهل العدالة',
            1: 'عدم الإنصاف'
        }
    };
    
    return descriptions[this.category]?.[this.rating] || 'لا يوجد وصف';
});

// Virtual for rating color
ratingSchema.virtual('ratingColor').get(function() {
    if (this.rating >= 8) return '#10b981'; // green
    if (this.rating >= 6) return '#f59e0b'; // yellow
    if (this.rating >= 4) return '#f97316'; // orange
    return '#ef4444'; // red
});

// Pre-save middleware
ratingSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Pre-save middleware to validate self-rating
ratingSchema.pre('save', function(next) {
    if (this.rater.toString() === this.ratedUser.toString()) {
        return next(new Error('لا يمكن للمستخدم تقييم نفسه'));
    }
    next();
});

// Pre-save middleware to check challenge status
ratingSchema.pre('save', async function(next) {
    if (this.isNew) {
        const Challenge = mongoose.model('Challenge');
        const challenge = await Challenge.findById(this.challenge);
        
        if (!challenge) {
            return next(new Error('المنافسة غير موجودة'));
        }
        
        // Allow ratings during live challenge or within 24 hours after ending
        const now = new Date();
        const challengeEndTime = challenge.endedAt || new Date(challenge.startedAt.getTime() + (challenge.duration * 60 * 1000));
        const hoursSinceEnd = (now - challengeEndTime) / (1000 * 60 * 60);
        
        if (challenge.status !== 'live' && hoursSinceEnd > 24) {
            return next(new Error('لا يمكن تقييم المنافسة بعد انتهاء فترة التقييم (24 ساعة)'));
        }
    }
    next();
});

// Instance method to approve rating
ratingSchema.methods.approve = function(moderatorId) {
    this.moderationStatus = 'approved';
    this.isModerated = true;
    this.moderatedBy = moderatorId;
    this.moderatedAt = new Date();
    return this.save();
};

// Instance method to reject rating
ratingSchema.methods.reject = function(moderatorId, reason) {
    this.moderationStatus = 'rejected';
    this.isModerated = true;
    this.moderatedBy = moderatorId;
    this.moderatedAt = new Date();
    this.moderationReason = reason;
    return this.save();
};

// Instance method to flag rating
ratingSchema.methods.flag = function(reporterId, reason, description) {
    this.flags.push({
        reportedBy: reporterId,
        reason,
        description,
        reportedAt: new Date()
    });
    return this.save();
};

// Static method to get average ratings for user
ratingSchema.statics.getUserAverageRatings = async function(userId, category = null) {
    const matchStage = {
        ratedUser: mongoose.Types.ObjectId(userId),
        moderationStatus: 'approved'
    };
    
    if (category) {
        matchStage.category = category;
    }
    
    const pipeline = [
        { $match: matchStage },
        {
            $group: {
                _id: category ? '$category' : null,
                averageRating: { $avg: '$rating' },
                totalRatings: { $sum: 1 },
                maxRating: { $max: '$rating' },
                minRating: { $min: '$rating' }
            }
        }
    ];
    
    if (!category) {
        // For overall average
        const result = await this.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalRatings: { $sum: 1 },
                    maxRating: { $max: '$rating' },
                    minRating: { $min: '$rating' }
                }
            }
        ]);
        return result[0] || { averageRating: 0, totalRatings: 0, maxRating: 0, minRating: 0 };
    } else {
        // For category breakdown
        return await this.aggregate(pipeline);
    }
};

// Static method to get ratings distribution for user
ratingSchema.statics.getUserRatingDistribution = async function(userId, category = null) {
    const matchStage = {
        ratedUser: mongoose.Types.ObjectId(userId),
        moderationStatus: 'approved'
    };
    
    if (category) {
        matchStage.category = category;
    }
    
    const pipeline = [
        { $match: matchStage },
        {
            $group: {
                _id: '$rating',
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ];
    
    const distribution = await this.aggregate(pipeline);
    
    // Convert to full distribution (1-10 scale)
    const fullDistribution = {};
    for (let i = 1; i <= 10; i++) {
        const rating = distribution.find(d => d._id === i);
        fullDistribution[i] = rating ? rating.count : 0;
    }
    
    return fullDistribution;
};

// Static method to get recent ratings
ratingSchema.statics.getRecentRatings = function(userId, limit = 10) {
    return this.find({
        ratedUser: userId,
        moderationStatus: 'approved'
    })
    .populate('rater', 'username fullName avatar')
    .populate('challenge', 'title')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get challenge ratings
ratingSchema.statics.getChallengeRatings = function(challengeId) {
    return this.find({
        challenge: challengeId,
        moderationStatus: 'approved'
    })
    .populate('rater', 'username fullName avatar')
    .populate('ratedUser', 'username fullName avatar')
    .sort({ createdAt: -1 });
};

// Static method to validate rating integrity
ratingSchema.statics.validateRatingIntegrity = async function(challengeId) {
    const Challenge = mongoose.model('Challenge');
    const challenge = await Challenge.findById(challengeId);
    
    if (!challenge) {
        throw new Error('المنافسة غير موجودة');
    }
    
    // Get competitor IDs
    const competitorIds = challenge.competitors.map(comp => comp.user.toString());
    
    // Get all ratings for this challenge
    const ratings = await this.find({ challenge: challengeId });
    
    const issues = [];
    
    ratings.forEach(rating => {
        // Check if rated user is actually a competitor
        if (!competitorIds.includes(rating.ratedUser.toString())) {
            issues.push(`التقييم ${rating._id}: المستخدم ${rating.ratedUser} ليس من متسابقي هذه المنافسة`);
        }
        
        // Check for suspicious patterns
        const userRatings = ratings.filter(r => r.rater.toString() === rating.rater.toString());
        if (userRatings.length > 10) {
            issues.push(`التقييم ${rating._id}: المستخدم ${rating.rater} قام بعدة تقييمات متعددة`);
        }
    });
    
    return {
        valid: issues.length === 0,
        issues,
        totalRatings: ratings.length,
        uniqueRaters: new Set(ratings.map(r => r.rater.toString())).size
    };
};

module.exports = mongoose.model('Rating', ratingSchema);