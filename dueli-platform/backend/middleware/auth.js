const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware for Dueli Platform
 * Implements JWT-based authentication with role-based access control
 * Supports admin constraints per US-SI-015
 */

/**
 * Main authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token. User not found.' 
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Account is suspended or deactivated.' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired.' 
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Internal server error during authentication.' 
    });
  }
};

/**
 * Admin-only middleware
 * Ensures user has admin role and prevents admin interaction functions (US-SI-015)
 */
const adminOnly = async (req, res, next) => {
  try {
    await authenticate(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Admin access required.' 
        });
      }
      
      // Admin constraint: Cannot access regular user functions (US-SI-015)
      const restrictedPaths = [
        '/api/ratings',
        '/api/challenges/join',
        '/api/challenges/rate',
        '/api/reports/user-report'
      ];
      
      if (restrictedPaths.some(path => req.path.includes(path))) {
        return res.status(403).json({ 
          error: 'Admin accounts cannot perform regular user interactions.' 
        });
      }
      
      next();
    });
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ 
      error: 'Internal server error during admin verification.' 
    });
  }
};

/**
 * Competitor-only middleware
 * Ensures user has competitor role
 */
const competitorOnly = async (req, res, next) => {
  try {
    await authenticate(req, res, () => {
      if (req.user.role !== 'competitor' && req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Competitor access required.' 
        });
      }
      next();
    });
  } catch (error) {
    console.error('Competitor middleware error:', error);
    res.status(500).json({ 
      error: 'Internal server error during competitor verification.' 
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.id).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Don't fail the request, just continue without user
    next();
  }
};

/**
 * Generate JWT token
 * @param {object} user - User object
 * @returns {string} - JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      username: user.username, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'fallback-secret',
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
    }
  );
};

/**
 * Generate refresh token
 * @param {object} user - User object
 * @returns {string} - Refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      type: 'refresh' 
    },
    process.env.JWT_REFRESH_SECRET || 'refresh-fallback-secret',
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' 
    }
  );
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {object} - Decoded token payload
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(
    token, 
    process.env.JWT_REFRESH_SECRET || 'refresh-fallback-secret'
  );
};

/**
 * Socket.IO authentication middleware
 * For authenticating WebSocket connections
 */
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return next(new Error('Authentication error: Invalid or inactive user'));
    }
    
    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = {
  authenticate,
  adminOnly,
  competitorOnly,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  socketAuth
};