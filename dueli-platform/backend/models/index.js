/**
 * Model index file for Dueli Platform
 * Exports all MongoDB models for easy importing
 * This file serves as the central export point for all database models
 */

const User = require('./User');
const Challenge = require('./Challenge');
const RatingComment = require('./RatingComment');
const Report = require('./Report');
const Transaction = require('./Transaction');

// Model relationships and associations
/**
 * Define model relationships and associations
 * This ensures all models are properly linked
 */
function setupModelAssociations() {
  // User relationships
  User.hasManyChallenges = User.hasMany(Challenge, 'challenger');
  User.hasManyChallenges = User.hasMany(Challenge, 'opponent');
  User.hasManyRatings = User.hasMany(RatingComment, 'rater');
  User.hasManyRatingsReceived = User.hasMany(RatingComment, 'ratee');
  User.hasManyReports = User.hasMany(Report, 'reporter');
  User.hasManyReportsReceived = User.hasMany(Report, 'targetUser');
  User.hasManyTransactionsSent = User.hasMany(Transaction, 'sender');
  User.hasManyTransactionsReceived = User.hasMany(Transaction, 'receiver');
  
  // Challenge relationships
  Challenge.belongsToUser = Challenge.belongsTo(User, 'challenger');
  Challenge.belongsToUser = Challenge.belongsTo(User, 'opponent');
  Challenge.hasManyRatings = Challenge.hasMany(RatingComment, 'challenge');
  Challenge.hasManyReports = Challenge.hasMany(Report, 'targetChallenge');
  Challenge.hasManyTransactions = Challenge.hasMany(Transaction, 'challenge');
  
  // RatingComment relationships
  RatingComment.belongsToUser = RatingComment.belongsTo(User, 'rater');
  RatingComment.belongsToUser = RatingComment.belongsTo(User, 'ratee');
  RatingComment.belongsToChallenge = RatingComment.belongsTo(Challenge, 'challenge');
  
  // Report relationships
  Report.belongsToUser = Report.belongsTo(User, 'reporter');
  Report.belongsToUser = Report.belongsTo(User, 'targetUser');
  Report.belongsToChallenge = Report.belongsTo(Challenge, 'targetChallenge');
  Report.belongsToRatingComment = Report.belongsTo(RatingComment, 'targetRating');
  
  // Transaction relationships
  Transaction.belongsToUser = Transaction.belongsTo(User, 'sender');
  Transaction.belongsToUser = Transaction.belongsTo(User, 'receiver');
  Transaction.belongsToChallenge = Transaction.belongsTo(Challenge, 'challenge');
}

// Export all models
module.exports = {
  User,
  Challenge,
  RatingComment,
  Report,
  Transaction,
  setupModelAssociations
};