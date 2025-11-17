const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');

/**
 * Transaction routes for Dueli Platform
 * Handles financial transactions with 80/20 revenue distribution (US-SI-019)
 */

const router = express.Router();

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions (admin only)
 * @access  Private (Admin)
 */
router.get('/', [
  query('status')
    .optional()
    .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled'])
    .withMessage('Invalid status'),
  query('type')
    .optional()
    .isIn([
      'challenge_revenue',
      'platform_fee',
      'withdrawal',
      'deposit',
      'refund',
      'advertisement_payment',
      'subscription_payment'
    ])
    .withMessage('Invalid transaction type'),
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
      type,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
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

    res.json({
      transactions,
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
 * @route   GET /api/transactions/stats
 * @desc    Get platform revenue statistics (US-SI-019)
 * @access  Private (Admin)
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Transaction.getPlatformRevenueStats();
    res.json(stats);
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch transaction statistics'
    });
  }
});

/**
 * @route   POST /api/transactions/process-revenue
 * @desc    Process challenge revenue with 80/20 distribution
 * @access  Private (Admin)
 */
router.post('/process-revenue', [
  body('challengeId')
    .isMongoId()
    .withMessage('Invalid challenge ID'),
  body('totalRevenue')
    .isFloat({ min: 0 })
    .withMessage('Total revenue must be non-negative'),
  body('challengerId')
    .isMongoId()
    .withMessage('Invalid challenger ID'),
  body('opponentId')
    .isMongoId()
    .withMessage('Invalid opponent ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { challengeId, totalRevenue, challengerId, opponentId } = req.body;

    // Create platform transaction (20%)
    const platformTransaction = new Transaction({
      type: 'platform_fee',
      sender: challengerId, // Using challenger as sender for platform fee
      receiver: req.user.id, // Platform account
      amount: totalRevenue * 0.2,
      netAmount: totalRevenue * 0.2,
      challenge: challengeId,
      description: `Platform fee for challenge ${challengeId}`
    });

    // Create challenger transaction (40% of remaining)
    const challengerTransaction = new Transaction({
      type: 'challenge_revenue',
      sender: req.user.id, // Platform
      receiver: challengerId,
      amount: totalRevenue * 0.4,
      netAmount: totalRevenue * 0.4,
      challenge: challengeId,
      description: `Revenue share for challenge ${challengeId}`
    });

    // Create opponent transaction (40% of remaining)
    const opponentTransaction = new Transaction({
      type: 'challenge_revenue',
      sender: req.user.id, // Platform
      receiver: opponentId,
      amount: totalRevenue * 0.4,
      netAmount: totalRevenue * 0.4,
      challenge: challengeId,
      description: `Revenue share for challenge ${challengeId}`
    });

    // Process all transactions
    await Promise.all([
      platformTransaction.processWithRevenueSplit(totalRevenue * 0.2, false),
      challengerTransaction.processWithRevenueSplit(totalRevenue * 0.4, false),
      opponentTransaction.processWithRevenueSplit(totalRevenue * 0.4, false)
    ]);

    res.json({
      message: 'Revenue processed successfully with 80/20 distribution',
      transactions: {
        platform: platformTransaction,
        challenger: challengerTransaction,
        opponent: opponentTransaction
      }
    });
  } catch (error) {
    console.error('Process revenue error:', error);
    res.status(500).json({
      error: 'Failed to process revenue'
    });
  }
});

/**
 * @route   POST /api/transactions/withdrawal
 * @desc    Request withdrawal (US-CC-007)
 * @access  Private
 */
router.post('/withdrawal', [
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least 1'),
  body('currency')
    .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
    .withMessage('Invalid currency'),
  body('paymentMethod')
    .isIn(['bank_transfer', 'paypal'])
    .withMessage('Payment method must be bank_transfer or paypal')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { amount, currency, paymentMethod } = req.body;

    // Check user's financial summary
    const summary = await Transaction.getUserFinancialSummary(req.user.id);
    
    if (summary.netBalance < amount) {
      return res.status(400).json({
        error: 'Insufficient balance'
      });
    }

    // Create withdrawal transaction
    const withdrawal = new Transaction({
      type: 'withdrawal',
      sender: req.user.id,
      receiver: req.user.id, // Self-transfer
      amount,
      netAmount: amount,
      currency,
      paymentMethod: {
        type: paymentMethod,
        // Bank details would be retrieved from user's encrypted data
      },
      description: 'User withdrawal request',
      status: 'pending'
    });

    await withdrawal.save();

    // Generate invoice
    const invoiceNumber = await withdrawal.generateInvoice();

    res.json({
      message: 'Withdrawal request submitted successfully',
      transaction: withdrawal,
      invoiceNumber
    });
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({
      error: 'Failed to process withdrawal'
    });
  }
});

/**
 * @route   GET /api/transactions/invoices/:invoiceNumber
 * @desc    Get invoice details (US-CC-007)
 * @access  Private
 */
router.get('/invoices/:invoiceNumber', [
  param('invoiceNumber')
    .isLength({ min: 1 })
    .withMessage('Invoice number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const transaction = await Transaction.findOne({
      'invoice.invoiceNumber': req.params.invoiceNumber,
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    })
      .populate('sender receiver', 'username fullName email')
      .populate('challenge', 'title topic');

    if (!transaction) {
      return res.status(404).json({
        error: 'Invoice not found'
      });
    }

    res.json({
      invoiceNumber: transaction.invoice.invoiceNumber,
      transaction: transaction,
      generatedAt: transaction.invoice.generatedAt
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      error: 'Failed to fetch invoice'
    });
  }
});

module.exports = router;