const mongoose = require('mongoose');

/**
 * Challenge Schema for Dueli Platform
 * Implements Challenge entity from Class Diagram
 * Manages live debate competitions and streaming
 */

const challengeSchema = new mongoose.Schema({
  // Challenge identification
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  
  // Challenge participants
  challenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  opponent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Challenge status and timing
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  scheduledStartTime: {
    type: Date,
    required: true
  },
  actualStartTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  
  // Streaming and media control (US-CC-004)
  streamSettings: {
    challenger: {
      cameraEnabled: { type: Boolean, default: true },
      screenShareEnabled: { type: Boolean, default: false },
      currentStreamType: { type: String, enum: ['camera', 'screen'], default: 'camera' }
    },
    opponent: {
      cameraEnabled: { type: Boolean, default: true },
      screenShareEnabled: { type: Boolean, default: false },
      currentStreamType: { type: String, enum: ['camera', 'screen'], default: 'camera' }
    }
  },
  
  // WebRTC session information
  webrtcSession: {
    challengerStreamId: String,
    opponentStreamId: String,
    roomId: String,
    streamUrl: String
  },
  
  // Viewership tracking
  viewerCount: {
    type: Number,
    default: 0
  },
  maxViewerCount: {
    type: Number,
    default: 0
  },
  
  // Revenue tracking (US-SI-019)
  revenue: {
    totalRevenue: { type: Number, default: 0 },
    platformRevenue: { type: Number, default: 0 },
    challengerRevenue: { type: Number, default: 0 },
    opponentRevenue: { type: Number, default: 0 }
  },
  
  // Challenge outcome
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  outcome: {
    type: String,
    enum: ['challenger_won', 'opponent_won', 'draw', 'cancelled', 'pending'],
    default: 'pending'
  },
  
  // Rating and feedback
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Advertisement management (US-CC-006)
  advertisements: [{
    adId: String,
    advertiser: String,
    content: String,
    duration: Number,
    isDismissed: { type: Boolean, default: false },
    dismissedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dismissedAt: Date,
    revenue: { type: Number, default: 0 }
  }],
  
  // Challenge settings
  settings: {
    maxDuration: { type: Number, default: 3600 }, // 1 hour in seconds
    allowScreenShare: { type: Boolean, default: true },
    recordChallenge: { type: Boolean, default: true },
    enableAds: { type: Boolean, default: true },
    admissionFee: { type: Number, default: 0 }
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

// Indexes for performance
challengeSchema.index({ status: 1 });
challengeSchema.index({ challenger: 1 });
challengeSchema.index({ opponent: 1 });
challengeSchema.index({ scheduledStartTime: 1 });
challengeSchema.index({ 'revenue.totalRevenue': -1 });

/**
 * Method to start a challenge
 */
challengeSchema.methods.startChallenge = async function() {
  this.status = 'live';
  this.actualStartTime = new Date();
  await this.save();
};

/**
 * Method to end a challenge
 * @param {string} winnerId - ID of the winning user
 */
challengeSchema.methods.endChallenge = async function(winnerId) {
  this.status = 'completed';
  this.endTime = new Date();
  
  if (winnerId) {
    this.winner = winnerId;
    if (winnerId.toString() === this.challenger.toString()) {
      this.outcome = 'challenger_won';
    } else {
      this.outcome = 'opponent_won';
    }
  } else {
    this.outcome = 'draw';
  }
  
  await this.save();
};

/**
 * Method to calculate revenue distribution (80/20 logic)
 * @param {number} totalRevenue - Total revenue from the challenge
 */
challengeSchema.methods.calculateRevenueDistribution = async function(totalRevenue) {
  // Platform takes 20%
  const platformShare = totalRevenue * 0.2;
  
  // Competitors share 80%
  const competitorShare = totalRevenue * 0.8;
  
  // Distribute based on ratings and performance
  const challenger = await mongoose.model('User').findById(this.challenger);
  const opponent = await mongoose.model('User').findById(this.opponent);
  
  const totalRating = challenger.overallRating + opponent.overallRating;
  const challengerRatio = challenger.overallRating / totalRating;
  const opponentRatio = opponent.overallRating / totalRating;
  
  this.revenue = {
    totalRevenue,
    platformRevenue: platformShare,
    challengerRevenue: competitorShare * challengerRatio,
    opponentRevenue: competitorShare * opponentRatio
  };
  
  await this.save();
};

/**
 * Method to update viewer count
 * @param {number} count - Current viewer count
 */
challengeSchema.methods.updateViewerCount = async function(count) {
  this.viewerCount = count;
  if (count > this.maxViewerCount) {
    this.maxViewerCount = count;
  }
  await this.save();
};

/**
 * Method to toggle stream type (camera/screen share)
 * @param {string} userId - User ID toggling the stream
 * @param {string} streamType - 'camera' or 'screen'
 */
challengeSchema.methods.toggleStreamType = async function(userId, streamType) {
  const isChallenger = userId.toString() === this.challenger.toString();
  
  if (isChallenger) {
    this.streamSettings.challenger.currentStreamType = streamType;
  } else {
    this.streamSettings.opponent.currentStreamType = streamType;
  }
  
  await this.save();
};

/**
 * Method to dismiss advertisement
 * @param {string} adId - Advertisement ID
 * @param {string} userId - User dismissing the ad
 */
challengeSchema.methods.dismissAdvertisement = async function(adId, userId) {
  const ad = this.advertisements.id(adId);
  if (ad && !ad.isDismissed) {
    ad.isDismissed = true;
    ad.dismissedBy = userId;
    ad.dismissedAt = new Date();
    await this.save();
  }
};

module.exports = mongoose.model('Challenge', challengeSchema);