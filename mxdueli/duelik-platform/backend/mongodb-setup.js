#!/usr/bin/env node

/**
 * MongoDB Atlas Setup Script for Dueli Platform
 * This script helps setup MongoDB Atlas and seed initial data
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Challenge = require('./models/Challenge');
const Comment = require('./models/Comment');
const Rating = require('./models/Rating');
const logger = require('./config/logger');

class MongoDBSetup {
    constructor() {
        this.connectionString = process.env.MONGODB_URI;
        if (!this.connectionString || this.connectionString.includes('localhost')) {
            throw new Error('Please set MONGODB_URI to your MongoDB Atlas connection string in .env file');
        }
    }

    async connect() {
        try {
            const options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                family: 4,
                retryWrites: true,
                w: 'majority'
            };

            const conn = await mongoose.connect(this.connectionString, options);
            logger.info(`MongoDB Connected: ${conn.connection.host}:${conn.connection.port}`);
            return conn;
        } catch (error) {
            logger.error('Database connection failed:', error);
            throw error;
        }
    }

    async disconnect() {
        await mongoose.connection.close();
        logger.info('MongoDB disconnected');
    }

    async clearDatabase() {
        try {
            // Drop all collections
            const collections = mongoose.connection.db.listCollections();
            const collectionNames = await collections.toArray();
            
            for (const collection of collectionNames) {
                await mongoose.connection.db.dropCollection(collection.name);
                logger.info(`Dropped collection: ${collection.name}`);
            }
            
            logger.info('Database cleared successfully');
        } catch (error) {
            logger.error('Error clearing database:', error);
            throw error;
        }
    }

    async seedUsers() {
        logger.info('Seeding users...');
        
        const users = [
            {
                fullName: 'أحمد محمد',
                username: 'ahmed_mohamed',
                email: 'ahmed@example.com',
                password: 'Password123!',
                userType: 'competitor',
                isVerified: true,
                bio: 'مطور تطبيقات ويب متحمس للتحديات التقنية',
                country: 'مصر',
                city: 'القاهرة',
                preferences: {
                    language: 'ar',
                    theme: 'dark',
                    emailNotifications: true,
                    pushNotifications: true,
                    publicProfile: true,
                    allowDirectMessages: true
                }
            },
            {
                fullName: 'فاطمة أحمد',
                username: 'fatima_ahmed',
                email: 'fatima@example.com',
                password: 'Password123!',
                userType: 'competitor',
                isVerified: true,
                bio: 'مصممة جرافيك ومحبة للفنون الرقمية',
                country: 'الإمارات',
                city: 'دبي',
                preferences: {
                    language: 'ar',
                    theme: 'light',
                    emailNotifications: true,
                    pushNotifications: false,
                    publicProfile: true,
                    allowDirectMessages: true
                }
            },
            {
                fullName: 'سارة علي',
                username: 'sara_ali',
                email: 'sara@example.com',
                password: 'Password123!',
                userType: 'viewer',
                isVerified: true,
                bio: 'متفرجة متحمسة للمحتوى الإبداعي',
                country: 'السعودية',
                city: 'الرياض',
                preferences: {
                    language: 'ar',
                    theme: 'dark',
                    emailNotifications: true,
                    pushNotifications: true,
                    publicProfile: true,
                    allowDirectMessages: false
                }
            },
            {
                fullName: 'محمد حسن',
                username: 'mohamed_hassan',
                email: 'mohamed@example.com',
                password: 'Password123!',
                userType: 'competitor',
                isVerified: true,
                bio: 'مبرمج محترف متخصص في الذكاء الاصطناعي',
                country: 'الأردن',
                city: 'عمان',
                preferences: {
                    language: 'ar',
                    theme: 'dark',
                    emailNotifications: true,
                    pushNotifications: true,
                    publicProfile: true,
                    allowDirectMessages: true
                }
            },
            {
                fullName: 'admin',
                username: 'admin',
                email: 'admin@duelik.com',
                password: 'Admin123!',
                userType: 'admin',
                isVerified: true,
                bio: 'مدير النظام',
                preferences: {
                    language: 'ar',
                    theme: 'dark',
                    emailNotifications: true,
                    pushNotifications: true,
                    publicProfile: false,
                    allowDirectMessages: true
                }
            }
        ];

        const createdUsers = [];
        for (const userData of users) {
            try {
                const user = await User.create(userData);
                createdUsers.push(user);
                logger.info(`Created user: ${user.username}`);
            } catch (error) {
                logger.error(`Error creating user ${userData.username}:`, error);
            }
        }

        return createdUsers;
    }

    async seedChallenges(users) {
        logger.info('Seeding challenges...');
        
        const challenges = [
            {
                title: 'تطوير تطبيق إدارة المهام',
                description: 'إنشاء تطبيق ويب متقدم لإدارة المهام والمشاريع مع واجهة مستخدم تفاعلية',
                type: 'programming',
                category: 'Web Development',
                prize: 500,
                maxParticipants: 100,
                participants: [],
                status: 'open',
                requirements: {
                    technologies: ['React', 'Node.js', 'MongoDB'],
                    skills: ['Frontend Development', 'Backend Development', 'Database Design'],
                    experience: 'intermediate'
                },
                createdBy: users[0]._id,
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                rating: {
                    average: 4.5,
                    count: 12
                }
            },
            {
                title: 'تصميم شعار هوية بصرية متكاملة',
                description: 'تصميم شعار وهوية بصرية متكاملة لشركة ناشئة في مجال التكنولوجيا',
                type: 'design',
                category: 'Graphic Design',
                prize: 300,
                maxParticipants: 50,
                participants: [],
                status: 'open',
                requirements: {
                    skills: ['Logo Design', 'Brand Identity', 'Adobe Creative Suite'],
                    experience: 'intermediate'
                },
                createdBy: users[1]._id,
                deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
                rating: {
                    average: 4.8,
                    count: 8
                }
            },
            {
                title: 'كتابة محتوى تسويقي إبداعي',
                description: 'إنشاء محتوى تسويقي إبداعي لمتجر إلكتروني جديد متخصص في المنتجات التقنية',
                type: 'content',
                category: 'Content Writing',
                prize: 200,
                maxParticipants: 30,
                participants: [],
                status: 'open',
                requirements: {
                    skills: ['Content Writing', 'SEO', 'Marketing Copy'],
                    experience: 'beginner'
                },
                createdBy: users[2]._id,
                deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                rating: {
                    average: 4.2,
                    count: 15
                }
            }
        ];

        const createdChallenges = [];
        for (const challengeData of challenges) {
            try {
                const challenge = await Challenge.create(challengeData);
                createdChallenges.push(challenge);
                logger.info(`Created challenge: ${challenge.title}`);
                
                // Add challenge to creator's stats
                await User.findByIdAndUpdate(challengeData.createdBy, {
                    $inc: { 'statistics.totalChallenges': 1 }
                });
            } catch (error) {
                logger.error(`Error creating challenge ${challengeData.title}:`, error);
            }
        }

        return createdChallenges;
    }

    async seedComments(users, challenges) {
        logger.info('Seeding comments...');
        
        const comments = [
            {
                content: 'تحدي رائع! أتطلع للمشاركة فيه',
                type: 'general',
                createdBy: users[2]._id,
                targetType: 'challenge',
                targetId: challenges[0]._id,
                likes: 5
            },
            {
                content: 'الوصف واضح جداً والمتطلبات محددة',
                type: 'general',
                createdBy: users[1]._id,
                targetType: 'challenge',
                targetId: challenges[0]._id,
                likes: 3
            },
            {
                content: 'كم المتسابقين المسموحين؟',
                type: 'question',
                createdBy: users[3]._id,
                targetType: 'challenge',
                targetId: challenges[1]._id,
                likes: 1
            },
            {
                content: 'هل يمكن استخدام أدوات تصميم أخرى غير Adobe؟',
                type: 'question',
                createdBy: users[0]._id,
                targetType: 'challenge',
                targetId: challenges[1]._id,
                likes: 2
            }
        ];

        const createdComments = [];
        for (const commentData of comments) {
            try {
                const comment = await Comment.create(commentData);
                createdComments.push(comment);
                logger.info(`Created comment: ${comment.content.substring(0, 50)}...`);
            } catch (error) {
                logger.error(`Error creating comment:`, error);
            }
        }

        return createdComments;
    }

    async seedRatings(users, challenges) {
        logger.info('Seeding ratings...');
        
        // Rate challenges
        const ratings = [
            {
                rating: 5,
                createdBy: users[1]._id,
                targetType: 'challenge',
                targetId: challenges[0]._id
            },
            {
                rating: 4,
                createdBy: users[2]._id,
                targetType: 'challenge',
                targetId: challenges[0]._id
            },
            {
                rating: 5,
                createdBy: users[3]._id,
                targetType: 'challenge',
                targetId: challenges[1]._id
            },
            {
                rating: 4,
                createdBy: users[0]._id,
                targetType: 'challenge',
                targetId: challenges[1]._id
            },
            {
                rating: 5,
                createdBy: users[1]._id,
                targetType: 'challenge',
                targetId: challenges[2]._id
            },
            {
                rating: 3,
                createdBy: users[3]._id,
                targetType: 'challenge',
                targetId: challenges[2]._id
            }
        ];

        const createdRatings = [];
        for (const ratingData of ratings) {
            try {
                const rating = await Rating.create(ratingData);
                createdRatings.push(rating);
                logger.info(`Created rating: ${rating.rating} stars`);
            } catch (error) {
                logger.error(`Error creating rating:`, error);
            }
        }

        return createdRatings;
    }

    async updateChallengeRatings(challenges, ratings) {
        logger.info('Updating challenge ratings...');
        
        for (const challenge of challenges) {
            const challengeRatings = ratings.filter(r => 
                r.targetType === 'challenge' && r.targetId.toString() === challenge._id.toString()
            );
            
            if (challengeRatings.length > 0) {
                const averageRating = challengeRatings.reduce((sum, r) => sum + r.rating, 0) / challengeRatings.length;
                
                await Challenge.findByIdAndUpdate(challenge._id, {
                    'rating.average': averageRating,
                    'rating.count': challengeRatings.length
                });
                
                logger.info(`Updated ratings for challenge: ${challenge.title} - Average: ${averageRating.toFixed(1)}`);
            }
        }
    }

    async showDatabaseStats() {
        logger.info('=== DATABASE STATISTICS ===');
        
        const userCount = await User.countDocuments();
        const challengeCount = await Challenge.countDocuments();
        const commentCount = await Comment.countDocuments();
        const ratingCount = await Rating.countDocuments();
        
        logger.info(`Users: ${userCount}`);
        logger.info(`Challenges: ${challengeCount}`);
        logger.info(`Comments: ${commentCount}`);
        logger.info(`Ratings: ${ratingCount}`);
        
        // Show user types distribution
        const userTypes = await User.aggregate([
            { $group: { _id: '$userType', count: { $sum: 1 } } }
        ]);
        
        logger.info('User Types Distribution:');
        userTypes.forEach(type => {
            logger.info(`  ${type._id}: ${type.count}`);
        });
        
        // Show challenge types distribution
        const challengeTypes = await Challenge.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);
        
        logger.info('Challenge Types Distribution:');
        challengeTypes.forEach(type => {
            logger.info(`  ${type._id}: ${type.count}`);
        });
        
        logger.info('=== END STATISTICS ===');
    }

    async run() {
        try {
            logger.info('Starting MongoDB setup...');
            
            // Connect to database
            await this.connect();
            
            // Get action from command line
            const action = process.argv[2];
            
            switch (action) {
                case 'clear':
                    await this.clearDatabase();
                    break;
                    
                case 'seed':
                    // Clear and seed
                    await this.clearDatabase();
                    const users = await this.seedUsers();
                    const challenges = await this.seedChallenges(users);
                    const comments = await this.seedComments(users, challenges);
                    const ratings = await this.seedRatings(users, challenges);
                    await this.updateChallengeRatings(challenges, ratings);
                    await this.showDatabaseStats();
                    break;
                    
                case 'stats':
                    await this.showDatabaseStats();
                    break;
                    
                case 'connect-test':
                    logger.info('Connection test successful!');
                    break;
                    
                default:
                    logger.info('Usage: node mongodb-setup.js [clear|seed|stats|connect-test]');
                    logger.info('  clear: Clear all database data');
                    logger.info('  seed: Clear and seed with sample data');
                    logger.info('  stats: Show database statistics');
                    logger.info('  connect-test: Test database connection');
            }
            
        } catch (error) {
            logger.error('Setup failed:', error);
            throw error;
        } finally {
            await this.disconnect();
        }
    }
}

// Run setup if called directly
if (require.main === module) {
    const setup = new MongoDBSetup();
    setup.run().catch(error => {
        logger.error('Setup script failed:', error);
        process.exit(1);
    });
}

module.exports = MongoDBSetup;