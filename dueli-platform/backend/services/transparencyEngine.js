const User = require('../models/User');
const Challenge = require('../models/Challenge');
const RatingComment = require('../models/RatingComment');
const Report = require('../models/Report');
const Transaction = require('../models/Transaction');

/**
 * Real-Time Transparency Engine for Dueli Platform
 * Implements sub-second latency updates per NFR-P-001
 * Provides transparent data exposure per US-VR-010
 */

class TransparencyEngine {
  constructor() {
    this.io = null;
    this.updateInterval = null;
    this.metricsCache = new Map();
    this.cacheTimeout = 5000; // 5 seconds cache
  }

  /**
   * Initialize transparency engine with WebSocket
   * @param {object} io - Socket.IO instance
   */
  initialize(io) {
    this.io = io;
    this.startRealTimeUpdates();
    console.log('Transparency Engine initialized');
  }

  /**
   * Start real-time metric updates
   * Updates every 100ms for sub-second latency (NFR-P-001)
   */
  startRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      try {
        await this.broadcastRealTimeMetrics();
      } catch (error) {
        console.error('Real-time update error:', error);
      }
    }, 100); // 100ms for sub-second latency
  }

  /**
   * Stop real-time updates
   */
  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Get real-time metrics for all active challenges
   * @returns {object} Real-time metrics
   */
  async getRealTimeMetrics() {
    try {
      // Get active challenges
      const activeChallenges = await Challenge.find({ 
        status: 'live' 
      })
        .populate('challenger opponent', 'username fullName overallRating followerCount')
        .select('title topic viewerCount maxViewerCount revenue streamSettings');

      // Get top-rated users
      const topRatedUsers = await User.find({ 
        role: 'competitor', 
        isActive: true 
      })
        .sort({ overallRating: -1 })
        .limit(10)
        .select('username fullName avatar overallRating followerCount reportCount');

      // Get recent ratings
      const recentRatings = await RatingComment.find({ 
        isHidden: false 
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('rater ratee', 'username fullName avatar')
        .select('rating comment createdAt');

      // Get platform statistics
      const platformStats = await this.getPlatformStatistics();

      return {
        activeChallenges: activeChallenges.map(challenge => ({
          id: challenge._id,
          title: challenge.title,
          topic: challenge.topic,
          challenger: challenge.challenger,
          opponent: challenge.opponent,
          viewerCount: challenge.viewerCount,
          maxViewerCount: challenge.maxViewerCount,
          revenue: challenge.revenue,
          streamSettings: challenge.streamSettings,
          updatedAt: new Date()
        })),
        topRatedUsers: topRatedUsers.map(user => ({
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
          overallRating: user.overallRating,
          followerCount: user.followerCount,
          reportCount: user.reportCount
        })),
        recentRatings: recentRatings.map(rating => ({
          id: rating._id,
          rater: rating.rater,
          ratee: rating.ratee,
          rating: rating.rating,
          comment: rating.comment,
          createdAt: rating.createdAt
        })),
        platformStats,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Get real-time metrics error:', error);
      return this.getCachedMetrics();
    }
  }

  /**
   * Broadcast real-time metrics to all connected clients
   */
  async broadcastRealTimeMetrics() {
    if (!this.io) return;

    const metrics = await this.getRealTimeMetrics();
    
    // Cache metrics for fallback
    this.metricsCache.set('latest', {
      data: metrics,
      timestamp: new Date()
    });

    // Broadcast to all clients
    this.io.emit('real-time-metrics', metrics);
    
    // Also broadcast to specific rooms for granular updates
    metrics.activeChallenges.forEach(challenge => {
      this.io.to(`challenge-${challenge.id}`).emit('challenge-metrics', {
        challengeId: challenge.id,
        viewerCount: challenge.viewerCount,
        maxViewerCount: challenge.maxViewerCount,
        revenue: challenge.revenue
      });
    });
  }

  /**
   * Get cached metrics if real-time fetch fails
   */
  getCachedMetrics() {
    const cached = this.metricsCache.get('latest');
    if (cached && (new Date() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }

    // Return empty metrics if no cache
    return {
      activeChallenges: [],
      topRatedUsers: [],
      recentRatings: [],
      platformStats: {
        totalUsers: 0,
        activeChallenges: 0,
        totalRevenue: 0,
        averageRating: 0
      },
      lastUpdated: new Date()
    };
  }

  /**
   * Get platform-wide statistics
   */
  async getPlatformStatistics() {
    try {
      const [
        totalUsers,
        activeChallengesCount,
        platformRevenue,
        averageRating,
        totalReports,
        resolvedReports
      ] = await Promise.all([
        User.countDocuments({ isActive: true }),
        Challenge.countDocuments({ status: 'live' }),
        Transaction.aggregate([
          { $match: { status: 'completed', type: 'challenge_revenue' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        User.aggregate([
          { $match: { role: 'competitor', isActive: true } },
          { $group: { _id: null, avg: { $avg: '$overallRating' } } }
        ]),
        Report.countDocuments(),
        Report.countDocuments({ status: 'resolved' })
      ]);

      return {
        totalUsers,
        activeChallenges: activeChallengesCount,
        totalRevenue: platformRevenue[0]?.total || 0,
        averageRating: averageRating[0]?.avg || 0,
        totalReports,
        resolvedReports,
        reportResolutionRate: totalReports > 0 ? (resolvedReports / totalReports) * 100 : 0
      };
    } catch (error) {
      console.error('Get platform statistics error:', error);
      return {
        totalUsers: 0,
        activeChallenges: 0,
        totalRevenue: 0,
        averageRating: 0,
        totalReports: 0,
        resolvedReports: 0,
        reportResolutionRate: 0
      };
    }
  }

  /**
   * Get transparent user data (US-VR-010)
   * @param {string} userId - User ID
   * @returns {object} Transparent user metrics
   */
  async getTransparentUserData(userId) {
    try {
      const user = await User.findById(userId)
        .select('username fullName avatar bio overallRating followerCount reportCount createdAt');

      if (!user) {
        return null;
      }

      // Get user's recent challenges
      const recentChallenges = await Challenge.find({
        $or: [{ challenger: userId }, { opponent: userId }],
        status: 'completed'
      })
        .sort({ endTime: -1 })
        .limit(10)
        .select('title topic winner revenue createdAt');

      // Get user's rating statistics
      const ratingStats = await RatingComment.getUserRatingStats(userId);

      // Get user's financial summary
      const financialSummary = await Transaction.getUserFinancialSummary(userId);

      return {
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
          bio: user.bio,
          overallRating: user.overallRating,
          followerCount: user.followerCount,
          reportCount: user.reportCount,
          accountCreated: user.createdAt
        },
        recentChallenges: recentChallenges.map(challenge => ({
          id: challenge._id,
          title: challenge.title,
          topic: challenge.topic,
          winner: challenge.winner,
          revenue: challenge.revenue,
          completedAt: challenge.endTime
        })),
        ratingStats,
        financialSummary,
        transparencyScore: this.calculateTransparencyScore(user, ratingStats, recentChallenges)
      };
    } catch (error) {
      console.error('Get transparent user data error:', error);
      return null;
    }
  }

  /**
   * Calculate transparency score for a user
   * Based on activity, ratings, and engagement
   */
  calculateTransparencyScore(user, ratingStats, challenges) {
    try {
      let score = 0;

      // Account age factor (max 20 points)
      const accountAge = (new Date() - user.createdAt) / (1000 * 60 * 60 * 24);
      score += Math.min(accountAge / 30 * 20, 20);

      // Rating factor (max 30 points)
      const ratingScore = user.overallRating * 6;
      score += Math.min(ratingScore, 30);

      // Activity factor (max 25 points)
      const challengeCount = challenges.length;
      score += Math.min(challengeCount * 2.5, 25);

      // Engagement factor (max 15 points)
      const engagementScore = Math.min(user.followerCount / 10, 15);
      score += engagementScore;

      // Verification factor (max 10 points)
      if (user.isVerified) score += 10;

      return Math.round(score);
    } catch (error) {
      console.error('Calculate transparency score error:', error);
      return 0;
    }
  }

  /**
   * Update user metrics in real-time
   * @param {string} userId - User ID
   * @param {object} updates - Metric updates
   */
  async updateUserMetrics(userId, updates) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Apply updates
      if (updates.rating !== undefined) {
        await user.updateRating(updates.rating);
      }

      if (updates.followerCount !== undefined) {
        user.followerCount = updates.followerCount;
        await user.save();
      }

      if (updates.reportCount !== undefined) {
        user.reportCount = updates.reportCount;
        user.isReported = updates.reportCount > 0;
        await user.save();
      }

      // Broadcast update
      if (this.io) {
        const transparentData = await this.getTransparentUserData(userId);
        this.io.to(`user-${userId}`).emit('user-metrics-updated', transparentData);
        this.io.emit('global-metrics-update', {
          userId,
          metrics: {
            overallRating: user.overallRating,
            followerCount: user.followerCount,
            reportCount: user.reportCount
          }
        });
      }
    } catch (error) {
      console.error('Update user metrics error:', error);
    }
  }

  /**
   * Handle challenge metrics update
   * @param {string} challengeId - Challenge ID
   * @param {object} updates - Challenge metric updates
   */
  async updateChallengeMetrics(challengeId, updates) {
    try {
      const challenge = await Challenge.findById(challengeId);
      if (!challenge) return;

      // Apply updates
      if (updates.viewerCount !== undefined) {
        await challenge.updateViewerCount(updates.viewerCount);
      }

      if (updates.revenue !== undefined) {
        await challenge.calculateRevenueDistribution(updates.revenue);
      }

      // Broadcast update
      if (this.io) {
        this.io.to(`challenge-${challengeId}`).emit('challenge-metrics-updated', {
          challengeId,
          viewerCount: challenge.viewerCount,
          maxViewerCount: challenge.maxViewerCount,
          revenue: challenge.revenue,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Update challenge metrics error:', error);
    }
  }

  /**
   * Get live challenges for scalability monitoring (NFR-P-002)
   */
  async getLiveChallengesForScaling() {
    try {
      const liveChallenges = await Challenge.find({ status: 'live' })
        .populate('challenger opponent', 'username streamPreferences')
        .select('title topic viewerCount streamSettings webrtcSession');

      return liveChallenges.map(challenge => ({
        id: challenge._id,
        title: challenge.title,
        topic: challenge.topic,
        viewerCount: challenge.viewerCount,
        streamSettings: challenge.streamSettings,
        webrtcSession: challenge.webrtcSession,
        participants: {
          challenger: challenge.challenger,
          opponent: challenge.opponent
        }
      }));
    } catch (error) {
      console.error('Get live challenges for scaling error:', error);
      return [];
    }
  }

  /**
   * Get system health metrics for monitoring
   */
  async getSystemHealthMetrics() {
    try {
      const [
        activeConnections,
        liveChallenges,
        totalUsers,
        systemLoad
      ] = await Promise.all([
        this.io ? Object.keys(this.io.sockets.sockets).length : 0,
        Challenge.countDocuments({ status: 'live' }),
        User.countDocuments({ isActive: true }),
        process.memoryUsage()
      ]);

      return {
        activeConnections,
        liveChallenges,
        totalUsers,
        memoryUsage: {
          used: Math.round(systemLoad.heapUsed / 1024 / 1024),
          total: Math.round(systemLoad.heapTotal / 1024 / 1024),
          external: Math.round(systemLoad.external / 1024 / 1024)
        },
        uptime: process.uptime(),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Get system health metrics error:', error);
      return null;
    }
  }
}

// Create singleton instance
const transparencyEngine = new TransparencyEngine();

module.exports = transparencyEngine;