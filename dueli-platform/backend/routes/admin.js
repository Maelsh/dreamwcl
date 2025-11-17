const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const Report = require('../models/Report');
const Transaction = require('../models/Transaction');
const transparencyEngine = require('../services/transparencyEngine');

/**
 * Admin routes for Dueli Platform
 * Implements admin moderation interface (US-SI-016, US-SI-017, US-SI-015)
 */

const router = express.Router();

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard data
 * @access  Private (Admin)
 */
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalChallenges,
      liveChallenges,
      pendingReports,
      totalRevenue,
      systemHealth
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true, lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Challenge.countDocuments(),
      Challenge.countDocuments({ status: 'live' }),
      Report.countDocuments({ status: 'pending' }),
      Transaction.aggregate([
        { $match: { status: 'completed', type: 'challenge_revenue' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      transparencyEngine.getSystemHealthMetrics()
    ]);

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        totalChallenges,
        liveChallenges,
        pendingReports,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      systemHealth
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data'
    });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users for admin management
 * @access  Private (Admin)
 */
router.get('/users', [
  query('status')
    .optional()
    .isIn(['active', 'suspended', 'all'])
    .withMessage('Invalid status'),
  query('role')
    .optional()
    .isIn(['user', 'competitor', 'admin'])
    .withMessage('Invalid role'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      status = 'all',
      role,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};
    if (status !== 'all') query.isActive = status === 'active';
    if (role) query.role = role;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get users
    const users = await User.find(query)
      .select('-password -encryptedBankDetails')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const totalCount = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users'
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id/suspend
 * @desc    Suspend user account with mandatory reason (US-SI-017)
 * @access  Private (Admin)
 */
router.put('/users/:id/suspend', [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('reason')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Reason must be between 10 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const { reason } = req.body;

    // Suspend user
    user.isActive = false;
    user.suspensionReason = reason;
    user.suspendedBy = req.user.id;
    user.suspendedAt = new Date();

    await user.save();

    // Log the action in audit log
    console.log(`User ${user.username} suspended by ${req.user.username}: ${reason}`);

    res.json({
      message: 'User suspended successfully',
      user: {
        id: user._id,
        username: user.username,
        isActive: user.isActive,
        suspendedAt: user.suspendedAt
      }
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      error: 'Failed to suspend user'
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id/reactivate
 * @desc    Reactivate user account
 * @access  Private (Admin)
 */
router.put('/users/:id/reactivate', [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Reactivate user
    user.isActive = true;
    user.suspensionReason = '';
    user.suspendedBy = null;
    user.suspendedAt = null;
    user.reactivatedBy = req.user.id;
    user.reactivatedAt = new Date();

    await user.save();

    res.json({
      message: 'User reactivated successfully',
      user: {
        id: user._id,
        username: user.username,
        isActive: user.isActive,
        reactivatedAt: user.reactivatedAt
      }
    });
  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({
      error: 'Failed to reactivate user'
    });
  }
});

/**
 * @route   GET /api/admin/challenges
 * @desc    Get all challenges for admin management
 * @access  Private (Admin)
 */
router.get('/challenges', [
  query('status')
    .optional()
    .isIn(['scheduled', 'live', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      status,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get challenges
    const challenges = await Challenge.find(query)
      .populate('challenger opponent', 'username fullName email')
      .populate('winner', 'username fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const totalCount = await Challenge.countDocuments(query);

    res.json({
      challenges,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get admin challenges error:', error);
    res.status(500).json({
      error: 'Failed to fetch challenges'
    });
  }
});

/**
 * @route   PUT /api/admin/challenges/:id/cancel
 * @desc    Cancel challenge with mandatory reason (US-SI-017)
 * @access  Private (Admin)
 */
router.put('/challenges/:id/cancel', [
  param('id')
    .isMongoId()
    .withMessage('Invalid challenge ID'),
  body('reason')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Reason must be between 10 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({
        error: 'Challenge not found'
      });
    }

    const { reason } = req.body;

    // Cancel challenge
    challenge.status = 'cancelled';
    challenge.cancellationReason = reason;
    challenge.cancelledBy = req.user.id;
    challenge.cancelledAt = new Date();

    await challenge.save();

    // Log the action
    console.log(`Challenge ${challenge.title} cancelled by ${req.user.username}: ${reason}`);

    res.json({
      message: 'Challenge cancelled successfully',
      challenge: {
        id: challenge._id,
        title: challenge.title,
        status: challenge.status,
        cancelledAt: challenge.cancelledAt
      }
    });
  } catch (error) {
    console.error('Cancel challenge error:', error);
    res.status(500).json({
      error: 'Failed to cancel challenge'
    });
  }
});

/**
 * @route   GET /api/admin/system-health
 * @desc    Get system health metrics
 * @access  Private (Admin)
 */
router.get('/system-health', async (req, res) => {
  try {
    const systemHealth = await transparencyEngine.getSystemHealthMetrics();
    const liveChallenges = await transparencyEngine.getLiveChallengesForScaling();

    res.json({
      systemHealth,
      liveChallenges,
      scalingStatus: {
        concurrentUsers: systemHealth.activeConnections,
        maxCapacity: 5000, // NFR-P-002: Support for 5000 concurrent users
        utilization: (systemHealth.activeConnections / 5000) * 100
      }
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({
      error: 'Failed to fetch system health'
    });
  }
});

/**
 * @route   GET /api/admin/audit-log
 * @desc    Get audit log (simplified version)
 * @access  Private (Admin)
 */
router.get('/audit-log', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20
    } = req.query;

    // In a real implementation, this would query an audit log collection
    // For now, return sample audit entries
    const auditLog = [
      {
        timestamp: new Date(),
        action: 'user_suspended',
        admin: req.user.username,
        target: 'sample_user',
        reason: 'Violation of community guidelines'
      }
    ];

    res.json({
      auditLog,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount: 1,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({
      error: 'Failed to fetch audit log'
    });
  }
});

module.exports = router;