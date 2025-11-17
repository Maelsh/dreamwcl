const logger = require('../config/logger');

// Custom error class for API errors
class ApiError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = isOperational;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Handle specific error types
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new ApiError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new ApiError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new ApiError(message, 400);
};

const handleJWTError = () =>
    new ApiError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
    new ApiError('Your token has expired! Please log in again.', 401);

const handleMulterError = (err) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return new ApiError('File too large. Maximum size allowed is 5MB.', 400);
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
        return new ApiError('Too many files. Maximum 5 files allowed.', 400);
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return new ApiError('Unexpected field in file upload.', 400);
    }
    return new ApiError('File upload error.', 400);
};

// Send error response in development
const sendErrorDev = (err, req, res) => {
    // Log the error
    logger.apiError(err, req, res);
    
    res.status(err.statusCode).json({
        success: false,
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
        request: {
            method: req.method,
            url: req.originalUrl,
            headers: req.headers,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        }
    });
};

// Send error response in production
const sendErrorProd = (err, req, res) => {
    // Log the error
    logger.apiError(err, req, res);
    
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message
        });
    } 
    // Programming or other unknown error: don't leak error details
    else {
        // Log error
        logger.error('ERROR:', err);

        // Send generic message
        res.status(500).json({
            success: false,
            status: 'error',
            message: 'Something went wrong!'
        });
    }
};

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error(`Error ${err.statusCode || 500}: ${err.message}`, {
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
    });

    // MongoDB ObjectId error
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = handleCastErrorDB(err);
    }

    // MongoDB duplicate key error
    if (err.code === 11000) {
        error = handleDuplicateFieldsDB(err);
    }

    // MongoDB validation error
    if (err.name === 'ValidationError') {
        error = handleValidationErrorDB(err);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = handleJWTError();
    }

    if (err.name === 'TokenExpiredError') {
        error = handleJWTExpiredError();
    }

    // Multer errors
    if (err.name === 'MulterError') {
        error = handleMulterError(err);
    }

    // Rate limiting errors
    if (err.statusCode === 429) {
        error = new ApiError('Too many requests, please try again later.', 429);
    }

    // Validation errors
    if (err.name === 'ValidationError' && err.errors) {
        const messages = Object.values(err.errors).map(val => val.message);
        error = new ApiError(`Invalid input data. ${messages.join('. ')}`, 400);
    }

    // Set default error properties
    if (!error.statusCode) {
        error.statusCode = 500;
    }
    
    if (!error.status) {
        error.status = 'error';
    }

    // Determine environment
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Send error response
    if (isDevelopment) {
        sendErrorDev(error, req, res);
    } else {
        sendErrorProd(error, req, res);
    }
};

// Async error wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// 404 handler for undefined routes
const notFound = (req, res, next) => {
    const error = new ApiError(`Not found - ${req.originalUrl}`, 404);
    next(error);
};

// Unhandled rejection handler
process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

// Validation error formatter
const formatValidationErrors = (errors) => {
    const formatted = {};
    
    errors.forEach(error => {
        if (error.param && !formatted[error.param]) {
            formatted[error.param] = error.msg;
        }
    });
    
    return formatted;
};

// Rate limit error handler
const rateLimitHandler = (req, res) => {
    const error = new ApiError('Too many requests from this IP, please try again later.', 429);
    res.status(429).json({
        success: false,
        status: 'error',
        message: error.message,
        retryAfter: req.rateLimit?.resetTime ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000) : 900
    });
};

// CORS error handler
const corsErrorHandler = (err, req, res, next) => {
    if (err.message && err.message.includes('CORS')) {
        const error = new ApiError('Cross-Origin Request Blocked', 403);
        return res.status(403).json({
            success: false,
            status: 'error',
            message: error.message
        });
    }
    next(err);
};

module.exports = {
    ApiError,
    errorHandler,
    asyncHandler,
    notFound,
    rateLimitHandler,
    corsErrorHandler,
    formatValidationErrors
};