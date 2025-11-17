const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    // Configuration Key
    key: {
        type: String,
        required: [true, 'مفتاح الإعداد مطلوب'],
        unique: true,
        trim: true
    },
    
    // Setting Value
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'قيمة الإعداد مطلوبة']
    },
    
    // Setting Type
    type: {
        type: String,
        required: [true, 'نوع الإعداد مطلوب'],
        enum: [
            'string',
            'number', 
            'boolean',
            'array',
            'object',
            'json',
            'date',
            'enum'
        ]
    },
    
    // Setting Category
    category: {
        type: String,
        required: [true, 'فئة الإعداد مطلوبة'],
        enum: [
            'general',           // إعدادات عامة
            'user',              // إعدادات المستخدمين
            'challenge',         // إعدادات المنافسات
            'moderation',        // إعدادات الإشراف
            'payment',           // إعدادات الدفع
            'notification',      // إعدادات الإشعارات
            'security',          // إعدادات الأمان
            'performance',       // إعدادات الأداء
            'maintenance',       // إعدادات الصيانة
            'feature_flags'      // إشارات الميزات
        ]
    },
    
    // Metadata
    description: {
        type: String,
        required: [true, 'وصف الإعداد مطلوب'],
        maxlength: [500, 'الوصف يجب ألا يتجاوز 500 حرف']
    },
    
    validation: {
        min: Number,
        max: Number,
        pattern: String,
        allowedValues: [mongoose.Schema.Types.Mixed],
        customValidator: String
    },
    
    // Settings Management
    isSystem: {
        type: Boolean,
        default: false
    },
    isEditable: {
        type: Boolean,
        default: true
    },
    requiresRestart: {
        type: Boolean,
        default: false
    },
    
    // Access Control
    requiredRole: {
        type: String,
        enum: ['admin', 'moderator', 'super_admin'],
        default: 'admin'
    },
    
    // Change Tracking
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    changeReason: {
        type: String,
        default: ''
    },
    
    // Environment
    environment: {
        type: String,
        enum: ['development', 'staging', 'production'],
        default: 'production'
    },
    
    // Audit Trail
    history: [{
        value: mongoose.Schema.Types.Mixed,
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        changedAt: {
            type: Date,
            default: Date.now
        },
        reason: String,
        previousValue: mongoose.Schema.Types.Mixed
    }],
    
    // Timestamps
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

// Indexes
systemSettingsSchema.index({ key: 1 }, { unique: true });
systemSettingsSchema.index({ category: 1, key: 1 });
systemSettingsSchema.index({ isSystem: 1, isEditable: 1 });
systemSettingsSchema.index({ environment: 1 });

// Virtual for formatted value
systemSettingsSchema.virtual('displayValue').get(function() {
    switch (this.type) {
        case 'boolean':
            return this.value ? 'مفعل' : 'معطل';
        case 'array':
            return Array.isArray(this.value) ? this.value.join(', ') : this.value;
        case 'object':
        case 'json':
            return JSON.stringify(this.value, null, 2);
        default:
            return String(this.value);
    }
});

// Virtual for validation status
systemSettingsSchema.virtual('isValid').get(function() {
    try {
        switch (this.type) {
            case 'string':
                if (this.validation?.min && this.value.length < this.validation.min) return false;
                if (this.validation?.max && this.value.length > this.validation.max) return false;
                if (this.validation?.pattern && !new RegExp(this.validation.pattern).test(this.value)) return false;
                return true;
                
            case 'number':
                if (this.validation?.min && this.value < this.validation.min) return false;
                if (this.validation?.max && this.value > this.validation.max) return false;
                return typeof this.value === 'number' && !isNaN(this.value);
                
            case 'boolean':
                return typeof this.value === 'boolean';
                
            case 'array':
                if (!Array.isArray(this.value)) return false;
                if (this.validation?.min && this.value.length < this.validation.min) return false;
                if (this.validation?.max && this.value.length > this.validation.max) return false;
                return true;
                
            case 'object':
            case 'json':
                return typeof this.value === 'object' && this.value !== null;
                
            case 'enum':
                return this.validation?.allowedValues?.includes(this.value) || false;
                
            default:
                return true;
        }
    } catch (error) {
        return false;
    }
});

// Pre-save middleware
systemSettingsSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // Add to history if value changed
    if (this.isModified('value')) {
        this.history.push({
            value: this.value,
            changedBy: this.lastModifiedBy,
            changedAt: new Date(),
            reason: this.changeReason,
            previousValue: this.getOriginal('value')
        });
        
        // Keep only last 50 history entries
        if (this.history.length > 50) {
            this.history = this.history.slice(-50);
        }
    }
    
    next();
});

// Instance method to update setting
systemSettingsSchema.methods.updateValue = async function(newValue, userId, reason = '') {
    const oldValue = this.value;
    
    this.value = newValue;
    this.lastModifiedBy = userId;
    this.changeReason = reason;
    
    // Validate the new value
    if (!this.isValid) {
        throw new Error('القيمة الجديدة غير صحيحة');
    }
    
    await this.save();
    
    return {
        oldValue,
        newValue: this.value,
        updated: true
    };
};

// Instance method to reset to default
systemSettingsSchema.methods.resetToDefault = async function(userId, reason = '') {
    // In a real implementation, you would have default values stored
    const defaultValues = this.getDefaultValues();
    
    return this.updateValue(defaultValues[this.key], userId, reason || 'Reset to default');
};

// Static method to get all settings by category
systemSettingsSchema.statics.getSettingsByCategory = function(category) {
    return this.find({ category }).sort({ key: 1 });
};

// Static method to get editable settings for user role
systemSettingsSchema.statics.getEditableSettings = function(userRole) {
    const roleHierarchy = {
        'user': 1,
        'moderator': 2,
        'admin': 3,
        'super_admin': 4
    };
    
    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevels = {
        'admin': 3,
        'moderator': 2,
        'super_admin': 4
    };
    
    return this.find({
        isEditable: true,
        $or: [
            { requiredRole: 'admin', $expr: { $gte: [userLevel, 3] } },
            { requiredRole: 'moderator', $expr: { $gte: [userLevel, 2] } },
            { requiredRole: 'super_admin', $expr: { $gte: [userLevel, 4] } },
            { requiredRole: { $exists: false } }
        ]
    });
};

// Static method to get system configuration
systemSettingsSchema.statics.getSystemConfig = function() {
    return this.find({
        isSystem: true,
        environment: process.env.NODE_ENV || 'production'
    }).then(settings => {
        const config = {};
        settings.forEach(setting => {
            config[setting.key] = setting.value;
        });
        return config;
    });
};

// Static method to validate configuration
systemSettingsSchema.statics.validateConfiguration = async function() {
    const settings = await this.find({});
    const validationResults = [];
    
    settings.forEach(setting => {
        const isValid = setting.isValid;
        validationResults.push({
            key: setting.key,
            category: setting.category,
            isValid,
            value: setting.value,
            type: setting.type,
            error: isValid ? null : 'Validation failed'
        });
    });
    
    return {
        totalSettings: settings.length,
        validSettings: validationResults.filter(r => r.isValid).length,
        invalidSettings: validationResults.filter(r => !r.isValid).length,
        results: validationResults
    };
};

// Static method to get feature flags
systemSettingsSchema.statics.getFeatureFlags = function() {
    return this.find({ category: 'feature_flags' }).then(settings => {
        const flags = {};
        settings.forEach(setting => {
            flags[setting.key] = setting.value;
        });
        return flags;
    });
};

// Default values for system settings
systemSettingsSchema.statics.getDefaultValues = function() {
    return {
        // General Settings
        'platform.name': 'Dueli',
        'platform.version': '1.0.0',
        'platform.maintenance': false,
        'platform.maintenance_message': '',
        'platform.max_concurrent_users': 10000,
        
        // User Settings
        'user.registration_enabled': true,
        'user.email_verification_required': true,
        'user.default_user_type': 'viewer',
        'user.min_age': 13,
        'user.max_age': 120,
        'user.avatar_max_size': 5242880, // 5MB
        'user.profile_completion_bonus': 0,
        
        // Challenge Settings
        'challenge.max_duration': 600, // 10 hours
        'challenge.min_duration': 1, // 1 minute
        'challenge.max_competitors': 2,
        'challenge.registration_close_minutes': 5,
        'challenge.auto_end_grace_minutes': 2,
        'challenge.rating_enabled': true,
        'challenge.comment_enabled': true,
        'challenge.max_tags': 10,
        'challenge.featured_challenge_limit': 50,
        
        // Moderation Settings
        'moderation.auto_approve_comments': false,
        'moderation.comment_flag_threshold': 3,
        'moderation.rating_flag_threshold': 2,
        'moderation.max_flags_before_review': 5,
        'moderation.suspicious_vote_detection': true,
        'moderation.spam_detection_enabled': true,
        'moderation.toxicity_threshold': 0.7,
        
        // Payment Settings
        'payment.platform_fee_rate': 0.20, // 20%
        'payment.payment_processing_fee': 0.029, // 2.9%
        'payment.min_payout_amount': 10,
        'payment.payout_currency': 'USD',
        'payment.payout_methods': ['paypal', 'bank_transfer'],
        'payment.tax_rate': 0.05, // 5%
        'payment.currency_conversion_enabled': true,
        
        // Notification Settings
        'notification.email_enabled': true,
        'notification.push_enabled': true,
        'notification.sms_enabled': false,
        'notification.challenge_start_reminder_minutes': 15,
        'notification.new_follower_enabled': true,
        'notification.earnings_notification_enabled': true,
        'notification.system_maintenance_notifications': true,
        
        // Security Settings
        'security.password_min_length': 8,
        'security.password_require_special': false,
        'security.max_login_attempts': 5,
        'security.account_lock_duration_minutes': 120,
        'security.jwt_expiry_hours': 24,
        'security.refresh_token_expiry_days': 7,
        'security.remember_me_days': 30,
        'security.two_factor_required': false,
        
        // Performance Settings
        'performance.cache_enabled': true,
        'performance.cache_ttl_minutes': 60,
        'performance.max_api_requests_per_minute': 1000,
        'performance.compression_enabled': true,
        'performance.static_cache_enabled': true,
        'performance.database_timeout_seconds': 30,
        
        // Feature Flags
        'features.livestreaming_enabled': true,
        'features.real_time_chat_enabled': true,
        'features.rating_system_enabled': true,
        'features.financial_payouts_enabled': true,
        'features.mobile_app_enabled': false,
        'features.social_login_enabled': true,
        'features.analytics_enabled': true,
        'features.beta_features_enabled': false
    };
};

// Initialize default settings
systemSettingsSchema.statics.initializeDefaultSettings = async function() {
    const defaultValues = this.getDefaultValues();
    const existingSettings = await this.find({});
    const existingKeys = new Set(existingSettings.map(s => s.key));
    
    const newSettings = [];
    const updatedSettings = [];
    
    for (const [key, value] of Object.entries(defaultValues)) {
        if (!existingKeys.has(key)) {
            newSettings.push({
                key,
                value,
                type: typeof value,
                category: this.getCategoryForKey(key),
                description: this.getDescriptionForKey(key),
                isSystem: true
            });
        }
    }
    
    if (newSettings.length > 0) {
        await this.insertMany(newSettings);
    }
    
    return {
        newSettings: newSettings.length,
        existingSettings: existingSettings.length
    };
};

// Helper method to determine category from key
systemSettingsSchema.statics.getCategoryForKey = function(key) {
    if (key.startsWith('platform.')) return 'general';
    if (key.startsWith('user.')) return 'user';
    if (key.startsWith('challenge.')) return 'challenge';
    if (key.startsWith('moderation.')) return 'moderation';
    if (key.startsWith('payment.')) return 'payment';
    if (key.startsWith('notification.')) return 'notification';
    if (key.startsWith('security.')) return 'security';
    if (key.startsWith('performance.')) return 'performance';
    if (key.startsWith('features.')) return 'feature_flags';
    return 'general';
};

// Helper method to get description from key
systemSettingsSchema.statics.getDescriptionForKey = function(key) {
    const descriptions = {
        'platform.name': 'اسم المنصة',
        'platform.version': 'إصدار المنصة',
        'platform.maintenance': 'حالة الصيانة',
        'user.registration_enabled': 'تفعيل التسجيل',
        'challenge.max_duration': 'الحد الأقصى لمدة المنافسة',
        'payment.platform_fee_rate': 'نسبة رسوم المنصة',
        'security.password_min_length': 'الحد الأدنى لطول كلمة المرور'
        // Add more descriptions as needed
    };
    
    return descriptions[key] || `إعداد ${key}`;
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);