const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const { competitorOnly } = require('../middleware/auth');

/**
 * Challenge routes for Dueli Platform
 * Handles challenge creation, management, streaming controls, and live updates
 * Implements US-CC-004, US-CC-006, and real-time transparency features
 */

const router = express.Router();

/**
 * @route   GET /api/challenges
 * @desc    Get all challenges with filtering and pagination
 * @access  Private
 */
router.get('/', [
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
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['createdAt', 'scheduledStartTime', 'viewerCount', 'revenue'])
    .withMessage('Invalid sort field')
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
      limit = 20,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;

    // Get challenges
    const challenges = await Challenge.find(query)
      .populate('challenger', 'username fullName avatar overallRating')
      .populate('opponent', 'username fullName avatar overallRating')
      .populate('winner', 'username fullName')
      .sort({ [sort]: sortOrder })
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
    console.error('Get challenges error:', error);
    res.status(500).json({
      error: 'Failed to fetch challenges'
    });
  }
});

/**
 * @route   GET /api/challenges/:id
 * @desc    Get single challenge by ID
 * @access  Private
 */
router.get('/:id', [
  param('id')
    .isMongoId()
    .withMessage('Invalid challenge ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const challenge = await Challenge.findById(req.params.id)
      .populate('challenger', 'username fullName avatar overallRating followerCount')
      .populate('opponent', 'username fullName avatar overallRating followerCount')
      .populate('winner', 'username fullName')
      .populate('ratings.user', 'username fullName')
      .lean();

    if (!challenge) {
      return res.status(404).json({
        error: 'Challenge not found'
      });
    }

    res.json(challenge);
  } catch (error) {
    console.error('Get challenge error:', error);
    res.status(500).json({
      error: 'Failed to fetch challenge'
    });
  }
});

/**
 * @route   POST /api/challenges
 * @desc    Create a new challenge
 * @access  Private (Competitors only)
 */
router.post('/', competitorOnly, [
  body('title')
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('topic')
    .isLength({ min: 3, max: 100 })
    .withMessage('Topic must be between 3 and 100 characters'),
  body('opponent')
    .isMongoId()
    .withMessage('Invalid opponent ID'),
  body('scheduledStartTime')
    .isISO8601()
    .withMessage('Invalid start time format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Start time must be in the future');
      }
      return true;
    }),
  body('settings.maxDuration')
    .optional()
    .isInt({ min: 300, max: 7200 })
    .withMessage('Duration must be between 5 minutes and 2 hours'),
  body('settings.admissionFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Admission fee must be non-negative')
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
      title,
      description,
      topic,
      opponent,
      scheduledStartTime,
      settings = {}
    } = req.body;

    // Verify opponent exists and is a competitor
    const opponentUser = await User.findById(opponent);
    if (!opponentUser) {
      return res.status(404).json({
        error: 'Opponent not found'
      });
    }

    if (opponentUser.role !== 'competitor' && opponentUser.role !== 'admin') {
      return res.status(400).json({
        error: 'Opponent must be a competitor'
      });
    }

    // Cannot challenge yourself
    if (opponent === req.user.id) {
      return res.status(400).json({
        error: 'Cannot challenge yourself'
      });
    }

    // Create challenge
    const challenge = new Challenge({
      title,
      description,
      topic,
      challenger: req.user.id,
      opponent,
      scheduledStartTime: new Date(scheduledStartTime),
      settings: {
        maxDuration: settings.maxDuration || 3600,
        allowScreenShare: settings.allowScreenShare !== false,
        recordChallenge: settings.recordChallenge !== false,
        enableAds: settings.enableAds !== false,
        admissionFee: settings.admissionFee || 0
      }
    });

    await challenge.save();

    // Populate for response
    await challenge.populate('challenger', 'username fullName avatar overallRating');
    await challenge.populate('opponent', 'username fullName avatar overallRating');

    res.status(201).json({
      message: 'Challenge created successfully',
      challenge
    });
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json({
      error: 'Failed to create challenge'
    });
  }
});

/**
 * @route   PUT /api/challenges/:id/start
 * @desc    Start a challenge (US-CC-004)
 * @access  Private (Competitors only)
 */
router.put('/:id/start', competitorOnly, [
  param('id')
    .isMongoId()
    .withMessage('Invalid challenge ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const challenge = await Challenge.findById(req.params.id)
      .populate('challenger opponent', 'username fullName');

    if (!challenge) {
      return res.status(404).json({
        error: 'Challenge not found'
      });
    }

    // Check if user is a participant
    const isParticipant = req.user.id === challenge.challenger._id.toString() ||
                         req.user.id === challenge.opponent._id.toString();

    if (!isParticipant) {
      return res.status(403).json({
        error: 'Only participants can start the challenge'
      });
    }

    // Check if challenge is scheduled
    if (challenge.status !== 'scheduled') {
      return res.status(400).json({
        error: 'Challenge cannot be started'
      });
    }

    // Start the challenge
    await challenge.startChallenge();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`challenge-${challenge._id}`).emit('challenge-started', {
      challengeId: challenge._id,
      startedAt: challenge.actualStartTime,
      status: challenge.status
    });

    res.json({
      message: 'Challenge started successfully',
      challenge
    });
  } catch (error) {
    console.error('Start challenge error:', error);
    res.status(500).json({
      error: 'Failed to start challenge'
    });
  }
});

/**
 * @route   PUT /api/challenges/:id/end
 * @desc    End a challenge
 * @access  Private (Competitors only)
 */
router.put('/:id/end', competitorOnly, [
  param('id')
    .isMongoId()
    .withMessage('Invalid challenge ID'),
  body('winner')
    .optional()
    .isMongoId()
    .withMessage('Invalid winner ID')
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

    // Check if user is a participant
    const isParticipant = req.user.id === challenge.challenger.toString() ||
                         req.user.id === challenge.opponent.toString();

    if (!isParticipant) {
      return res.status(403).json({
        error: 'Only participants can end the challenge'
      });
    }

    // Check if challenge is live
    if (challenge.status !== 'live') {
      return res.status(400).json({
        error: 'Challenge is not currently live'
      });
    }

    // End the challenge
    const { winner } = req.body;
    await challenge.endChallenge(winner);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`challenge-${challenge._id}`).emit('challenge-ended', {
      challengeId: challenge._id,
      endedAt: challenge.endTime,
      status: challenge.status,
      winner: challenge.winner,
      outcome: challenge.outcome
    });

    res.json({
      message: 'Challenge ended successfully',
      challenge
    });
  } catch (error) {
    console.error('End challenge error:', error);
    res.status(500).json({
      error: 'Failed to end challenge'
    });
  }
});

/**
 * @route   PUT /api/challenges/:id/stream/toggle
 * @desc    Toggle stream type (camera/screen share) (US-CC-004)
 * @access  Private (Competitors only)
 */
router.put('/:id/stream/toggle', competitorOnly, [
  param('id')
    .isMongoId()
    .withMessage('Invalid challenge ID'),
  body('streamType')
    .isIn(['camera', 'screen'])
    .withMessage('Stream type must be camera or screen')
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

    // Check if user is a participant
    const isParticipant = req.user.id === challenge.challenger.toString() ||
                         req.user.id === challenge.opponent.toString();

    if (!isParticipant) {
      return res.status(403).json({
        error: 'Only participants can control their stream'
      });
    }

    // Check if challenge is live
    if (challenge.status !== 'live') {
      return res.status(400).json({
        error: 'Stream can only be toggled during live challenges'
      });
    }

    const { streamType } = req.body;
    
    // Toggle stream type
    await challenge.toggleStreamType(req.user.id, streamType);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`challenge-${challenge._id}`).emit('stream-toggled', {
      challengeId: challenge._id,
      userId: req.user.id,
      streamType,
      timestamp: new Date()
    });

    res.json({
      message: 'Stream toggled successfully',
      streamType
    });
  } catch (error) {
    console.error('Toggle stream error:', error);
    res.status(500).json({
      error: 'Failed to toggle stream'
    });
  }
});

/**
 * @route   PUT /api/challenges/:id/ads/:adId/dismiss
 * @desc    Dismiss advertisement (US-CC-006)
 * @access  Private (Competitors only)
 */
router.put('/:id/ads/:adId/dismiss', competitorOnly, [
  param('id')
    .isMongoId()
    .withMessage('Invalid challenge ID'),
  param('adId')
    .isLength({ min: 1 })
    .withMessage('Ad ID is required')
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

    // Check if user is a participant
    const isParticipant = req.user.id === challenge.challenger.toString() ||
                         req.user.id === challenge.opponent.toString();

    if (!isParticipant) {
      return res.status(403).json({
        error: 'Only participants can dismiss advertisements'
      });
    }

    // Check if challenge is live
    if (challenge.status !== 'live') {
      return res.status(400).json({
        error: 'Advertisements can only be dismissed during live challenges'
      });
    }

    // Dismiss advertisement
    await challenge.dismissAdvertisement(req.params.adId, req.user.id);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`challenge-${challenge._id}`).emit('ad-dismissed', {
      challengeId: challenge._id,
      adId: req.params.adId,
      dismissedBy: req.user.id,
      timestamp: new Date()
    });

    res.json({
      message: 'Advertisement dismissed successfully'
    });
  } catch (error) {
    console.error('Dismiss ad error:', error);
    res.status(500).json({
      error: 'Failed to dismiss advertisement'
    });
  }
});

/**
 * @route   POST /api/challenges/:id/rate
 * @desc    Rate a challenge participant
 * @access  Private
 */
router.post('/:id/rate', [
  param('id')
    .isMongoId()
    .withMessage('Invalid challenge ID'),
  body('targetUser')
    .isMongoId()
    .withMessage('Invalid target user ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Comment must be less than 500 characters')
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

    const { targetUser, rating, comment } = req.body;

    // Check if target user is a participant
    const isParticipant = targetUser === challenge.challenger.toString() ||
                         targetUser === challenge.opponent.toString();

    if (!isParticipant) {
      return res.status(400).json({
        error: 'Can only rate challenge participants'
      });
    }

    // Check if challenge is completed
    if (challenge.status !== 'completed') {
      return res.status(400).json({
        error: 'Can only rate completed challenges'
      });
    }

    // Check if user already rated this participant for this challenge
    const existingRating = challenge.ratings.find(
      r => r.user.toString() === req.user.id && r.targetUser.toString() === targetUser
    );

    if (existingRating) {
      return res.status(400).json({
        error: 'You have already rated this participant for this challenge'
      });
    }

    // Add rating
    challenge.ratings.push({
      user: req.user.id,
      rating,
      targetUser,
      comment: comment || ''
    });

    await challenge.save();

    // Update user's overall rating
    const targetUserDoc = await User.findById(targetUser);
    await targetUserDoc.updateRating(rating);

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('rating-updated', {
      userId: targetUser,
      newRating: targetUserDoc.overallRating,
      challengeId: challenge._id,
      ratedBy: req.user.id
    });

    res.json({
      message: 'Rating submitted successfully'
    });
  } catch (error) {
    console.error('Rate challenge error:', error);
    res.status(500).json({
      error: 'Failed to submit rating'
    });
  }
});

/**
 * @route   PUT /api/challenges/:id/viewer-count
 * @desc    Update viewer count (for real-time transparency)
 * @access  Private
 */
router.put('/:id/viewer-count', [
  param('id')
    .isMongoId()
    .withMessage('Invalid challenge ID'),
  body('count')
    .isInt({ min: 0 })
    .withMessage('Viewer count must be non-negative')
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

    const { count } = req.body;
    
    // Update viewer count
    await challenge.updateViewerCount(count);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`challenge-${challenge._id}`).emit('viewer-count-updated', {
      challengeId: challenge._id,
      viewerCount: count,
      maxViewerCount: challenge.maxViewerCount,
      timestamp: new Date()
    });

    res.json({
      message: 'Viewer count updated successfully',
      viewerCount: count,
      maxViewerCount: challenge.maxViewerCount
    });
  } catch (error) {
    console.error('Update viewer count error:', error);
    res.status(500).json({
      error: 'Failed to update viewer count'
    });
  }
});

module.exports = router;