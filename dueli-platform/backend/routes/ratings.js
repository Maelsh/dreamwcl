const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const RatingComment = require('../models/RatingComment');

/**
 * Rating routes for Dueli Platform
 * Handles rating and commenting system for transparency
 */

const router = express.Router();

/**
 * @route   GET /api/ratings
 * @desc    Get ratings with filtering
 * @access  Private
 */
router.get('/', [
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID'),
  query('challengeId')
    .optional()
    .isMongoId()
    .withMessage('Invalid challenge ID'),
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
      userId,
      challengeId,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = { isHidden: false };
    if (userId) query.ratee = userId;
    if (challengeId) query.challenge = challengeId;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get ratings
    const ratings = await RatingComment.find(query)
      .populate('rater ratee', 'username fullName avatar')
      .populate('challenge', 'title topic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const totalCount = await RatingComment.countDocuments(query);

    res.json({
      ratings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({
      error: 'Failed to fetch ratings'
    });
  }
});

/**
 * @route   POST /api/ratings
 * @desc    Create a new rating
 * @access  Private
 */
router.post('/', [
  body('ratee')
    .isMongoId()
    .withMessage('Invalid ratee user ID'),
  body('challenge')
    .isMongoId()
    .withMessage('Invalid challenge ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Comment must be less than 500 characters'),
  body('categories.communication')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Communication rating must be between 1 and 5'),
  body('categories.argumentQuality')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Argument quality rating must be between 1 and 5'),
  body('categories.respectfulness')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Respectfulness rating must be between 1 and 5'),
  body('categories.presentation')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Presentation rating must be between 1 and 5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { ratee, challenge, rating, comment, categories } = req.body;

    // Check if user can rate
    const canRate = await RatingComment.canUserRate(req.user.id, ratee, challenge);
    if (!canRate) {
      return res.status(400).json({
        error: 'You have already rated this user for this challenge'
      });
    }

    // Create rating
    const newRating = new RatingComment({
      rater: req.user.id,
      ratee,
      challenge,
      rating,
      comment: comment || '',
      categories: categories || {}
    });

    await newRating.save();

    // Populate for response
    await newRating.populate('rater ratee', 'username fullName avatar');
    await newRating.populate('challenge', 'title topic');

    res.status(201).json({
      message: 'Rating created successfully',
      rating: newRating
    });
  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({
      error: 'Failed to create rating'
    });
  }
});

/**
 * @route   PUT /api/ratings/:id/flag
 * @desc    Flag a rating as inappropriate
 * @access  Private
 */
router.put('/:id/flag', [
  param('id')
    .isMongoId()
    .withMessage('Invalid rating ID'),
  body('reason')
    .isIn(['spam', 'harassment', 'inappropriate', 'false_information', 'other'])
    .withMessage('Invalid flag reason')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const rating = await RatingComment.findById(req.params.id);

    if (!rating) {
      return res.status(404).json({
        error: 'Rating not found'
      });
    }

    const { reason } = req.body;
    await rating.flag(req.user.id, reason);

    res.json({
      message: 'Rating flagged successfully'
    });
  } catch (error) {
    console.error('Flag rating error:', error);
    res.status(500).json({
      error: 'Failed to flag rating'
    });
  }
});

module.exports = router;