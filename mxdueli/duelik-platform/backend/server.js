require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const slowDown = require('express-slow-down');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const winston = require('winston');

// Import configurations
const connectDB = require('./config/database');
const configureSocket = require('./config/socket');
const logger = require('./config/logger');

// Import routes (using mock auth for testing)
const authRoutes = process.env.USE_MOCK_AUTH === 'true' 
    ? require('./routes/auth-mock') 
    : require('./routes/auth');
const userRoutes = process.env.USE_MOCK_AUTH === 'true' 
    ? require('./routes/users-mock') 
    : require('./routes/users');
const challengeRoutes = process.env.USE_MOCK_AUTH === 'true' 
    ? require('./routes/challenges-mock') 
    : require('./routes/challenges');
const ratingRoutes = require('./routes/ratings');
const commentRoutes = require('./routes/comments');
const reportRoutes = require('./routes/reports');
const financeRoutes = require('./routes/finance');
const adminRoutes = require('./routes/admin');

// Import middlewares
const errorHandler = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');
const validateRequest = require('./middleware/validateRequest');

const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = configureSocket(server);

// Configure rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: {
        error: 'تم تجاوز الحد المسموح من الطلبات',
        retryAfter: '15 دقيقة'
    }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 login attempts per 15 minutes
    message: {
        error: 'تم تجاوز حد محاولات تسجيل الدخول',
        retryAfter: '15 دقيقة'
    }
});

// Configure speed limiter
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 100, // allow 100 requests per 15 minutes without delay
    delayMs: 500 // add 500ms delay per request after delayAfter
});

// =========================================
// SECURITY & PERFORMANCE MIDDLEWARES
// =========================================

app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"]
        }
    }
}));

app.use(compression());
app.use(mongoSanitize());
app.use(hpp());
app.use(speedLimiter);
app.use(limiter);

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
}));

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =========================================
// HEALTH CHECK
// =========================================

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// =========================================
// API ROUTES
// =========================================

// Auth routes (with special rate limiting)
app.use('/api/auth', authLimiter, authRoutes);

// Protected routes
app.use('/api/users', process.env.USE_MOCK_AUTH === 'true' ? userRoutes : authenticate, userRoutes);
app.use('/api/challenges', process.env.USE_MOCK_AUTH === 'true' ? challengeRoutes : authenticate, challengeRoutes);
app.use('/api/ratings', authenticate, ratingRoutes);
app.use('/api/comments', authenticate, commentRoutes);
app.use('/api/reports', authenticate, reportRoutes);
app.use('/api/finance', authenticate, financeRoutes);

// Admin routes (restricted access)
app.use('/api/admin', authenticate, adminRoutes);

// All routes are now configured

// Socket.IO authentication middleware
app.use('/socket.io', (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
        try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            logger.warn('Socket authentication failed:', error.message);
        }
    }
    next();
});

// =========================================
// ERROR HANDLING
// =========================================

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'الصفحة أو المورد المطلوب غير موجود',
        path: req.originalUrl
    });
});

// Global error handler temporarily disabled
// app.use(errorHandler);

// =========================================
// SERVER STARTUP
// =========================================

const PORT = process.env.PORT || 3001;

const startServer = async () => {
    try {
        // Connect to database
        await connectDB();
        logger.info('✅ Database connected successfully');

        // Start server
        server.listen(PORT, () => {
            logger.info(`🚀 Dueli Backend Server running on port ${PORT}`);
            logger.info(`📡 WebSocket server ready`);
            logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            logger.info('SIGTERM received. Shutting down gracefully...');
            server.close(() => {
                logger.info('Process terminated');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            logger.info('SIGINT received. Shutting down gracefully...');
            server.close(() => {
                logger.info('Process terminated');
                process.exit(0);
            });
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Promise Rejection:', err.message);
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err.message);
    process.exit(1);
});

// Start the server
startServer();

// Export for testing
module.exports = { app, server, io };