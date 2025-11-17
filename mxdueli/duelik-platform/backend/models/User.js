const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    // Basic Information
    username: {
        type: String,
        required: [true, 'اسم المستخدم مطلوب'],
        unique: true,
        trim: true,
        minlength: [3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'],
        maxlength: [30, 'اسم المستخدم يجب ألا يتجاوز 30 حرف']
    },
    email: {
        type: String,
        required: [true, 'البريد الإلكتروني مطلوب'],
        unique: true,
        lowercase: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            'صيغة البريد الإلكتروني غير صحيحة'
        ]
    },
    password: {
        type: String,
        required: [true, 'كلمة المرور مطلوبة'],
        minlength: [6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'],
        select: false // Don't include password in queries by default
    },
    
    // Profile Information
    fullName: {
        type: String,
        required: [true, 'الاسم الكامل مطلوب'],
        trim: true,
        maxlength: [100, 'الاسم الكامل يجب ألا يتجاوز 100 حرف']
    },
    avatar: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        maxlength: [500, 'النبذة الشخصية يجب ألا تتجاوز 500 حرف'],
        default: ''
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: 'other'
    },
    country: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    
    // Account Settings
    userType: {
        type: String,
        enum: ['competitor', 'viewer', 'admin', 'moderator'],
        default: 'viewer'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    banReason: {
        type: String,
        default: ''
    },
    banExpiresAt: {
        type: Date,
        default: null
    },
    
    // Competition Statistics
    statistics: {
        totalChallenges: {
            type: Number,
            default: 0
        },
        wins: {
            type: Number,
            default: 0
        },
        losses: {
            type: Number,
            default: 0
        },
        draws: {
            type: Number,
            default: 0
        },
        totalViewers: {
            type: Number,
            default: 0
        },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        totalEarnings: {
            type: Number,
            default: 0
        },
        lastActiveChallenge: {
            type: Date,
            default: null
        }
    },
    
    // Preferences
    preferences: {
        language: {
            type: String,
            default: 'ar'
        },
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'dark'
        },
        emailNotifications: {
            type: Boolean,
            default: true
        },
        pushNotifications: {
            type: Boolean,
            default: true
        },
        publicProfile: {
            type: Boolean,
            default: true
        },
        allowDirectMessages: {
            type: Boolean,
            default: true
        }
    },
    
    // Social Features
    followers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        followedAt: {
            type: Date,
            default: Date.now
        }
    }],
    following: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        followedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Financial Information
    financialInfo: {
        totalEarnings: {
            type: Number,
            default: 0
        },
        pendingPayout: {
            type: Number,
            default: 0
        },
        currency: {
            type: String,
            default: 'USD'
        },
        payoutMethod: {
            type: String,
            enum: ['bank_transfer', 'paypal', 'crypto', 'none'],
            default: 'none'
        },
        payoutDetails: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    
    // Security
    security: {
        lastLoginAt: {
            type: Date,
            default: null
        },
        lastLoginIp: {
            type: String,
            default: ''
        },
        loginAttempts: {
            type: Number,
            default: 0
        },
        lockUntil: {
            type: Date,
            default: null
        },
        passwordChangedAt: {
            type: Date,
            default: Date.now
        },
        refreshTokens: [{
            token: String,
            createdAt: {
                type: Date,
                default: Date.now
            },
            expiresAt: Date,
            ipAddress: String,
            userAgent: String
        }]
    },
    
    // Verification
    verification: {
        emailVerifiedAt: {
            type: Date,
            default: null
        },
        phoneVerifiedAt: {
            type: Date,
            default: null
        },
        identityVerifiedAt: {
            type: Date,
            default: null
        },
        verificationDocuments: [{
            type: String, // 'passport', 'driver_license', 'id_card'
            status: {
                type: String,
                enum: ['pending', 'approved', 'rejected'],
                default: 'pending'
            },
            uploadedAt: {
                type: Date,
                default: Date.now
            },
            reviewedAt: {
                type: Date,
                default: null
            },
            reviewNotes: String
        }]
    },
    
    // Activity Tracking
    lastActivityAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ 'statistics.totalChallenges': -1 });
userSchema.index({ 'statistics.averageRating': -1 });
userSchema.index({ 'security.lastLoginAt': -1 });
userSchema.index({ isActive: 1, isBanned: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for win rate
userSchema.virtual('winRate').get(function() {
    const total = this.statistics.wins + this.statistics.losses + this.statistics.draws;
    return total > 0 ? (this.statistics.wins / total) * 100 : 0;
});

// Virtual for user status
userSchema.virtual('status').get(function() {
    if (this.isBanned) return 'banned';
    if (!this.isActive) return 'inactive';
    return 'active';
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 12
        const hashedPassword = await bcrypt.hash(this.password, 12);
        this.password = hashedPassword;
        this.security.passwordChangedAt = new Date();
        next();
    } catch (error) {
        next(error);
    }
});

// Pre-save middleware to update timestamps
userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    if (!this.lastActivityAt) {
        this.lastActivityAt = new Date();
    }
    next();
});

// Instance method to check password
userSchema.methods.matchPassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT token
userSchema.methods.generateToken = function(tokenType = 'access') {
    const payload = {
        id: this._id,
        username: this.username,
        email: this.email,
        userType: this.userType,
        tokenType
    };
    
    const secret = tokenType === 'refresh' ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
    const expiresIn = tokenType === 'refresh' ? '7d' : '1d';
    
    return jwt.sign(payload, secret, { expiresIn });
};

// Instance method to check if account is locked
userSchema.methods.isLocked = function() {
    return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { 'security.lockUntil': 1 },
            $set: { 'security.loginAttempts': 1 }
        });
    }
    
    const updates = { $inc: { 'security.loginAttempts': 1 } };
    const maxAttempts = 5;
    const lockTime = 2 * 60 * 60 * 1000; // 2 hours
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.security.loginAttempts + 1 >= maxAttempts && !this.security.lockUntil) {
        updates.$set = { 'security.lockUntil': Date.now() + lockTime };
    }
    
    return this.updateOne(updates);
};

// Static method to find by credentials
userSchema.statics.findByCredentials = async function(email, password) {
    const user = await this.findOne({ email, isActive: true }).select('+password');
    
    if (!user) {
        throw new Error('بيانات الدخول غير صحيحة');
    }
    
    if (user.isBanned) {
        throw new Error('تم حظر هذا الحساب');
    }
    
    if (user.isLocked()) {
        throw new Error('تم قفل الحساب مؤقتاً بسبب محاولات دخول فاشلة متعددة');
    }
    
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
        await user.incLoginAttempts();
        throw new Error('بيانات الدخول غير صحيحة');
    }
    
    // Reset login attempts on successful login
    if (user.security.loginAttempts > 0) {
        await user.updateOne({
            $unset: { 'security.loginAttempts': 1, 'security.lockUntil': 1 }
        });
    }
    
    // Update last login info
    await user.updateOne({
        $set: {
            'security.lastLoginAt': new Date(),
            'security.lastLoginIp': user.lastLoginIp || 'unknown'
        }
    });
    
    return user;
};

// Static method to get user statistics
userSchema.statics.getUserStats = async function(userId) {
    const user = await this.findById(userId).populate('followers.user following.user', 'username fullName avatar');
    return user;
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    
    delete user.password;
    delete user.__v;
    delete user.security.refreshTokens;
    
    return user;
};

module.exports = mongoose.model('User', userSchema);