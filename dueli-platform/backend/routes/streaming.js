const express = require('express');
const { body, param, validationResult } = require('express-validator');

/**
 * Streaming routes for Dueli Platform
 * Handles WebRTC streaming setup and Kurento Media Server integration planning
 */

const router = express.Router();

/**
 * @route   POST /api/streaming/create-room
 * @desc    Create streaming room for challenge
 * @access  Private
 */
router.post('/create-room', [
  body('challengeId')
    .isMongoId()
    .withMessage('Invalid challenge ID'),
  body('roomId')
    .isLength({ min: 1, max: 100 })
    .withMessage('Room ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { challengeId, roomId } = req.body;

    // In production, this would integrate with Kurento Media Server
    // For MVP, we return a mock WebRTC configuration
    const webrtcConfig = {
      roomId,
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      // Kurento Media Server integration point
      // kmsUrl: process.env.KMS_URL || 'ws://localhost:8888/kurento'
    };

    res.json({
      message: 'Streaming room created successfully',
      webrtcConfig,
      note: 'Kurento Media Server integration planned for future scaling'
    });
  } catch (error) {
    console.error('Create streaming room error:', error);
    res.status(500).json({
      error: 'Failed to create streaming room'
    });
  }
});

/**
 * @route   POST /api/streaming/join-room
 * @desc    Join streaming room as viewer or participant
 * @access  Private
 */
router.post('/join-room', [
  body('roomId')
    .isLength({ min: 1, max: 100 })
    .withMessage('Room ID is required'),
  body('role')
    .isIn(['participant', 'viewer'])
    .withMessage('Role must be participant or viewer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { roomId, role } = req.body;

    // Generate participant token for WebRTC
    const participantToken = `${req.user.id}_${Date.now()}`;

    res.json({
      message: 'Joined streaming room successfully',
      participantToken,
      role,
      roomId,
      user: {
        id: req.user.id,
        username: req.user.username,
        fullName: req.user.fullName
      }
    });
  } catch (error) {
    console.error('Join streaming room error:', error);
    res.status(500).json({
      error: 'Failed to join streaming room'
    });
  }
});

/**
 * @route   POST /api/streaming/ice-candidate
 * @desc    Exchange ICE candidates for WebRTC
 * @access  Private
 */
router.post('/ice-candidate', [
  body('roomId')
    .isLength({ min: 1, max: 100 })
    .withMessage('Room ID is required'),
  body('candidate')
    .isObject()
    .withMessage('ICE candidate must be an object'),
  body('targetUserId')
    .optional()
    .isString()
    .withMessage('Target user ID must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { roomId, candidate, targetUserId } = req.body;

    // In production, this would forward ICE candidates through the media server
    // For MVP, we acknowledge the candidate exchange

    res.json({
      message: 'ICE candidate processed',
      roomId,
      fromUser: req.user.id
    });
  } catch (error) {
    console.error('ICE candidate error:', error);
    res.status(500).json({
      error: 'Failed to process ICE candidate'
    });
  }
});

/**
 * @route   POST /api/streaming/offer
 * @desc    Exchange WebRTC offer
 * @access  Private
 */
router.post('/offer', [
  body('roomId')
    .isLength({ min: 1, max: 100 })
    .withMessage('Room ID is required'),
  body('offer')
    .isObject()
    .withMessage('Offer must be an object'),
  body('targetUserId')
    .isString()
    .withMessage('Target user ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { roomId, offer, targetUserId } = req.body;

    // In production, this would forward offers through the media server
    // For MVP, we acknowledge the offer exchange

    res.json({
      message: 'WebRTC offer processed',
      roomId,
      fromUser: req.user.id,
      toUser: targetUserId
    });
  } catch (error) {
    console.error('WebRTC offer error:', error);
    res.status(500).json({
      error: 'Failed to process WebRTC offer'
    });
  }
});

/**
 * @route   POST /api/streaming/answer
 * @desc    Exchange WebRTC answer
 * @access  Private
 */
router.post('/answer', [
  body('roomId')
    .isLength({ min: 1, max: 100 })
    .withMessage('Room ID is required'),
  body('answer')
    .isObject()
    .withMessage('Answer must be an object'),
  body('targetUserId')
    .isString()
    .withMessage('Target user ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { roomId, answer, targetUserId } = req.body;

    // In production, this would forward answers through the media server
    // For MVP, we acknowledge the answer exchange

    res.json({
      message: 'WebRTC answer processed',
      roomId,
      fromUser: req.user.id,
      toUser: targetUserId
    });
  } catch (error) {
    console.error('WebRTC answer error:', error);
    res.status(500).json({
      error: 'Failed to process WebRTC answer'
    });
  }
});

/**
 * @route   POST /api/streaming/leave-room
 * @desc    Leave streaming room
 * @access  Private
 */
router.post('/leave-room', [
  body('roomId')
    .isLength({ min: 1, max: 100 })
    .withMessage('Room ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { roomId } = req.body;

    res.json({
      message: 'Left streaming room successfully',
      roomId,
      userId: req.user.id
    });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({
      error: 'Failed to leave streaming room'
    });
  }
});

module.exports = router;