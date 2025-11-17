const mongoose = require('mongoose');

/**
 * RatingComment Schema for Dueli Platform
 * Implements Rating_Comment entity from Class Diagram
 * Manages user ratings and comments for transparency
 */

const ratingCommentSchema = new mongoose.Schema({
  // User who gave the rating/comment
  rater: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // User being rated (competitor)
  ratee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Associated challenge (if applicable)
  challenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge'
  },
  
  // Rating information
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  // Optional comment
  comment: {
    type: String,
    maxlength: 500,
    default: ''
  },
  
  // Rating categories for detailed feedback
  categories: {
    communication: { type: Number, min: 1, max: 5 },
    argumentQuality: { type: Number, min: 1, max: 5 },
    respectfulness: { type: Number, min: 1, max: 5 },
    presentation: { type: Number, min: 1, max: 5 }
  },
  
  // Moderation flags
  isFlagged: {
    type: Boolean,
    default: false
  },
  
  flagReason: {
    type: String,
    enum: ['spam', 'harassment', 'inappropriate', 'false_information', 'other'],
    default: null
  },
  
  flaggedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Moderation actions
  isHidden: {
    type: Boolean,
    default: false
  },
  
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  moderationReason: {
    type: String,
    default: ''
  },
  
  moderatedAt: {
    type: Date
  },
  
  // Transparency metrics
  isVerifiedViewer: {
    type: Boolean,
    default: false
  },
  
  viewerDuration: {
    type: Number,
    default: 0 // Duration in minutes the rater watched
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
});

// Indexes for performance and querying
ratingCommentSchema.index({ rater: 1, ratee: 1, challenge: 1 }, { unique: true });
ratingCommentSchema.index({ ratee: 1, rating: -1 });
ratingCommentSchema.index({ createdAt: -1 });
ratingCommentSchema.index({ isFlagged: 1 });
ratingCommentSchema.index({ ratee: 1, isHidden: 1 });

/**
 * Pre-save middleware to update timestamps
 */
ratingCommentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

/**
 * Method to flag a rating/comment
 * @param {string} userId - User flagging the content
 * @param {string} reason - Reason for flagging
 */
ratingCommentSchema.methods.flag = async function(userId, reason) {
  if (!this.flaggedBy.includes(userId)) {
    this.flaggedBy.push(userId);
    this.isFlagged = true;
    this.flagReason = reason;
    await this.save();
  }
};

/**
 * Method to moderate (hide) a rating/comment
 * @param {string} moderatorId - Admin moderating the content
 * @param {string} reason - Reason for moderation
 */
ratingCommentSchema.methods.moderate = async function(moderatorId, reason) {
  this.isHidden = true;
  this.moderatedBy = moderatorId;
  this.moderationReason = reason;
  this.moderatedAt = new Date();
  await this.save();
};

/**
 * Method to verify if user is eligible to rate
 * @param {string} userId - User attempting to rate
 * @returns {boolean} - Whether user can rate
 */
ratingCommentSchema.statics.canUserRate = async function(userId, rateeId, challengeId) {
  // Users cannot rate themselves
  if (userId === rateeId) return false;
  
  // Check if user already rated this competitor for this challenge
  const existingRating = await this.findOne({
    rater: userId,
    ratee: rateeId,
    challenge: challengeId
  });
  
  return !existingRating;
};

/**
 * Static method to get rating statistics for a user
 * @param {string} userId - User ID to get statistics for
 * @returns {object} - Rating statistics
 */
ratingCommentSchema.statics.getUserRatingStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { ratee: mongoose.Types.ObjectId(userId), isHidden: false } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
        ratingDistribution: {
          $push: {
            $cond: [
              { $eq: ['$rating', 5] }, '5_star',
              { $cond: [
                { $eq: ['$rating', 4] }, '4_star',
                { $cond: [
                  { $eq: ['$rating', 3] }, '3_star',
                  { $cond: [
                    { $eq: ['$rating', 2] }, '2_star',
                    '1_star'
                  ]}
                ]}
              ]}
            ]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    averageRating: 0,
    totalRatings: 0,
    ratingDistribution: []
  };
};

module.exports = mongoose.model('RatingComment', ratingCommentSchema);