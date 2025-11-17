const express = require('express');
const { body, param, validationResult } = require('express-validator');
const User = require('../models/User');
const transparencyEngine = require('../services/transparencyEngine');

/**
 * User routes for Dueli Platform
 * Handles user profiles, transparency data, and account management
 */

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users with filtering and pagination
 * @access  Private
 */
router.get('/', [
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
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['username', 'overallRating', 'followerCount', 'createdAt'])
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
      role,
      page = 1,
      limit = 20,
      sort = 'username',
      order = 'asc'
    } = req.query;

    // Build query
    const query = { isActive: true };
    if (role) query.role = role;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;

    // Get users
    const users = await User.find(query)
      .select('-password -encryptedBankDetails')
      .sort({ [sort]: sortOrder })
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
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users'
    });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID with transparency data (US-VR-010)
 * @access  Private
 */
router.get('/:id', [
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

    const transparentData = await transparencyEngine.getTransparentUserData(req.params.id);

    if (!transparentData) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json(transparentData);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to fetch user data'
    });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', [
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
  body('streamPreferences.cameraEnabled')
    .optional()
    .isBoolean()
    .withMessage('Camera enabled must be a boolean'),
  body('streamPreferences.microphoneEnabled')
    .optional()
    .isBoolean()
    .withMessage('Microphone enabled must be a boolean'),
  body('streamPreferences.screenShareEnabled')
    .optional()
    .isBoolean()
    .withMessage('Screen share enabled must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const updates = {};
    const allowedFields = ['fullName', 'bio', 'avatar', 'streamPreferences'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -encryptedBankDetails');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile'
    });
  }
});

/**
 * @route   POST /api/users/bank-details
 * @desc    Add encrypted bank details (US-CC-007)
 * @access  Private
 */
router.post('/bank-details', [
  body('accountNumber')
    .isLength({ min: 8, max: 20 })
    .withMessage('Account number must be between 8 and 20 characters'),
  body('routingNumber')
    .isLength({ min: 9, max: 9 })
    .withMessage('Routing number must be 9 digits'),
  body('bankName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Bank name must be between 2 and 100 characters'),
  body('accountType')
    .isIn(['checking', 'savings', 'business'])
    .withMessage('Account type must be checking, savings, or business')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { accountNumber, routingNumber, bankName, accountType } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Encrypt bank details
    const bankDetails = {
      accountNumber,
      routingNumber,
      bankName,
      accountType
    };

    user.encryptedBankDetails = user.encryptBankDetails(bankDetails);
    await user.save();

    res.json({
      message: 'Bank details saved successfully',
      lastFour: accountNumber.slice(-4)
    });
  } catch (error) {
    console.error('Save bank details error:', error);
    res.status(500).json({
      error: 'Failed to save bank details'
    });
  }
});

/**
 * @route   GET /api/users/transactions
 * @desc    Get user's transaction history (US-CC-007)
 * @access  Private
 */
router.get('/transactions', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('type')
    .optional()
    .isIn(['challenge_revenue', 'platform_fee', 'withdrawal', 'deposit', 'refund'])
    .withMessage('Invalid transaction type')
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
      limit = 20,
      type
    } = req.query;

    // Build query
    const query = {
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
      status: 'completed'
    };
    if (type) query.type = type;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get transactions
    const transactions = await Transaction.find(query)
      .populate('sender receiver', 'username fullName')
      .populate('challenge', 'title topic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const totalCount = await Transaction.countDocuments(query);

    // Get financial summary
    const summary = await Transaction.getUserFinancialSummary(req.user.id);

    res.json({
      transactions,
      summary,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      error: 'Failed to fetch transactions'
    });
  }
});

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Private
 */
router.get('/search', [
  query('q')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
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
      q,
      page = 1,
      limit = 20
    } = req.query;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Search users
    const users = await User.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { fullName: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
      .select('-password -encryptedBankDetails')
      .sort({ overallRating: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const totalCount = await User.countDocuments({
      $and: [
        { isActive: true },
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { fullName: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    });

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
    console.error('Search users error:', error);
    res.status(500).json({
      error: 'Failed to search users'
    });
  }
});

module.exports = router;