const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * User Schema for Dueli Platform
 * Implements User entity from Class Diagram
 * Supports encryption for sensitive data per NFR-S-003
 */
const userSchema = new mongoose.Schema({
  // Basic user information
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  
  // User profile information
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  
  // User role and permissions
  role: {
    type: String,
    enum: ['user', 'competitor', 'admin'],
    default: 'user'
  },
  
  // Statistics for transparency (US-VR-010)
  followerCount: {
    type: Number,
    default: 0
  },
  followingCount: {
    type: Number,
    default: 0
  },
  
  // Rating system
  overallRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  
  // Report tracking (US-VR-010)
  reportCount: {
    type: Number,
    default: 0
  },
  isReported: {
    type: Boolean,
    default: false
  },
  
  // Financial information (encrypted per NFR-S-003)
  encryptedBankDetails: {
    type: String, // AES encrypted bank information
    default: ''
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // WebRTC and streaming preferences
  streamPreferences: {
    cameraEnabled: { type: Boolean, default: true },
    microphoneEnabled: { type: Boolean, default: true },
    screenShareEnabled: { type: Boolean, default: true }
  },
  
  // Timestamps
  lastLogin: {
    type: Date,
    default: Date.now
  },
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
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ overallRating: -1 });
userSchema.index({ reportCount: -1 });

/**
 * Password hashing middleware
 * Automatically hash password before saving
 */
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Method to compare password for authentication
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} - True if password matches
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Method to encrypt sensitive financial data
 * @param {object} bankDetails - Bank details to encrypt
 * @returns {string} - Encrypted data
 */
userSchema.methods.encryptBankDetails = function(bankDetails) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(JSON.stringify(bankDetails), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};

/**
 * Method to decrypt sensitive financial data
 * @returns {object} - Decrypted bank details
 */
userSchema.methods.decryptBankDetails = function() {
  if (!this.encryptedBankDetails) return null;
  
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  const parts = this.encryptedBankDetails.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
};

/**
 * Method to update user rating
 * @param {number} newRating - New rating (1-5)
 */
userSchema.methods.updateRating = async function(newRating) {
  const totalScore = (this.overallRating * this.totalRatings) + newRating;
  this.totalRatings += 1;
  this.overallRating = totalScore / this.totalRatings;
  
  await this.save();
};

/**
 * Method to increment report count
 */
userSchema.methods.incrementReportCount = async function() {
  this.reportCount += 1;
  this.isReported = this.reportCount > 0;
  
  // Auto-suspend if report count exceeds threshold
  if (this.reportCount >= 5) {
    this.isActive = false;
  }
  
  await this.save();
};

module.exports = mongoose.model('User', userSchema);