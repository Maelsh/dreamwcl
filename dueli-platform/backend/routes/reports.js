const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Report = require('../models/Report');

/**
 * Report routes for Dueli Platform
 * Handles user reporting system for content moderation
 */

const router = express.Router();

/**
 * @route   GET /api/reports
 * @desc    Get reports (admin only)
 * @access  Private (Admin)
 */
router.get('/', [
  query('status')
    .optional()
    .isIn(['pending', 'under_review', 'resolved', 'dismissed'])
    .withMessage('Invalid status'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
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
      priority,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get reports
    const reports = await Report.find(query)
      .populate('reporter targetUser assignedModerator', 'username fullName')
      .populate('targetChallenge', 'title topic')
      .populate('targetRating', 'rating comment')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const totalCount = await Report.countDocuments(query);

    // Get statistics
    const stats = await Report.getReportStats();

    res.json({
      reports,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      error: 'Failed to fetch reports'
    });
  }
});

/**
 * @route   POST /api/reports
 * @desc    Create a new report
 * @access  Private
 */
router.post('/', [
  body('targetType')
    .isIn(['user', 'challenge', 'rating_comment', 'advertisement'])
    .withMessage('Invalid target type'),
  body('reason')
    .isIn([
      'spam',
      'harassment',
      'hate_speech',
      'inappropriate_content',
      'false_information',
      'copyright_violation',
      'terms_violation',
      'other'
    ])
    .withMessage('Invalid report reason'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('targetUser')
    .optional()
    .isMongoId()
    .withMessage('Invalid target user ID'),
  body('targetChallenge')
    .optional()
    .isMongoId()
    .withMessage('Invalid target challenge ID'),
  body('targetRating')
    .optional()
    .isMongoId()
    .withMessage('Invalid target rating ID'),
  body('targetAdvertisement')
    .optional()
    .isString()
    .withMessage('Invalid advertisement ID')
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
      targetType,
      reason,
      description,
      targetUser,
      targetChallenge,
      targetRating,
      targetAdvertisement
    } = req.body;

    // Check if user can report
    let targetId = null;
    if (targetType === 'user') targetId = targetUser;
    else if (targetType === 'challenge') targetId = targetChallenge;
    else if (targetType === 'rating_comment') targetId = targetRating;
    else if (targetType === 'advertisement') targetId = targetAdvertisement;

    const canReport = await Report.canUserReport(req.user.id, targetType, targetId);
    if (!canReport) {
      return res.status(400).json({
        error: 'You have already reported this content recently'
      });
    }

    // Create report
    const report = new Report({
      reporter: req.user.id,
      targetType,
      reason,
      description: description || '',
      targetUser,
      targetChallenge,
      targetRating,
      targetAdvertisement
    });

    await report.save();

    // Populate for response
    await report.populate('reporter targetUser', 'username fullName');

    res.status(201).json({
      message: 'Report submitted successfully',
      report
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      error: 'Failed to create report'
    });
  }
});

/**
 * @route   PUT /api/reports/:id/assign
 * @desc    Assign report to moderator (admin only)
 * @access  Private (Admin)
 */
router.put('/:id/assign', [
  param('id')
    .isMongoId()
    .withMessage('Invalid report ID'),
  body('moderatorId')
    .isMongoId()
    .withMessage('Invalid moderator ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        error: 'Report not found'
      });
    }

    const { moderatorId } = req.body;
    await report.assignToModerator(moderatorId);

    res.json({
      message: 'Report assigned to moderator successfully'
    });
  } catch (error) {
    console.error('Assign report error:', error);
    res.status(500).json({
      error: 'Failed to assign report'
    });
  }
});

/**
 * @route   PUT /api/reports/:id/resolve
 * @desc    Resolve report with mandatory reason logging (US-SI-017)
 * @access  Private (Admin)
 */
router.put('/:id/resolve', [
  param('id')
    .isMongoId()
    .withMessage('Invalid report ID'),
  body('decision')
    .isIn(['valid', 'invalid', 'partially_valid'])
    .withMessage('Decision must be valid, invalid, or partially_valid'),
  body('resolutionNotes')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Resolution notes must be between 10 and 2000 characters'),
  body('actionsTaken')
    .isArray()
    .withMessage('Actions taken must be an array'),
  body('actionsTaken.*.action')
    .isIn([
      'warning_issued',
      'content_hidden',
      'account_suspended',
      'account_banned',
      'challenge_cancelled',
      'ad_removed',
      'no_action'
    ])
    .withMessage('Invalid action type'),
  body('actionsTaken.*.description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Action description must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        error: 'Report not found'
      });
    }

    const { decision, resolutionNotes, actionsTaken } = req.body;
    await report.resolve(decision, resolutionNotes, actionsTaken);

    res.json({
      message: 'Report resolved successfully'
    });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({
      error: 'Failed to resolve report'
    });
  }
});

/**
 * @route   GET /api/reports/stats
 * @desc    Get report statistics
 * @access  Private (Admin)
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Report.getReportStats();
    res.json(stats);
  } catch (error) {
    console.error('Get report stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch report statistics'
    });
  }
});

module.exports = router;