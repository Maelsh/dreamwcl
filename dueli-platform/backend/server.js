const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

/**
 * Dueli Platform Backend Server
 * Implements core backend functionality with WebSocket support
 * Supports real-time transparency updates per NFR-P-001
 */

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const challengeRoutes = require('./routes/challenges');
const ratingRoutes = require('./routes/ratings');
const reportRoutes = require('./routes/reports');
const transactionRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin');
const streamRoutes = require('./routes/streaming');

// Import middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const transparencyEngine = require('./services/transparencyEngine');

// Import models
const { setupModelAssociations } = require('./models');

// Setup model relationships
setupModelAssociations();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Will be configured per route
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all requests
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dueli', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/challenges', authMiddleware, challengeRoutes);
app.use('/api/ratings', authMiddleware, ratingRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/transactions', authMiddleware, transactionRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/streaming', authMiddleware, streamRoutes);

// WebSocket connection handling for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join user-specific room for private updates
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });
  
  // Join challenge room for live updates
  socket.on('join-challenge-room', (challengeId) => {
    socket.join(`challenge-${challengeId}`);
    console.log(`Socket ${socket.id} joined challenge ${challengeId}`);
  });
  
  // Leave challenge room
  socket.on('leave-challenge-room', (challengeId) => {
    socket.leave(`challenge-${challengeId}`);
    console.log(`Socket ${socket.id} left challenge ${challengeId}`);
  });
  
  // Handle viewer count updates
  socket.on('update-viewer-count', (data) => {
    socket.to(`challenge-${data.challengeId}`).emit('viewer-count-updated', {
      challengeId: data.challengeId,
      viewerCount: data.count
    });
  });
  
  // Handle rating updates
  socket.on('rating-update', (data) => {
    socket.to(`challenge-${data.challengeId}`).emit('rating-updated', {
      userId: data.userId,
      newRating: data.rating,
      challengeId: data.challengeId
    });
  });
  
  // Handle report count updates
  socket.on('report-count-update', (data) => {
    socket.broadcast.emit('report-count-updated', {
      userId: data.userId,
      reportCount: data.count
    });
  });
  
  // Handle stream control (US-CC-004)
  socket.on('toggle-stream', (data) => {
    socket.to(`challenge-${data.challengeId}`).emit('stream-toggled', {
      userId: data.userId,
      streamType: data.streamType,
      challengeId: data.challengeId
    });
  });
  
  // Handle advertisement dismissal (US-CC-006)
  socket.on('dismiss-ad', (data) => {
    socket.to(`challenge-${data.challengeId}`).emit('ad-dismissed', {
      adId: data.adId,
      dismissedBy: data.userId,
      challengeId: data.challengeId
    });
  });
  
  // Handle real-time transparency updates
  socket.on('transparency-update', async (data) => {
    const transparencyData = await transparencyEngine.getRealTimeMetrics();
    socket.emit('transparency-data', transparencyData);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Initialize transparency engine with WebSocket
transparencyEngine.initialize(io);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`WebSocket server ready for real-time updates`);
});