const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
    // Basic Information
    title: {
        type: String,
        required: [true, 'عنوان المنافسة مطلوب'],
        trim: true,
        maxlength: [200, 'عنوان المنافسة يجب ألا يتجاوز 200 حرف']
    },
    description: {
        type: String,
        required: [true, 'وصف المنافسة مطلوب'],
        maxlength: [2000, 'وصف المنافسة يجب ألا يتجاوز 2000 حرف']
    },
    
    // Categories and Type
    category: {
        type: String,
        required: [true, 'فئة المنافسة مطلوبة'],
        enum: [
            'dialogue',
            'sciences', 
            'talents'
        ]
    },
    subCategory: {
        type: String,
        required: [true, 'الفئة الفرعية مطلوبة'],
        enum: [
            // dialogue categories
            'religions',      // حوار الأديان
            'sects',         // حوار المذاهب
            'politics',      // حوار السياسة
            'economics',     // حوار الاقتصاد
            'conflicts',     // حوار المنازعات
            'current',       // حوار القضايا الساعة
            
            // sciences categories
            'physics',       // الفيزياء
            'chemistry',     // الكيمياء
            'biology',       // الأحياء
            'mathematics',   // الرياضيات
            'technology',    // التكنولوجيا
            'medicine',      // الطب
            
            // talents categories
            'music',         // الموسيقى
            'art',           // الفن
            'poetry',        // الشعر
            'storytelling',  // السرد
            'debate',        // الخطابة
            'comedy'         // الكوميديا
        ]
    },
    
    // Competitors
    competitors: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        position: {
            type: String,
            enum: ['pro', 'con', 'left', 'right', 'team1', 'team2'],
            required: true
        },
        side: {
            type: String,
            required: true // The position/side this competitor represents
        },
        isOnline: {
            type: Boolean,
            default: false
        },
        lastActivity: {
            type: Date,
            default: Date.now
        },
        earnings: {
            type: Number,
            default: 0
        }
    }],
    
    // Moderators and Admins
    moderators: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        permissions: {
            type: [String],
            default: ['moderate_chat', 'view_analytics']
        },
        assignedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Scheduling and Timing
    scheduledAt: {
        type: Date,
        required: [true, 'توقيت المنافسة مطلوب']
    },
    duration: {
        type: Number, // in minutes
        required: [true, 'مدة المنافسة مطلوبة'],
        min: [1, 'مدة المنافسة يجب أن تكون دقيقة واحدة على الأقل'],
        max: [600, 'مدة المنافسة يجب ألا تتجاوز 600 دقيقة']
    },
    timeRemaining: {
        type: Number, // in seconds
        default: null
    },
    isPaused: {
        type: Boolean,
        default: false
    },
    pauseReason: {
        type: String,
        default: ''
    },
    pauseStartedAt: {
        type: Date,
        default: null
    },
    
    // Status and State
    status: {
        type: String,
        enum: [
            'scheduled',    // مجدولة
            'waiting',      // في انتظار البدء
            'live',         // مباشرة
            'paused',       // متوقفة مؤقتاً
            'ended',        // منتهية
            'cancelled'     // ملغاة
        ],
        default: 'scheduled'
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    
    // Live Streaming Information
    streaming: {
        platform: {
            type: String,
            enum: ['youtube', 'custom', 'embedded'],
            default: 'youtube'
        },
        streamId: {
            type: String,
            default: ''
        },
        streamUrl: {
            type: String,
            default: ''
        },
        embedUrl: {
            type: String,
            default: ''
        },
        thumbnail: {
            type: String,
            default: ''
        },
        quality: {
            type: String,
            enum: ['720p', '1080p', '4K'],
            default: '720p'
        }
    },
    
    // Rules and Format
    rules: {
        speakingTime: {
            type: Number, // per turn in minutes
            default: 5
        },
        turnsPerCompetitor: {
            type: Number,
            default: 3
        },
        audienceParticipation: {
            type: Boolean,
            default: true
        },
        questionsAllowed: {
            type: Boolean,
            default: true
        },
        audienceRating: {
            type: Boolean,
            default: true
        },
        customRules: {
            type: String,
            maxlength: [1000, 'القواعد المخصصة يجب ألا تتجاوز 1000 حرف']
        }
    },
    
    // Audience and Interaction
    audience: {
        maxViewers: {
            type: Number,
            default: 10000
        },
        currentViewers: {
            type: Number,
            default: 0
        },
        totalViews: {
            type: Number,
            default: 0
        },
        chatEnabled: {
            type: Boolean,
            default: true
        },
        voteEnabled: {
            type: Boolean,
            default: true
        },
        questionsEnabled: {
            type: Boolean,
            default: true
        }
    },
    
    // Results and Scoring
    results: {
        winner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        winnerReason: {
            type: String,
            default: ''
        },
        scores: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        totalVotes: {
            pro: {
                type: Number,
                default: 0
            },
            con: {
                type: Number,
                default: 0
            }
        },
        averageRatings: {
            pro: {
                type: Number,
                default: 0,
                min: 0,
                max: 5
            },
            con: {
                type: Number,
                default: 0,
                min: 0,
                max: 5
            }
        },
        endedAt: {
            type: Date,
            default: null
        }
    },
    
    // Financial Information
    financial: {
        entryFee: {
            type: Number,
            default: 0
        },
        prizePool: {
            type: Number,
            default: 0
        },
        platformFee: {
            type: Number,
            default: 0 // 20% platform fee
        },
        earnings: {
            pro: {
                type: Number,
                default: 0
            },
            con: {
                type: Number,
                default: 0
            },
            platform: {
                type: Number,
                default: 0
            }
        },
        payoutStatus: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending'
        }
    },
    
    // Tags and Search
    tags: [{
        type: String,
        trim: true,
        maxlength: [30, 'الوسم يجب ألا يتجاوز 30 حرف']
    }],
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'intermediate'
    },
    
    // Moderation and Reports
    reports: [{
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        reason: {
            type: String,
            required: true,
            enum: [
                'inappropriate_content',
                'harassment',
                'spam',
                'fake_information',
                'technical_issues',
                'other'
            ]
        },
        description: String,
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
            default: 'pending'
        },
        reportedAt: {
            type: Date,
            default: Date.now
        }
    }],
    isUnderReview: {
        type: Boolean,
        default: false
    },
    
    // Creator and Ownership
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isCreatorParticipant: {
        type: Boolean,
        default: true
    },
    
    // Timestamps
    startedAt: {
        type: Date,
        default: null
    },
    endedAt: {
        type: Date,
        default: null
    },
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
challengeSchema.index({ status: 1, scheduledAt: 1 });
challengeSchema.index({ category: 1, subCategory: 1 });
challengeSchema.index({ createdBy: 1 });
challengeSchema.index({ 'competitors.user': 1 });
challengeSchema.index({ isPublic: 1, isFeatured: 1 });
challengeSchema.index({ 'audience.currentViewers': -1 });
challengeSchema.index({ scheduledAt: 1 });
challengeSchema.index({ tags: 1 });
challengeSchema.index({ difficulty: 1 });

// Compound indexes
challengeSchema.index({ category: 1, subCategory: 1, status: 1 });
challengeSchema.index({ status: 1, isPublic: 1, scheduledAt: -1 });

// Text search index
challengeSchema.index({
    title: 'text',
    description: 'text',
    tags: 'text'
});

// Virtual for formatted duration
challengeSchema.virtual('formattedDuration').get(function() {
    const hours = Math.floor(this.duration / 60);
    const minutes = this.duration % 60;
    
    if (hours > 0) {
        return `${hours} ساعة ${minutes > 0 ? `و ${minutes} دقيقة` : ''}`;
    }
    return `${minutes} دقيقة`;
});

// Virtual for time remaining
challengeSchema.virtual('remainingTimeFormatted').get(function() {
    if (this.timeRemaining === null) return null;
    
    const hours = Math.floor(this.timeRemaining / 3600);
    const minutes = Math.floor((this.timeRemaining % 3600) / 60);
    const seconds = this.timeRemaining % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for audience percentage
challengeSchema.virtual('audiencePercentage').get(function() {
    if (this.audience.maxViewers === 0) return 0;
    return Math.round((this.audience.currentViewers / this.audience.maxViewers) * 100);
});

// Virtual for live status
challengeSchema.virtual('isLive').get(function() {
    return this.status === 'live';
});

// Virtual for time until start
challengeSchema.virtual('timeUntilStart').get(function() {
    if (this.status !== 'scheduled') return null;
    const now = new Date();
    const diff = this.scheduledAt - now;
    return Math.max(0, diff);
});

// Pre-save middleware
challengeSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // Calculate time remaining for live challenges
    if (this.status === 'live' && this.startedAt && this.duration) {
        const elapsed = Math.floor((Date.now() - this.startedAt) / 1000);
        this.timeRemaining = Math.max(0, (this.duration * 60) - elapsed);
    }
    
    next();
});

// Pre-save middleware to validate category/subcategory match
challengeSchema.pre('save', function(next) {
    const categoryMap = {
        dialogue: ['religions', 'sects', 'politics', 'economics', 'conflicts', 'current'],
        sciences: ['physics', 'chemistry', 'biology', 'mathematics', 'technology', 'medicine'],
        talents: ['music', 'art', 'poetry', 'storytelling', 'debate', 'comedy']
    };
    
    if (categoryMap[this.category] && !categoryMap[this.category].includes(this.subCategory)) {
        return next(new Error(`الفئة الفرعية ${this.subCategory} غير صحيحة للفئة ${this.category}`));
    }
    
    next();
});

// Instance method to check if user can join
challengeSchema.methods.canUserJoin = function(userId) {
    // Check if user is already a competitor
    const isCompetitor = this.competitors.some(comp => comp.user.toString() === userId.toString());
    if (isCompetitor) return false;
    
    // Check if challenge is open for joining
    if (this.status !== 'scheduled' && this.status !== 'waiting') return false;
    
    // Check time constraint (must join at least 5 minutes before start)
    const timeUntilStart = (this.scheduledAt - new Date()) / (1000 * 60);
    if (timeUntilStart < 5) return false;
    
    return true;
};

// Instance method to add competitor
challengeSchema.methods.addCompetitor = function(userId, position, side) {
    if (!this.canUserJoin(userId)) {
        throw new Error('لا يمكن للمستخدم الانضمام لهذه المنافسة');
    }
    
    this.competitors.push({
        user: userId,
        position,
        side,
        isOnline: true,
        lastActivity: new Date()
    });
    
    return this.save();
};

// Instance method to start the challenge
challengeSchema.methods.startChallenge = function() {
    if (this.status !== 'waiting' && this.status !== 'scheduled') {
        throw new Error('لا يمكن بدء هذه المنافسة في حالتها الحالية');
    }
    
    this.status = 'live';
    this.startedAt = new Date();
    this.timeRemaining = this.duration * 60;
    this.audience.currentViewers = 0;
    
    return this.save();
};

// Instance method to end the challenge
challengeSchema.methods.endChallenge = function(winnerId = null, reason = '') {
    this.status = 'ended';
    this.isCompleted = true;
    this.endedAt = new Date();
    this.results.endedAt = new Date();
    
    if (winnerId) {
        this.results.winner = winnerId;
        this.results.winnerReason = reason;
    }
    
    // Calculate earnings
    const totalEarnings = this.financial.prizePool;
    const platformFee = totalEarnings * 0.2; // 20% platform fee
    const competitorShare = (totalEarnings - platformFee) / 2;
    
    this.financial.earnings.platform = platformFee;
    
    // Distribute earnings to competitors
    this.competitors.forEach(comp => {
        if (comp.user.toString() === winnerId?.toString()) {
            comp.earnings = competitorShare;
        } else {
            comp.earnings = competitorShare;
        }
    });
    
    return this.save();
};

// Static method to find upcoming challenges
challengeSchema.statics.findUpcoming = function(limit = 10) {
    return this.find({
        status: 'scheduled',
        isPublic: true,
        scheduledAt: { $gte: new Date() }
    })
    .populate('competitors.user', 'username fullName avatar')
    .populate('createdBy', 'username fullName avatar')
    .sort({ scheduledAt: 1 })
    .limit(limit);
};

// Static method to find live challenges
challengeSchema.statics.findLive = function() {
    return this.find({
        status: 'live',
        isPublic: true
    })
    .populate('competitors.user', 'username fullName avatar')
    .populate('createdBy', 'username fullName avatar')
    .sort({ 'audience.currentViewers': -1 });
};

// Static method to search challenges
challengeSchema.statics.searchChallenges = function(query, filters = {}) {
    let searchQuery = {
        isPublic: true,
        ...filters
    };
    
    if (query) {
        searchQuery.$text = { $search: query };
    }
    
    return this.find(searchQuery)
        .populate('competitors.user', 'username fullName avatar')
        .populate('createdBy', 'username fullName avatar')
        .sort({ score: { $meta: 'textScore' }, scheduledAt: -1 });
};

module.exports = mongoose.model('Challenge', challengeSchema);