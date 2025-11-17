const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    // Basic Information
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'معرف المُبلّغ مطلوب']
    },
    targetType: {
        type: String,
        required: [true, 'نوع الهدف مطلوب'],
        enum: [
            'user',
            'challenge', 
            'comment',
            'rating',
            'profile',
            'message',
            'system'
        ]
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'معرف الهدف مطلوب'],
        refPath: 'targetType'
    },
    
    // Report Details
    category: {
        type: String,
        required: [true, 'فئة البلاغ مطلوبة'],
        enum: [
            'harassment',
            'spam',
            'fake_information',
            'inappropriate_content',
            'copyright_violation',
            'impersonation',
            'hate_speech',
            'violence',
            'sexual_content',
            'drugs',
            'scam',
            'cheating',
            'technical_issues',
            'other'
        ]
    },
    subCategory: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        required: [true, 'وصف البلاغ مطلوب'],
        maxlength: [2000, 'الوصف يجب ألا يتجاوز 2000 حرف']
    },
    evidence: {
        type: String,
        default: ''
    },
    
    // Attachments
    attachments: [{
        type: {
            type: String,
            enum: ['image', 'video', 'audio', 'document', 'link'],
            required: true
        },
        url: {
            type: String,
            required: true
        },
        filename: String,
        size: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Report Status
    status: {
        type: String,
        enum: [
            'pending',      // في الانتظار
            'under_review', // تحت المراجعة
            'resolved',     // تم الحل
            'dismissed',    // تم رفضه
            'escalated'     // تم تصعيده
        ],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    
    // Review Information
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    resolution: {
        type: String,
        enum: [
            'no_action',
            'warning_issued',
            'content_removed',
            'user_suspended',
            'user_banned',
            'account_restricted',
            'content_edited',
            'false_report'
        ],
        default: 'no_action'
    },
    resolutionNotes: {
        type: String,
        default: ''
    },
    
    // Actions Taken
    actions: [{
        type: {
            type: String,
            enum: [
                'warning_sent',
                'content_removed',
                'user_suspended',
                'user_banned',
                'account_restricted',
                'content_edited',
                'account_verified',
                'evidence_reviewed'
            ],
            required: true
        },
        details: String,
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        performedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Automated Processing
    isAutomated: {
        type: Boolean,
        default: false
    },
    automationReason: {
        type: String,
        default: ''
    },
    
    // Duplicate Reports
    isDuplicate: {
        type: Boolean,
        default: false
    },
    duplicateOf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        default: null
    },
    similarReports: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report'
    }],
    
    // Escalation
    isEscalated: {
        type: Boolean,
        default: false
    },
    escalatedTo: {
        type: String,
        enum: ['senior_moderator', 'admin', 'legal_team', 'external'],
        default: null
    },
    escalationReason: {
        type: String,
        default: ''
    },
    
    // Internal Notes
    internalNotes: {
        type: String,
        default: ''
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
reportSchema.index({ status: 1, priority: -1, createdAt: -1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ category: 1, status: 1 });
reportSchema.index({ assignedTo: 1, status: 1 });
reportSchema.index({ reviewedBy: 1, reviewedAt: -1 });
reportSchema.index({ createdAt: -1 });

// Compound indexes
reportSchema.index({ status: 1, assignedTo: 1, priority: -1 });
reportSchema.index({ targetType: 1, targetId: 1, status: 1 });

// Virtual for report age
reportSchema.virtual('age').get(function() {
    return Date.now() - this.createdAt.getTime();
});

// Virtual for time to resolution
reportSchema.virtual('timeToResolution').get(function() {
    if (this.status === 'resolved' && this.reviewedAt) {
        return this.reviewedAt.getTime() - this.createdAt.getTime();
    }
    return null;
});

// Virtual for severity score
reportSchema.virtual('severityScore').get(function() {
    const categoryWeights = {
        'hate_speech': 10,
        'violence': 10,
        'harassment': 8,
        'sexual_content': 8,
        'drugs': 7,
        'fake_information': 6,
        'inappropriate_content': 5,
        'copyright_violation': 5,
        'impersonation': 4,
        'spam': 3,
        'scam': 9,
        'cheating': 6,
        'technical_issues': 2,
        'other': 1
    };
    
    const priorityWeights = {
        'critical': 5,
        'high': 3,
        'medium': 2,
        'low': 1
    };
    
    const baseScore = categoryWeights[this.category] || 1;
    const priorityMultiplier = priorityWeights[this.priority] || 1;
    
    // Reduce score if multiple reports for same target
    const reportCount = this.similarReports ? this.similarReports.length : 0;
    const duplicationBonus = Math.min(reportCount * 0.5, 3);
    
    return Math.round((baseScore + duplicationBonus) * priorityMultiplier);
});

// Pre-save middleware
reportSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // Auto-assign high priority reports
    if (this.isNew && this.priority === 'critical' && !this.assignedTo) {
        // Logic to auto-assign to available moderator
        // This would be implemented based on your moderator assignment system
    }
    
    next();
});

// Instance method to assign to moderator
reportSchema.methods.assignTo = function(moderatorId) {
    this.assignedTo = moderatorId;
    this.status = this.status === 'pending' ? 'under_review' : this.status;
    return this.save();
};

// Instance method to resolve report
reportSchema.methods.resolve = function(resolution, notes = '', reviewedBy) {
    this.status = 'resolved';
    this.resolution = resolution;
    this.resolutionNotes = notes;
    this.reviewedBy = reviewedBy;
    this.reviewedAt = new Date();
    
    return this.save();
};

// Instance method to dismiss report
reportSchema.methods.dismiss = function(reason = '', reviewedBy) {
    this.status = 'dismissed';
    this.resolution = 'no_action';
    this.resolutionNotes = reason;
    this.reviewedBy = reviewedBy;
    this.reviewedAt = new Date();
    
    return this.save();
};

// Instance method to escalate report
reportSchema.methods.escalate = function(escalatedTo, reason, escalatedBy) {
    this.isEscalated = true;
    this.escalatedTo = escalatedTo;
    this.escalationReason = reason;
    this.status = 'escalated';
    
    this.actions.push({
        type: 'report_escalated',
        details: `Escalated to ${escalatedTo}: ${reason}`,
        performedBy: escalatedBy
    });
    
    return this.save();
};

// Instance method to add action
reportSchema.methods.addAction = function(actionType, details, performedBy) {
    this.actions.push({
        type: actionType,
        details,
        performedBy,
        performedAt: new Date()
    });
    
    return this.save();
};

// Static method to get reports by status
reportSchema.statics.getReportsByStatus = function(status, options = {}) {
    const { limit = 50, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    
    let query = { status };
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    return this.find(query)
        .populate('reporter', 'username fullName avatar')
        .populate('assignedTo', 'username')
        .populate('reviewedBy', 'username')
        .populate('targetId')
        .sort(sortOptions)
        .limit(limit)
        .skip(offset);
};

// Static method to get reports assigned to moderator
reportSchema.statics.getAssignedReports = function(moderatorId, options = {}) {
    const { limit = 50, offset = 0, status = null } = options;
    
    let query = { assignedTo: moderatorId };
    if (status) {
        query.status = status;
    }
    
    return this.find(query)
        .populate('reporter', 'username fullName avatar')
        .populate('targetId')
        .sort({ priority: -1, createdAt: -1 })
        .limit(limit)
        .skip(offset);
};

// Static method to get reports by category
reportSchema.statics.getReportsByCategory = function(category, timeframe = '7d') {
    const now = new Date();
    let startTime;
    
    switch (timeframe) {
        case '1d':
            startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case '7d':
        default:
            startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
            startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
    }
    
    return this.find({
        category,
        createdAt: { $gte: startTime }
    })
    .populate('reporter', 'username')
    .sort({ createdAt: -1 });
};

// Static method to get report statistics
reportSchema.statics.getReportStatistics = function(timeframe = '30d') {
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
    }
    
    return this.aggregate([
        {
            $match: {
                createdAt: { $gte: startTime }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
};

// Static method to find potential duplicates
reportSchema.statics.findDuplicates = function(targetType, targetId, category, reporterId) {
    return this.find({
        targetType,
        targetId,
        category,
        reporter: { $ne: reporterId },
        status: { $in: ['pending', 'under_review'] }
    });
};

// Static method to get moderator workload
reportSchema.statics.getModeratorWorkload = function(moderatorId) {
    return this.aggregate([
        {
            $match: {
                assignedTo: mongoose.Types.ObjectId(moderatorId)
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
};

module.exports = mongoose.model('Report', reportSchema);