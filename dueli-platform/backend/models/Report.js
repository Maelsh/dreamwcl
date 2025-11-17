const mongoose = require('mongoose');

/**
 * Report Schema for Dueli Platform
 * Implements Report entity from Class Diagram
 * Manages user reports for content moderation
 */

const reportSchema = new mongoose.Schema({
  // Reporter information
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Report target (can be user, challenge, or rating)
  targetType: {
    type: String,
    enum: ['user', 'challenge', 'rating_comment', 'advertisement'],
    required: true
  },
  
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  targetChallenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge'
  },
  
  targetRating: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RatingComment'
  },
  
  targetAdvertisement: {
    type: String // Ad ID
  },
  
  // Report details
  reason: {
    type: String,
    enum: [
      'spam',
      'harassment',
      'hate_speech',
      'inappropriate_content',
      'false_information',
      'copyright_violation',
      'terms_violation',
      'other'
    ],
    required: true
  },
  
  description: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  
  evidence: [{
    type: {
      type: String,
      enum: ['screenshot', 'video', 'text', 'link'],
      required: true
    },
    url: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Report status
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed'],
    default: 'pending'
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Moderation actions taken
  actionsTaken: [{
    action: {
      type: String,
      enum: [
        'warning_issued',
        'content_hidden',
        'account_suspended',
        'account_banned',
        'challenge_cancelled',
        'ad_removed',
        'no_action'
      ]
    },
    description: String,
    takenAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Assigned moderator
  assignedModerator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Resolution details
  resolution: {
    decision: {
      type: String,
      enum: ['valid', 'invalid', 'partially_valid'],
      default: null
    },
    resolutionNotes: {
      type: String,
      maxlength: 2000,
      default: ''
    },
    resolvedAt: {
      type: Date
    }
  },
  
  // Automated detection flags
  automatedFlags: [{
    system: {
      type: String,
      enum: ['spam_detection', 'content_moderation', 'behavior_analysis']
    },
    flag: String,
    confidence: Number,
    detectedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Appeal information
  appeal: {
    appealedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appealReason: String,
    appealStatus: {
      type: String,
      enum: ['pending', 'reviewed', 'accepted', 'rejected'],
      default: null
    },
    appealReviewedAt: Date,
    appealDecision: String
  },
  
  // Transparency metrics
  isPublic: {
    type: Boolean,
    default: false // Most reports are private
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
  reviewedAt: {
    type: Date
  }
});

// Indexes for performance
reportSchema.index({ status: 1, priority: -1, createdAt: -1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ targetUser: 1 });
reportSchema.index({ targetChallenge: 1 });
reportSchema.index({ assignedModerator: 1 });
reportSchema.index({ createdAt: -1 });

/**
 * Pre-save middleware to update timestamps
 */
reportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update reviewedAt when status changes to resolved or dismissed
  if (this.isModified('status') && ['resolved', 'dismissed'].includes(this.status)) {
    this.reviewedAt = new Date();
  }
  
  next();
});

/**
 * Method to assign report to moderator
 * @param {string} moderatorId - Moderator user ID
 */
reportSchema.methods.assignToModerator = async function(moderatorId) {
  this.assignedModerator = moderatorId;
  this.status = 'under_review';
  await this.save();
};

/**
 * Method to resolve report with mandatory reason logging (US-SI-017)
 * @param {string} decision - Resolution decision
 * @param {string} notes - Resolution notes
 * @param {array} actions - Actions taken
 */
reportSchema.methods.resolve = async function(decision, notes, actions = []) {
  this.status = 'resolved';
  this.resolution = {
    decision,
    resolutionNotes: notes,
    resolvedAt: new Date()
  };
  
  if (actions.length > 0) {
    this.actionsTaken = actions.map(action => ({
      action: action.type,
      description: action.description
    }));
  }
  
  await this.save();
};

/**
 * Method to add automated flag
 * @param {string} system - Detection system
 * @param {string} flag - Flag type
 * @param {number} confidence - Confidence score
 */
reportSchema.methods.addAutomatedFlag = async function(system, flag, confidence) {
  this.automatedFlags.push({
    system,
    flag,
    confidence
  });
  
  // Auto-escalate priority based on confidence
  if (confidence > 0.8 && this.priority !== 'urgent') {
    this.priority = 'high';
  }
  
  await this.save();
};

/**
 * Static method to get report statistics
 * @returns {object} - Report statistics
 */
reportSchema.statics.getReportStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalReports: { $sum: 1 },
        pendingReports: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        resolvedReports: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        },
        averageResolutionTime: {
          $avg: {
            $cond: [
              { $and: [
                { $eq: ['$status', 'resolved'] },
                { $ne: ['$reviewedAt', null] }
              ]},
              { $subtract: ['$reviewedAt', '$createdAt'] },
              null
            ]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    averageResolutionTime: 0
  };
};

/**
 * Static method to check if user can report target
 * @param {string} reporterId - User making the report
 * @param {string} targetType - Type of target
 * @param {string} targetId - Target ID
 * @returns {boolean} - Whether user can report
 */
reportSchema.statics.canUserReport = async function(reporterId, targetType, targetId) {
  // Check for recent duplicate reports
  const recentReport = await this.findOne({
    reporter: reporterId,
    targetType,
    [`target${targetType.charAt(0).toUpperCase() + targetType.slice(1)}`]: targetId,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours
  });
  
  return !recentReport;
};

module.exports = mongoose.model('Report', reportSchema);