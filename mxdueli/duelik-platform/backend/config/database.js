const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/duelik';
    
    // Skip DB connection if no URI is provided or for development testing
    // For API testing purposes, skip connection unless explicitly required
    if (!mongoURI || mongoURI.includes('localhost') || process.env.SKIP_DB_CONNECTION === 'true') {
        logger.warn('⚠️ Database connection skipped (development mode or no URI provided)');
        return null;
    }
    
    try {
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            family: 4, // Use IPv4, skip trying IPv6
            retryWrites: true,
            w: 'majority'
        };

        const conn = await mongoose.connect(mongoURI, options);

        logger.info(`MongoDB Connected: ${conn.connection.host}:${conn.connection.port}`);

        // Connection event listeners
        mongoose.connection.on('connected', () => {
            logger.info('✅ Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            logger.error('❌ Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('⚠️ Mongoose disconnected from MongoDB');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            logger.info('Mongoose connection closed due to app termination');
            process.exit(0);
        });

        return conn;
    } catch (error) {
        logger.error('Database connection failed:', error.message);
        // Don't throw error - continue without DB for testing
        logger.warn('⚠️ Server will start without database connection');
        return null;
    }
};

module.exports = connectDB;