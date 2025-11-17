const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Define log format for console
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (stack) {
            msg += `\n${stack}`;
        }
        if (Object.keys(meta).length > 0) {
            msg += `\n${JSON.stringify(meta, null, 2)}`;
        }
        return msg;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { 
        service: 'duelik-backend',
        version: process.env.npm_package_version || '1.0.0'
    },
    transports: [
        // Write to all logs with level `info` and below to `combined.log`
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: logFormat
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 10,
            format: logFormat
        }),
        // Write to console if not in production
        ...(process.env.NODE_ENV !== 'production' ? [
            new winston.transports.Console({
                format: consoleFormat
            })
        ] : [])
    ],
    // Handle exceptions and rejections
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log')
        })
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log')
        })
    ]
});

// Create a stream object for Morgan HTTP logging
logger.stream = {
    write: (message, encoding) => {
        logger.info(message.trim());
    }
};

// Add custom methods for common use cases
logger.apiRequest = (req, res, responseTime) => {
    logger.info('API Request', {
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id,
        responseTime: `${responseTime}ms`,
        statusCode: res.statusCode
    });
};

logger.apiError = (error, req, res) => {
    logger.error('API Error', {
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.originalUrl,
        userId: req.user?.id,
        ip: req.ip,
        body: req.body,
        params: req.params,
        query: req.query,
        statusCode: res.statusCode
    });
};

logger.socketConnection = (socketId, userId, action) => {
    logger.info(`Socket ${action}`, {
        socketId,
        userId,
        timestamp: new Date().toISOString()
    });
};

logger.databaseOperation = (operation, collection, success = true, duration = null) => {
    if (success) {
        logger.info(`Database ${operation} completed`, {
            collection,
            duration: duration ? `${duration}ms` : undefined
        });
    } else {
        logger.error(`Database ${operation} failed`, {
            collection,
            duration: duration ? `${duration}ms` : undefined
        });
    }
};

logger.securityEvent = (event, userId, ip, details = {}) => {
    logger.warn(`Security Event: ${event}`, {
        event,
        userId,
        ip,
        timestamp: new Date().toISOString(),
        ...details
    });
};

module.exports = logger;