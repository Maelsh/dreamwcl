const mongoose = require('crypto');

/**
 * Transaction Schema for Dueli Platform
 * Implements Transaction entity from Class Diagram
 * Manages financial transactions with encryption per NFR-S-003
 */

const transactionSchema = new mongoose.Schema({
  // Transaction identification
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Transaction type
  type: {
    type: String,
    enum: [
      'challenge_revenue',
      'platform_fee',
      'withdrawal',
      'deposit',
      'refund',
      'advertisement_payment',
      'subscription_payment'
    ],
    required: true
  },
  
  // Transaction parties
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Associated challenge (if applicable)
  challenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge'
  },
  
  // Financial details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  },
  
  // Platform fee calculation (80/20 split per US-SI-019)
  platformFee: {
    type: Number,
    default: 0
  },
  
  netAmount: {
    type: Number,
    required: true
  },
  
  // Transaction status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Payment method information (encrypted per NFR-S-003)
  paymentMethod: {
    type: {
      type: String,
      enum: ['bank_transfer', 'credit_card', 'debit_card', 'paypal', 'cryptocurrency']
    },
    // Encrypted payment details stored as string
    encryptedDetails: String,
    lastFour: String // Last 4 digits for reference
  },
  
  // Bank details for withdrawals (encrypted)
  bankDetails: {
    encryptedAccount: String,
    encryptedRouting: String,
    bankName: String,
    accountType: {
      type: String,
      enum: ['checking', 'savings', 'business']
    }
  },
  
  // Transaction metadata
  description: {
    type: String,
    maxlength: 500
  },
  
  reference: {
    type: String,
    maxlength: 100
  },
  
  // External payment processor information
  externalProcessor: {
    processor: {
      type: String,
      enum: ['stripe', 'paypal', 'bank_transfer', 'other']
    },
    transactionRef: String,
    processorFee: Number
  },
  
  // Invoice generation (US-CC-007)
  invoice: {
    invoiceNumber: String,
    generatedAt: Date,
    sentToUser: {
      type: Boolean,
      default: false
    }
  },
  
  // Compliance and verification
  verified: {
    type: Boolean,
    default: false
  },
  
  verificationMethod: {
    type: String,
    enum: ['manual', 'automated', 'third_party']
  },
  
  // Reversal information
  isReversed: {
    type: Boolean,
    default: false
  },
  
  reversedAt: {
    type: Date
  },
  
  reversalReason: {
    type: String
  },
  
  originalTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
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
  processedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
});

// Indexes for performance
transactionSchema.index({ sender: 1, createdAt: -1 });
transactionSchema.index({ receiver: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ challenge: 1 });
transactionSchema.index({ 'invoice.invoiceNumber': 1 });

/**
 * Pre-save middleware to update timestamps and generate transaction ID
 */
transactionSchema.pre('save', async function(next) {
  this.updatedAt = new Date();
  
  // Generate unique transaction ID if not exists
  if (!this.transactionId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    this.transactionId = `TXN_${timestamp}_${random}`;
  }
  
  // Update processed and completed timestamps
  if (this.isModified('status')) {
    if (this.status === 'processing') {
      this.processedAt = new Date();
    } else if (this.status === 'completed') {
      this.completedAt = new Date();
    }
  }
  
  next();
});

/**
 * Method to encrypt sensitive payment details
 * @param {object} paymentDetails - Payment details to encrypt
 * @returns {string} - Encrypted data
 */
transactionSchema.methods.encryptPaymentDetails = function(paymentDetails) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(JSON.stringify(paymentDetails), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};

/**
 * Method to decrypt sensitive payment details
 * @returns {object} - Decrypted payment details
 */
transactionSchema.methods.decryptPaymentDetails = function() {
  if (!this.paymentMethod.encryptedDetails) return null;
  
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  const parts = this.paymentMethod.encryptedDetails.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
};

/**
 * Method to generate invoice for transaction (US-CC-007)
 */
transactionSchema.methods.generateInvoice = async function() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 4);
  
  this.invoice = {
    invoiceNumber: `INV_${timestamp}_${random}`,
    generatedAt: new Date(),
    sentToUser: false
  };
  
  await this.save();
  return this.invoice.invoiceNumber;
};

/**
 * Method to process transaction with 80/20 revenue split
 * @param {number} grossAmount - Gross transaction amount
 * @param {boolean} applyPlatformFee - Whether to apply 20% platform fee
 */
transactionSchema.methods.processWithRevenueSplit = async function(grossAmount, applyPlatformFee = true) {
  this.amount = grossAmount;
  
  if (applyPlatformFee && this.type === 'challenge_revenue') {
    this.platformFee = grossAmount * 0.2; // 20% platform fee
    this.netAmount = grossAmount * 0.8; // 80% to competitor
  } else {
    this.platformFee = 0;
    this.netAmount = grossAmount;
  }
  
  this.status = 'processing';
  await this.save();
};

/**
 * Method to reverse transaction
 * @param {string} reason - Reason for reversal
 */
transactionSchema.methods.reverse = async function(reason) {
  this.isReversed = true;
  this.reversedAt = new Date();
  this.reversalReason = reason;
  
  // Create reversal transaction
  const reversalTransaction = new this.constructor({
    type: 'refund',
    sender: this.receiver,
    receiver: this.sender,
    amount: this.netAmount,
    netAmount: this.netAmount,
    description: `Reversal of transaction ${this.transactionId}: ${reason}`,
    originalTransaction: this._id
  });
  
  await reversalTransaction.save();
  await this.save();
  
  return reversalTransaction;
};

/**
 * Static method to get user's financial summary
 * @param {string} userId - User ID
 * @returns {object} - Financial summary
 */
transactionSchema.statics.getUserFinancialSummary = async function(userId) {
  const sent = await this.aggregate([
    { $match: { sender: mongoose.Types.ObjectId(userId), status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  const received = await this.aggregate([
    { $match: { receiver: mongoose.Types.ObjectId(userId), status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$netAmount' } } }
  ]);
  
  const pending = await this.aggregate([
    { $match: { 
      $or: [
        { sender: mongoose.Types.ObjectId(userId) },
        { receiver: mongoose.Types.ObjectId(userId) }
      ],
      status: { $in: ['pending', 'processing'] }
    }},
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  return {
    totalSent: sent[0]?.total || 0,
    totalReceived: received[0]?.total || 0,
    pendingTransactions: pending[0]?.total || 0,
    netBalance: (received[0]?.total || 0) - (sent[0]?.total || 0)
  };
};

/**
 * Static method to get platform revenue statistics
 * @returns {object} - Platform revenue statistics
 */
transactionSchema.statics.getPlatformRevenueStats = async function() {
  const stats = await this.aggregate([
    { 
      $match: { 
        status: 'completed',
        type: 'challenge_revenue'
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        platformRevenue: { $sum: '$platformFee' },
        competitorRevenue: { $sum: '$netAmount' },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
  
  return stats[0] || {
    totalRevenue: 0,
    platformRevenue: 0,
    competitorRevenue: 0,
    transactionCount: 0
  };
};

module.exports = mongoose.model('Transaction', transactionSchema);