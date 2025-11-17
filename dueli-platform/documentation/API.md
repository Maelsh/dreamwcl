# Dueli Platform API Documentation

## Overview

The Dueli Platform API is a RESTful API built with Node.js and Express, providing real-time functionality through WebSocket connections. This API supports the open-source debate platform with features including live streaming, real-time transparency, and fair revenue distribution.

## Base URL

```
http://localhost:5000/api
```

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All responses are in JSON format with the following structure:

### Success Response
```json
{
  "message": "Success message",
  "data": { ... },
  "timestamp": "2023-08-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": [ ... ],
  "timestamp": "2023-08-15T10:30:00.000Z"
}
```

## Rate Limiting

- General endpoints: 100 requests per 15 minutes
- Authentication endpoints: 5 requests per 15 minutes

---

## Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "fullName": "string",
  "role": "user|competitor"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": { ... },
  "token": "string",
  "refreshToken": "string"
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "login": "string", // username or email
  "password": "string"
}
```

### Verify Token
```http
GET /auth/verify
```

**Headers:**
```
Authorization: Bearer <token>
```

---

## User Endpoints

### Get User Profile
```http
GET /users/:id
```

**Response:**
```json
{
  "user": { ... },
  "recentChallenges": [ ... ],
  "ratingStats": { ... },
  "financialSummary": { ... },
  "transparencyScore": 85
}
```

### Update Profile
```http
PUT /users/profile
```

**Request Body:**
```json
{
  "fullName": "string",
  "bio": "string",
  "streamPreferences": {
    "cameraEnabled": true,
    "microphoneEnabled": true,
    "screenShareEnabled": true
  }
}
```

### Add Bank Details
```http
POST /users/bank-details
```

**Request Body:**
```json
{
  "accountNumber": "string",
  "routingNumber": "string",
  "bankName": "string",
  "accountType": "checking|savings|business"
}
```

**Note:** Bank details are encrypted using AES-256 encryption.

### Get User Transactions
```http
GET /users/transactions
```

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `type` (string): Transaction type filter

---

## Challenge Endpoints

### Get All Challenges
```http
GET /challenges
```

**Query Parameters:**
- `status` (string): scheduled|live|completed|cancelled
- `page` (number): Page number
- `limit` (number): Items per page (max 100)
- `sort` (string): createdAt|scheduledStartTime|viewerCount|revenue

### Get Challenge Details
```http
GET /challenges/:id
```

### Create Challenge
```http
POST /challenges
```

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "topic": "string",
  "opponent": "userId",
  "scheduledStartTime": "2023-08-15T10:30:00.000Z",
  "settings": {
    "maxDuration": 3600,
    "allowScreenShare": true,
    "recordChallenge": true,
    "enableAds": true,
    "admissionFee": 0
  }
}
```

### Start Challenge
```http
PUT /challenges/:id/start
```

**Access:** Challenger or opponent only

### End Challenge
```http
PUT /challenges/:id/end
```

**Request Body:**
```json
{
  "winner": "userId" // optional
}
```

### Toggle Stream Type
```http
PUT /challenges/:id/stream/toggle
```

**Request Body:**
```json
{
  "streamType": "camera|screen"
}
```

### Dismiss Advertisement
```http
PUT /challenges/:id/ads/:adId/dismiss
```

### Rate Challenge
```http
POST /challenges/:id/rate
```

**Request Body:**
```json
{
  "targetUser": "userId",
  "rating": 5,
  "comment": "string"
}
```

---

## Rating Endpoints

### Get Ratings
```http
GET /ratings
```

**Query Parameters:**
- `userId` (string): Filter by rated user
- `challengeId` (string): Filter by challenge
- `page` (number): Page number
- `limit` (number): Items per page

### Create Rating
```http
POST /ratings
```

**Request Body:**
```json
{
  "ratee": "userId",
  "challenge": "challengeId",
  "rating": 5,
  "comment": "string",
  "categories": {
    "communication": 5,
    "argumentQuality": 4,
    "respectfulness": 5,
    "presentation": 4
  }
}
```

### Flag Rating
```http
PUT /ratings/:id/flag
```

**Request Body:**
```json
{
  "reason": "spam|harassment|inappropriate|false_information|other"
}
```

---

## Report Endpoints

### Get Reports (Admin Only)
```http
GET /reports
```

**Query Parameters:**
- `status` (string): pending|under_review|resolved|dismissed
- `priority` (string): low|medium|high|urgent

### Create Report
```http
POST /reports
```

**Request Body:**
```json
{
  "targetType": "user|challenge|rating_comment|advertisement",
  "reason": "spam|harassment|hate_speech|inappropriate_content|false_information|copyright_violation|terms_violation|other",
  "description": "string",
  "targetUser": "userId", // if targetType is 'user'
  "targetChallenge": "challengeId", // if targetType is 'challenge'
  "targetRating": "ratingId", // if targetType is 'rating_comment'
  "targetAdvertisement": "string" // if targetType is 'advertisement'
}
```

### Assign Report to Moderator (Admin Only)
```http
PUT /reports/:id/assign
```

**Request Body:**
```json
{
  "moderatorId": "userId"
}
```

### Resolve Report (Admin Only)
```http
PUT /reports/:id/resolve
```

**Request Body:**
```json
{
  "decision": "valid|invalid|partially_valid",
  "resolutionNotes": "string",
  "actionsTaken": [
    {
      "action": "warning_issued|content_hidden|account_suspended|account_banned|challenge_cancelled|ad_removed|no_action",
      "description": "string"
    }
  ]
}
```

**Note:** Admin must provide mandatory reason for all punitive actions per US-SI-017.

---

## Transaction Endpoints

### Get Transactions (Admin Only)
```http
GET /transactions
```

**Query Parameters:**
- `status` (string): pending|processing|completed|failed|cancelled
- `type` (string): Transaction type

### Get Platform Revenue Statistics
```http
GET /transactions/stats
```

### Process Revenue (Admin Only)
```http
POST /transactions/process-revenue
```

**Request Body:**
```json
{
  "challengeId": "challengeId",
  "totalRevenue": 1000,
  "challengerId": "userId",
  "opponentId": "userId"
}
```

**Note:** Implements 80/20 revenue split - 80% to competitors, 20% to platform.

### Request Withdrawal
```http
POST /transactions/withdrawal
```

**Request Body:**
```json
{
  "amount": 100,
  "currency": "USD|EUR|GBP|CAD|AUD",
  "paymentMethod": "bank_transfer|paypal"
}
```

### Get Invoice
```http
GET /transactions/invoices/:invoiceNumber
```

---

## Admin Endpoints

### Get Admin Dashboard
```http
GET /admin/dashboard
```

### Get Users (Admin Only)
```http
GET /admin/users
```

### Suspend User (Admin Only)
```http
PUT /admin/users/:id/suspend
```

**Request Body:**
```json
{
  "reason": "string (10-1000 characters)"
}
```

### Cancel Challenge (Admin Only)
```http
PUT /admin/challenges/:id/cancel
```

**Request Body:**
```json
{
  "reason": "string (10-1000 characters)"
}
```

### Get System Health
```http
GET /admin/system-health
```

---

## Streaming Endpoints

### Create Streaming Room
```http
POST /streaming/create-room
```

**Request Body:**
```json
{
  "challengeId": "challengeId",
  "roomId": "string"
}
```

### Join Streaming Room
```http
POST /streaming/join-room
```

**Request Body:**
```json
{
  "roomId": "string",
  "role": "participant|viewer"
}
```

### Exchange ICE Candidates
```http
POST /streaming/ice-candidate
```

**Request Body:**
```json
{
  "roomId": "string",
  "candidate": { ... },
  "targetUserId": "string"
}
```

### Exchange WebRTC Offer
```http
POST /streaming/offer
```

**Request Body:**
```json
{
  "roomId": "string",
  "offer": { ... },
  "targetUserId": "string"
}
```

### Exchange WebRTC Answer
```http
POST /streaming/answer
```

**Request Body:**
```json
{
  "roomId": "string",
  "answer": { ... },
  "targetUserId": "string"
}
```

---

## WebSocket Events

### Client to Server Events

- `join-user-room` - Join user's personal room for updates
- `join-challenge-room` - Join challenge room for live updates
- `leave-challenge-room` - Leave challenge room
- `update-viewer-count` - Update viewer count
- `rating-update` - Submit rating update
- `report-count-update` - Update report count
- `toggle-stream` - Toggle stream type (camera/screen)
- `dismiss-ad` - Dismiss advertisement
- `transparency-update` - Request transparency data

### Server to Client Events

- `real-time-metrics` - Real-time platform metrics
- `challenge-metrics-updated` - Challenge-specific metrics update
- `user-metrics-updated` - User-specific metrics update
- `challenge-started` - Challenge started notification
- `challenge-ended` - Challenge ended notification
- `rating-updated` - Rating update notification
- `viewer-count-updated` - Viewer count update
- `stream-toggled` - Stream type changed notification
- `ad-dismissed` - Advertisement dismissed notification

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

---

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **AES-256 Encryption**: Sensitive data encryption (bank details, passwords)
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive validation using express-validator
- **CORS Protection**: Cross-origin resource sharing configuration
- **Helmet Security**: HTTP security headers
- **Admin Constraints**: Admins cannot perform regular user interactions (US-SI-015)

---

## Scalability Considerations

- **Horizontal Scaling**: Designed to support 5000 concurrent users (NFR-P-002)
- **Kurento Integration**: Planned WebRTC media server integration
- **Caching**: Redis caching for frequently accessed data
- **Database Indexing**: Optimized queries with proper indexes
- **Load Balancing**: Ready for multi-instance deployment

---

## Development Notes

- All code includes extensive inline documentation (90% target per NFR-O-005)
- Modular architecture for easy maintenance and extension
- Comprehensive error handling and logging
- Real-time updates with sub-second latency (NFR-P-001)
- Financial transparency with mandatory reason logging for admin actions

For more detailed information about specific endpoints or implementation details, refer to the inline code documentation and comments.