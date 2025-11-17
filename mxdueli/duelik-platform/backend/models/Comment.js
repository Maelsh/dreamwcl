const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    // Basic Information
    challenge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
        required: [true, 'معرف المنافسة مطلوب']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'معرف المستخدم مطلوب']
    },
    content: {
        type: String,
        required: [true, 'محتوى التعليق مطلوب'],
        maxlength: [1000, 'التعليق يجب ألا يتجاوز 1000 حرف'],
        minlength: [1, 'التعليق لا يمكن أن يكون فارغاً']
    },
    
    // Reply System
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    
    // Comment Type and Context
    type: {
        type: String,
        enum: ['general', 'question', 'feedback', 'support', 'criticism', 'applause'],
        default: 'general'
    },
    context: {
        type: String,
        enum: ['live_chat', 'post_discussion', 'moderator_note', 'system_message'],
        default: 'live_chat'
    },
    
    // Engagement
    likes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        likedAt: {
            type: Date,
            default: Date.now
        }
    }],
    dislikes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        dislikedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Status and Moderation
    isActive: {
        type: Boolean,
        default: true
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    
    // Content Status
    moderationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'flagged', 'auto_approved'],
        default: 'pending'
    },
    moderationReason: {
        type: String,
        default: ''
    },
    moderationNotes: {
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
                'inappropriate_language',
                'harassment',
                'spam',
                'off_topic',
                'misinformation',
                'advertisement',
                'personal_attack',
                'hate_speech',
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
    
    // Auto-moderation
    autoModerated: {
        type: Boolean,
        default: false
    },
    autoModerationReason: {
        type: String,
        default: ''
    },
    toxicityScore: {
        type: Number,
        min: 0,
        max: 1,
        default: 0
    },
    spamScore: {
        type: Number,
        min: 0,
        max: 1,
        default: 0
    },
    
    // Special Features
    mentions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        notified: {
            type: Boolean,
            default: false
        },
        notifiedAt: {
            type: Date,
            default: null
        }
    }],
    
    // Analytics
    replyCount: {
        type: Number,
        default: 0
    },
    viewCount: {
        type: Number,
        default: 0
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    editedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
commentSchema.index({ challenge: 1, createdAt: -1 });
commentSchema.index({ user: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ moderationStatus: 1, isActive: 1 });
commentSchema.index({ isPinned: -1, createdAt: -1 });
commentSchema.index({ 'likes.user': 1 });
commentSchema.index({ 'dislikes.user': 1 });
commentSchema.index({ context: 1, type: 1 });

// Text search index
commentSchema.index({
    content: 'text'
}, {
    weights: {
        content: 10
    }
});

// Compound indexes
commentSchema.index({ challenge: 1, parentComment: 1, createdAt: 1 });
commentSchema.index({ user: 1, createdAt: -1 });

// Virtual for like count
commentSchema.virtual('likeCount').get(function() {
    return this.likes ? this.likes.length : 0;
});

// Virtual for dislike count
commentSchema.virtual('dislikeCount').get(function() {
    return this.dislikes ? this.dislikes.length : 0;
});

// Virtual for engagement score
commentSchema.virtual('engagementScore').get(function() {
    const likes = this.likes ? this.likes.length : 0;
    const dislikes = this.dislikes ? this.dislikes.length : 0;
    const replies = this.replies ? this.replies.length : 0;
    
    return (likes * 2) + (replies * 3) - (dislikes * 1);
});

// Virtual for is reply
commentSchema.virtual('isReply').get(function() {
    return this.parentComment !== null;
});

// Virtual for user reaction
commentSchema.virtual('userReaction').get(function() {
    return function(userId) {
        const userIdStr = userId.toString();
        
        if (this.likes && this.likes.some(like => like.user.toString() === userIdStr)) {
            return 'like';
        }
        
        if (this.dislikes && this.dislikes.some(dislike => dislike.user.toString() === userIdStr)) {
            return 'dislike';
        }
        
        return null;
    };
});

// Virtual for truncated content
commentSchema.virtual('truncatedContent').get(function() {
    if (this.content.length <= 150) return this.content;
    return this.content.substring(0, 150) + '...';
});

// Pre-save middleware
commentSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // Mark as edited if content changed
    if (this.isModified('content') && !this.isNew) {
        this.isEdited = true;
        this.editedAt = new Date();
    }
    
    // Update reply count for parent comments
    if (this.parentComment && this.isNew) {
        mongoose.model('Comment').findByIdAndUpdate(
            this.parentComment,
            { $inc: { replyCount: 1 } }
        ).exec();
    }
    
    next();
});

// Pre-save middleware to extract mentions
commentSchema.pre('save', function(next) {
    if (this.isModified('content') || this.isNew) {
        // Extract @username mentions (simplified)
        const mentionRegex = /@(\w+)/g;
        const matches = this.content.match(mentionRegex);
        
        if (matches) {
            // In a real implementation, you would resolve usernames to user IDs
            // This is a simplified version
            this.mentions = matches.map(match => ({
                user: match.substring(1), // Remove @ symbol
                notified: false,
                notifiedAt: null
            }));
        }
    }
    
    next();
});

// Instance method to like comment
commentSchema.methods.like = function(userId) {
    const userIdStr = userId.toString();
    
    // Remove dislike if exists
    this.dislikes = this.dislikes.filter(dislike => dislike.user.toString() !== userIdStr);
    
    // Add like if not exists
    const alreadyLiked = this.likes && this.likes.some(like => like.user.toString() === userIdStr);
    if (!alreadyLiked) {
        this.likes.push({
            user: userId,
            likedAt: new Date()
        });
    }
    
    return this.save();
};

// Instance method to dislike comment
commentSchema.methods.dislike = function(userId) {
    const userIdStr = userId.toString();
    
    // Remove like if exists
    this.likes = this.likes.filter(like => like.user.toString() !== userIdStr);
    
    // Add dislike if not exists
    const alreadyDisliked = this.dislikes && this.dislikes.some(dislike => dislike.user.toString() === userIdStr);
    if (!alreadyDisliked) {
        this.dislikes.push({
            user: userId,
            dislikedAt: new Date()
        });
    }
    
    return this.save();
};

// Instance method to remove reaction
commentSchema.methods.removeReaction = function(userId) {
    const userIdStr = userId.toString();
    
    this.likes = this.likes.filter(like => like.user.toString() !== userIdStr);
    this.dislikes = this.dislikes.filter(dislike => dislike.user.toString() !== userIdStr);
    
    return this.save();
};

// Instance method to add reply
commentSchema.methods.addReply = function(userId, content, type = 'general') {
    const Reply = mongoose.model('Comment');
    
    const reply = new Reply({
        challenge: this.challenge,
        user: userId,
        content: content,
        parentComment: this._id,
        type: type,
        context: this.context
    });
    
    return reply.save().then(savedReply => {
        this.replies.push(savedReply._id);
        this.replyCount += 1;
        return this.save().then(() => savedReply);
    });
};

// Instance method to soft delete
commentSchema.methods.softDelete = function() {
    this.isDeleted = true;
    this.isActive = false;
    return this.save();
};

// Instance method to restore
commentSchema.methods.restore = function() {
    this.isDeleted = false;
    this.isActive = true;
    return this.save();
};

// Instance method to moderate
commentSchema.methods.moderate = function(moderatorId, status, reason = '', notes = '') {
    this.moderationStatus = status;
    this.moderationReason = reason;
    this.moderationNotes = notes;
    this.moderatedBy = moderatorId;
    this.moderatedAt = new Date();
    this.isActive = status === 'approved';
    
    return this.save();
};

// Static method to get comments for challenge
commentSchema.statics.getChallengeComments = function(challengeId, options = {}) {
    const {
        limit = 50,
        offset = 0,
        includeReplies = true,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = options;
    
    let query = { challenge: challengeId };
    
    // Only show active, non-deleted comments for public display
    query.isActive = true;
    query.isDeleted = false;
    
    if (!includeReplies) {
        query.parentComment = null;
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    return this.find(query)
        .populate('user', 'username fullName avatar')
        .populate('parentComment', 'user content createdAt')
        .populate('moderatedBy', 'username')
        .sort(sortOptions)
        .limit(limit)
        .skip(offset);
};

// Static method to get thread of comments
commentSchema.statics.getCommentThread = function(commentId) {
    return this.find({ _id: commentId })
        .populate('user', 'username fullName avatar')
        .populate('parentComment', 'user content createdAt')
        .populate({
            path: 'replies',
            populate: {
                path: 'user',
                select: 'username fullName avatar'
            },
            options: { sort: { createdAt: 1 } }
        })
        .populate('moderatedBy', 'username');
};

// Static method to search comments
commentSchema.statics.searchComments = function(challengeId, query, options = {}) {
    const {
        limit = 20,
        offset = 0,
        sortBy = 'score',
        sortOrder = 'desc'
    } = options;
    
    let searchQuery = {
        challenge: challengeId,
        isActive: true,
        isDeleted: false,
        moderationStatus: 'approved'
    };
    
    if (query) {
        searchQuery.$text = { $search: query };
    }
    
    const sortOptions = sortBy === 'score' ? 
        { score: { $meta: 'textScore' } } :
        { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    return this.find(searchQuery)
        .populate('user', 'username fullName avatar')
        .sort(sortOptions)
        .limit(limit)
        .skip(offset);
};

// Static method to get user comments
commentSchema.statics.getUserComments = function(userId, options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    return this.find({
        user: userId,
        isDeleted: false
    })
    .populate('challenge', 'title')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset);
};

// Static method to get trending comments
commentSchema.statics.getTrendingComments = function(challengeId, timeframe = '24h') {
    const now = new Date();
    let startTime;
    
    switch (timeframe) {
        case '1h':
            startTime = new Date(now.getTime() - 60 * 60 * 1000);
            break;
        case '6h':
            startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
            break;
        case '24h':
        default:
            startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
    }
    
    return this.aggregate([
        {
            $match: {
                challenge: mongoose.Types.ObjectId(challengeId),
                createdAt: { $gte: startTime },
                isActive: true,
                isDeleted: false
            }
        },
        {
            $addFields: {
                engagementScore: {
                    $add: [
                        { $multiply: [{ $size: { $ifNull: ['$likes', []] } }, 2] },
                        { $multiply: [{ $size: { $ifNull: ['$replies', []] } }, 3] },
                        { $multiply: [{ $size: { $ifNull: ['$dislikes', []] } }, -1] }
                    ]
                }
            }
        },
        { $sort: { engagementScore: -1, createdAt: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user'
            }
        },
        { $unwind: '$user' }
    ]);
};

module.exports = mongoose.model('Comment', commentSchema);