# Dueli Platform Database Schema

## Overview

This document describes the MongoDB database schema for the Dueli platform, implementing the entities from the Class Diagram with proper relationships and indexing for optimal performance.

## Database Connection

```javascript
// Connection string format
mongodb://localhost:27017/dueli
```

## Collections

### 1. Users Collection

**Collection Name:** `users`

**Schema:**
```javascript
{
  _id: ObjectId,
  username: String, // Unique, 3-30 characters
  email: String, // Unique, validated format
  password: String, // Hashed with bcrypt
  fullName: String, // Required
  bio: String, // Max 500 characters
  avatar: String, // URL to avatar image
  role: String, // 'user' | 'competitor' | 'admin'
  
  // Statistics for transparency (US-VR-010)
  followerCount: Number, // Default: 0
  followingCount: Number, // Default: 0
  overallRating: Number, // Default: 0, max: 5
  totalRatings: Number, // Default: 0
  
  // Report tracking (US-VR-010)
  reportCount: Number, // Default: 0
  isReported: Boolean, // Default: false
  
  // Financial data (encrypted per NFR-S-003)
  encryptedBankDetails: String, // AES encrypted
  
  // Account status
  isActive: Boolean, // Default: true
  isVerified: Boolean, // Default: false
  
  // WebRTC preferences
  streamPreferences: {
    cameraEnabled: Boolean, // Default: true
    microphoneEnabled: Boolean, // Default: true
    screenShareEnabled: Boolean // Default: true
  },
  
  // Timestamps
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date,
  
  // Admin action tracking (US-SI-017)
  suspensionReason: String,
  suspendedBy: ObjectId, // Reference to User
  suspendedAt: Date,
  reactivatedBy: ObjectId, // Reference to User
  reactivatedAt: Date
}
```

**Indexes:**
- `username` (unique)
- `email` (unique)
- `overallRating` (descending)
- `reportCount` (descending)
- `role` + `isActive`
- `createdAt` (descending)

### 2. Challenges Collection

**Collection Name:** `challenges`

**Schema:**
```javascript
{
  _id: ObjectId,
  title: String, // Required, max 100 characters
  description: String, // Required, max 1000 characters
  topic: String, // Required, max 100 characters
  
  // Participants
  challenger: ObjectId, // Reference to User (required)
  opponent: ObjectId, // Reference to User (required)
  
  // Status and timing
  status: String, // 'scheduled' | 'live' | 'completed' | 'cancelled'
  scheduledStartTime: Date, // Required
  actualStartTime: Date,
  endTime: Date,
  
  // Streaming controls (US-CC-004)
  streamSettings: {
    challenger: {
      cameraEnabled: Boolean, // Default: true
      screenShareEnabled: Boolean, // Default: false
      currentStreamType: String // 'camera' | 'screen'
    },
    opponent: {
      cameraEnabled: Boolean, // Default: true
      screenShareEnabled: Boolean, // Default: false
      currentStreamType: String // 'camera' | 'screen'
    }
  },
  
  // WebRTC session info
  webrtcSession: {
    challengerStreamId: String,
    opponentStreamId: String,
    roomId: String,
    streamUrl: String
  },
  
  // Viewership tracking
  viewerCount: Number, // Default: 0
  maxViewerCount: Number, // Default: 0
  
  // Revenue tracking (US-SI-019)
  revenue: {
    totalRevenue: Number, // Default: 0
    platformRevenue: Number, // Default: 0
    challengerRevenue: Number, // Default: 0
    opponentRevenue: Number // Default: 0
  },
  
  // Challenge outcome
  winner: ObjectId, // Reference to User
  outcome: String, // 'challenger_won' | 'opponent_won' | 'draw' | 'cancelled' | 'pending'
  
  // Ratings from viewers
  ratings: [{
    user: ObjectId, // Reference to User
    rating: Number, // 1-5
    targetUser: ObjectId, // Reference to User
    comment: String,
    createdAt: Date
  }],
  
  // Advertisement management (US-CC-006)
  advertisements: [{
    adId: String,
    advertiser: String,
    content: String,
    duration: Number,
    isDismissed: Boolean, // Default: false
    dismissedBy: ObjectId, // Reference to User
    dismissedAt: Date,
    revenue: Number // Default: 0
  }],
  
  // Challenge settings
  settings: {
    maxDuration: Number, // Default: 3600 (1 hour)
    allowScreenShare: Boolean, // Default: true
    recordChallenge: Boolean, // Default: true
    enableAds: Boolean, // Default: true
    admissionFee: Number // Default: 0
  },
  
  // Admin action tracking
  cancellationReason: String,
  cancelledBy: ObjectId, // Reference to User
  cancelledAt: Date,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `status`
- `challenger`
- `opponent`
- `scheduledStartTime`
- `revenue.totalRevenue` (descending)
- `createdAt` (descending)

### 3. RatingComments Collection

**Collection Name:** `ratingcomments`

**Schema:**
```javascript
{
  _id: ObjectId,
  rater: ObjectId, // Reference to User (required)
  ratee: ObjectId, // Reference to User (required)
  challenge: ObjectId, // Reference to Challenge
  
  // Rating information
  rating: Number, // Required, 1-5
  comment: String, // Max 500 characters
  
  // Rating categories for detailed feedback
  categories: {
    communication: Number, // 1-5
    argumentQuality: Number, // 1-5
    respectfulness: Number, // 1-5
    presentation: Number // 1-5
  },
  
  // Moderation flags
  isFlagged: Boolean, // Default: false
  flagReason: String, // 'spam' | 'harassment' | 'inappropriate' | 'false_information' | 'other'
  flaggedBy: [ObjectId], // Array of Users who flagged
  
  // Moderation actions
  isHidden: Boolean, // Default: false
  moderatedBy: ObjectId, // Reference to User (admin)
  moderationReason: String,
  moderatedAt: Date,
  
  // Transparency metrics
  isVerifiedViewer: Boolean, // Default: false
  viewerDuration: Number, // Minutes watched, Default: 0
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `rater` + `ratee` + `challenge` (unique)
- `ratee` + `rating` (descending)
- `createdAt` (descending)
- `isFlagged`
- `ratee` + `isHidden`

### 4. Reports Collection

**Collection Name:** `reports`

**Schema:**
```javascript
{
  _id: ObjectId,
  reporter: ObjectId, // Reference to User (required)
  
  // Report target (polymorphic)
  targetType: String, // 'user' | 'challenge' | 'rating_comment' | 'advertisement' (required)
  targetUser: ObjectId, // Reference to User
  targetChallenge: ObjectId, // Reference to Challenge
  targetRating: ObjectId, // Reference to RatingComment
  targetAdvertisement: String, // Ad ID
  
  // Report details
  reason: String, // Required, see enum values
  description: String, // Max 1000 characters
  
  // Evidence attachments
  evidence: [{
    type: String, // 'screenshot' | 'video' | 'text' | 'link'
    url: String,
    description: String,
    uploadedAt: Date
  }],
  
  // Report status
  status: String, // 'pending' | 'under_review' | 'resolved' | 'dismissed'
  priority: String, // 'low' | 'medium' | 'high' | 'urgent'
  
  // Moderation actions taken
  actionsTaken: [{
    action: String, // See enum values
    description: String,
    takenAt: Date
  }],
  
  // Assigned moderator
  assignedModerator: ObjectId, // Reference to User
  
  // Resolution details
  resolution: {
    decision: String, // 'valid' | 'invalid' | 'partially_valid'
    resolutionNotes: String, // Max 2000 characters
    resolvedAt: Date
  },
  
  // Automated detection
  automatedFlags: [{
    system: String, // 'spam_detection' | 'content_moderation' | 'behavior_analysis'
    flag: String,
    confidence: Number,
    detectedAt: Date
  }],
  
  // Appeal information
  appeal: {
    appealedBy: ObjectId, // Reference to User
    appealReason: String,
    appealStatus: String, // 'pending' | 'reviewed' | 'accepted' | 'rejected'
    appealReviewedAt: Date,
    appealDecision: String
  },
  
  // Transparency
  isPublic: Boolean, // Default: false
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  reviewedAt: Date
}
```

**Indexes:**
- `status` + `priority` + `createdAt` (descending)
- `reporter`
- `targetUser`
- `targetChallenge`
- `assignedModerator`
- `createdAt` (descending)

### 5. Transactions Collection

**Collection Name:** `transactions`

**Schema:**
```javascript
{
  _id: ObjectId,
  transactionId: String, // Unique, required, indexed
  
  // Transaction type
  type: String, // Required, see enum values
  
  // Transaction parties
  sender: ObjectId, // Reference to User (required)
  receiver: ObjectId, // Reference to User (required)
  challenge: ObjectId, // Reference to Challenge
  
  // Financial details
  amount: Number, // Required, min: 0
  currency: String, // Default: 'USD'
  
  // Revenue split (80/20 per US-SI-019)
  platformFee: Number, // Default: 0
  netAmount: Number, // Required
  
  // Transaction status
  status: String, // 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  
  // Payment method (encrypted per NFR-S-003)
  paymentMethod: {
    type: String, // 'bank_transfer' | 'credit_card' | 'debit_card' | 'paypal' | 'cryptocurrency'
    encryptedDetails: String, // Encrypted payment details
    lastFour: String // Last 4 digits for reference
  },
  
  // Bank details for withdrawals (encrypted)
  bankDetails: {
    encryptedAccount: String,
    encryptedRouting: String,
    bankName: String,
    accountType: String // 'checking' | 'savings' | 'business'
  },
  
  // Transaction metadata
  description: String, // Max 500 characters
  reference: String, // Max 100 characters
  
  // External payment processor
  externalProcessor: {
    processor: String, // 'stripe' | 'paypal' | 'bank_transfer' | 'other'
    transactionRef: String,
    processorFee: Number
  },
  
  // Invoice generation (US-CC-007)
  invoice: {
    invoiceNumber: String,
    generatedAt: Date,
    sentToUser: Boolean // Default: false
  },
  
  // Compliance and verification
  verified: Boolean, // Default: false
  verificationMethod: String, // 'manual' | 'automated' | 'third_party'
  
  // Reversal information
  isReversed: Boolean, // Default: false
  reversedAt: Date,
  reversalReason: String,
  originalTransaction: ObjectId, // Self-reference
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  processedAt: Date,
  completedAt: Date
}
```

**Indexes:**
- `sender` + `createdAt` (descending)
- `receiver` + `createdAt` (descending)
- `status` + `createdAt` (descending)
- `transactionId` (unique)
- `challenge`
- `invoice.invoiceNumber`

---

## Relationships

### User Relationships
- **Challenges Created**: User → Challenge (as challenger)
- **Challenges Participated**: User → Challenge (as opponent)
- **Ratings Given**: User → RatingComment (as rater)
- **Ratings Received**: User → RatingComment (as ratee)
- **Reports Filed**: User → Report (as reporter)
- **Reports Against**: User → Report (as targetUser)
- **Transactions Sent**: User → Transaction (as sender)
- **Transactions Received**: User → Transaction (as receiver)

### Challenge Relationships
- **Challenger**: Challenge → User
- **Opponent**: Challenge → User
- **Winner**: Challenge → User
- **Ratings**: Challenge → RatingComment
- **Reports**: Challenge → Report
- **Transactions**: Challenge → Transaction

### RatingComment Relationships
- **Rater**: RatingComment → User
- **Ratee**: RatingComment → User
- **Challenge**: RatingComment → Challenge

### Report Relationships
- **Reporter**: Report → User
- **Target User**: Report → User
- **Target Challenge**: Report → Challenge
- **Target Rating**: Report → RatingComment
- **Assigned Moderator**: Report → User

### Transaction Relationships
- **Sender**: Transaction → User
- **Receiver**: Transaction → User
- **Challenge**: Transaction → Challenge
- **Original Transaction**: Transaction → Transaction (for reversals)

---

## Data Validation

### User Validation
- Username: 3-30 characters, alphanumeric and underscores only
- Email: Valid email format
- Password: Minimum 8 characters, complexity requirements
- Full Name: 2-100 characters
- Bio: Maximum 500 characters

### Challenge Validation
- Title: 5-100 characters
- Description: 10-1000 characters
- Topic: 3-100 characters
- Scheduled start time must be in the future
- Max duration: 5 minutes to 2 hours

### Rating Validation
- Rating: 1-5 scale
- Comment: Maximum 500 characters
- Cannot rate yourself
- Can only rate once per challenge per user

### Report Validation
- Reason must be from predefined enum
- Description: Maximum 1000 characters
- Target must match targetType
- Cannot report same content multiple times within 24 hours

---

## Security Considerations

### Encryption
- **Bank Details**: AES-256 encryption with environment-based key
- **Passwords**: bcrypt hashing with salt rounds
- **Sensitive Data**: Never stored in plain text

### Access Control
- **Admin Constraints**: Cannot perform regular user interactions (US-SI-015)
- **Role-based Access**: Different permissions for user/competitor/admin roles
- **Mandatory Logging**: All admin actions require textual reasons (US-SI-017)

### Data Privacy
- **GDPR Compliance**: User data deletion capabilities
- **Data Minimization**: Only collect necessary data
- **Audit Trail**: All administrative actions logged

---

## Performance Optimizations

### Indexing Strategy
- Compound indexes for common query patterns
- Single field indexes for sorting and filtering
- Text indexes for search functionality
- TTL indexes for temporary data

### Query Optimization
- Projection to limit returned fields
- Population for referenced documents
- Aggregation pipelines for complex queries
- Caching for frequently accessed data

---

## Backup and Recovery

### Backup Strategy
- Regular automated backups
- Point-in-time recovery capability
- Cross-region replication for disaster recovery
- Encrypted backup storage

### Data Retention
- User data: As per GDPR requirements
- Challenge recordings: 30 days default
- Transaction history: 7 years for compliance
- Audit logs: 2 years

---

## Future Considerations

### Sharding
- User collection sharding by region
- Challenge collection sharding by date
- Transaction collection sharding by date range

### Data Migration
- Versioned schema updates
- Backward compatibility maintenance
- Zero-downtime migration procedures

### Monitoring
- Database performance metrics
- Query performance analysis
- Index usage statistics
- Storage optimization alerts

---

This schema implements all requirements from the Class Diagram while ensuring scalability, security, and performance for the open-source debate platform.