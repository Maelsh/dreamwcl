const { body, param, query, validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const formattedErrors = {};
        
        errors.array().forEach(error => {
            if (!formattedErrors[error.param]) {
                formattedErrors[error.param] = error.msg;
            }
        });
        
        return res.status(400).json({
            success: false,
            status: 'fail',
            message: 'بيانات غير صحيحة',
            errors: formattedErrors
        });
    }
    
    next();
};

// Common validation chains
const emailValidation = body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('صيغة البريد الإلكتروني غير صحيحة');

const passwordValidation = body('password')
    .isLength({ min: 6 })
    .withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('كلمة المرور يجب أن تحتوي على أحرف وأرقام');

const usernameValidation = body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('اسم المستخدم يجب أن يكون بين 3 و 30 حرف')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('اسم المستخدم يجب أن يحتوي على أحرف وأرقام فقط');

const fullNameValidation = body('fullName')
    .isLength({ min: 2, max: 100 })
    .withMessage('الاسم الكامل يجب أن يكون بين 2 و 100 حرف')
    .trim();

const userTypeValidation = body('userType')
    .optional()
    .isIn(['competitor', 'viewer', 'admin', 'moderator'])
    .withMessage('نوع المستخدم يجب أن يكون: competitor, viewer, admin, أو moderator');

// =========================================
// AUTHENTICATION VALIDATION
// =========================================

const validateRegister = [
    fullNameValidation,
    usernameValidation,
    emailValidation,
    passwordValidation,
    userTypeValidation,
    handleValidationErrors
];

const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('صيغة البريد الإلكتروني غير صحيحة'),
    body('password')
        .notEmpty()
        .withMessage('كلمة المرور مطلوبة'),
    handleValidationErrors
];

const validateForgotPassword = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('صيغة البريد الإلكتروني غير صحيحة'),
    handleValidationErrors
];

const validateResetPassword = [
    body('token')
        .notEmpty()
        .withMessage('رمز إعادة التعيين مطلوب'),
    passwordValidation,
    body('passwordConfirm')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('تأكيد كلمة المرور غير متطابق');
            }
            return true;
        }),
    handleValidationErrors
];

const validateChangePassword = [
    body('currentPassword')
        .notEmpty()
        .withMessage('كلمة المرور الحالية مطلوبة'),
    passwordValidation,
    body('passwordConfirm')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('تأكيد كلمة المرور غير متطابق');
            }
            return true;
        }),
    handleValidationErrors
];

// =========================================
// USER VALIDATION
// =========================================

const validateUpdateProfile = [
    body('fullName')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('الاسم الكامل يجب أن يكون بين 2 و 100 حرف')
        .trim(),
    body('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('النبذة الشخصية يجب ألا تتجاوز 500 حرف')
        .trim(),
    body('country')
        .optional()
        .isLength({ max: 100 })
        .withMessage('اسم الدولة يجب ألا يتجاوز 100 حرف')
        .trim(),
    body('city')
        .optional()
        .isLength({ max: 100 })
        .withMessage('اسم المدينة يجب ألا يتجاوز 100 حرف')
        .trim(),
    body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('تاريخ الميلاد يجب أن يكون بصيغة صحيحة')
        .custom((value) => {
            const birthDate = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            
            if (age < 13 || age > 120) {
                throw new Error('العمر يجب أن يكون بين 13 و 120 سنة');
            }
            return true;
        }),
    body('gender')
        .optional()
        .isIn(['male', 'female', 'other'])
        .withMessage('الجنس يجب أن يكون: male, female, أو other'),
    handleValidationErrors
];

const validateUserId = [
    param('id')
        .isMongoId()
        .withMessage('معرف المستخدم غير صحيح'),
    handleValidationErrors
];

const validateUsername = [
    param('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('اسم المستخدم يجب أن يكون بين 3 و 30 حرف')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('اسم المستخدم يجب أن يحتوي على أحرف وأرقام فقط'),
    handleValidationErrors
];

// =========================================
// CHALLENGE VALIDATION
// =========================================

const validateCreateChallenge = [
    body('title')
        .isLength({ min: 5, max: 200 })
        .withMessage('عنوان المنافسة يجب أن يكون بين 5 و 200 حرف')
        .trim(),
    body('description')
        .isLength({ min: 10, max: 2000 })
        .withMessage('وصف المنافسة يجب أن يكون بين 10 و 2000 حرف')
        .trim(),
    body('category')
        .isIn(['dialogue', 'sciences', 'talents'])
        .withMessage('فئة المنافسة يجب أن تكون: dialogue, sciences, أو talents'),
    body('subCategory')
        .custom((value, { req }) => {
            const { category } = req.body;
            const subCategories = {
                dialogue: ['religions', 'sects', 'politics', 'economics', 'conflicts', 'current'],
                sciences: ['physics', 'chemistry', 'biology', 'mathematics', 'technology', 'medicine'],
                talents: ['music', 'art', 'poetry', 'storytelling', 'debate', 'comedy']
            };
            
            if (!subCategories[category]?.includes(value)) {
                throw new Error(`الفئة الفرعية غير صحيحة للفئة المحددة`);
            }
            return true;
        }),
    body('scheduledAt')
        .isISO8601()
        .withMessage('توقيت المنافسة يجب أن يكون بصيغة صحيحة')
        .custom((value) => {
            const scheduledDate = new Date(value);
            const now = new Date();
            
            if (scheduledDate <= now) {
                throw new Error('توقيت المنافسة يجب أن يكون في المستقبل');
            }
            return true;
        }),
    body('duration')
        .isInt({ min: 1, max: 600 })
        .withMessage('مدة المنافسة يجب أن تكون بين 1 و 600 دقيقة'),
    body('isPublic')
        .optional()
        .isBoolean()
        .withMessage('يجب أن تكون قيمة النشر صواب أو خطأ'),
    handleValidationErrors
];

const validateUpdateChallenge = [
    param('id')
        .isMongoId()
        .withMessage('معرف المنافسة غير صحيح'),
    body('title')
        .optional()
        .isLength({ min: 5, max: 200 })
        .withMessage('عنوان المنافسة يجب أن يكون بين 5 و 200 حرف')
        .trim(),
    body('description')
        .optional()
        .isLength({ min: 10, max: 2000 })
        .withMessage('وصف المنافسة يجب أن يكون بين 10 و 2000 حرف')
        .trim(),
    body('isPublic')
        .optional()
        .isBoolean()
        .withMessage('يجب أن تكون قيمة النشر صواب أو خطأ'),
    handleValidationErrors
];

const validateChallengeId = [
    param('id')
        .isMongoId()
        .withMessage('معرف المنافسة غير صحيح'),
    handleValidationErrors
];

const validateChallengeQuery = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('رقم الصفحة يجب أن يكون رقماً موجباً'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('حد النتائج يجب أن يكون بين 1 و 100'),
    query('category')
        .optional()
        .isIn(['dialogue', 'sciences', 'talents'])
        .withMessage('فئة المنافسة غير صحيحة'),
    query('status')
        .optional()
        .isIn(['scheduled', 'waiting', 'live', 'paused', 'ended', 'cancelled'])
        .withMessage('حالة المنافسة غير صحيحة'),
    query('search')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('نص البحث يجب ألا يتجاوز 100 حرف')
        .trim(),
    handleValidationErrors
];

// =========================================
// RATING VALIDATION
// =========================================

const validateCreateRating = [
    body('challenge')
        .isMongoId()
        .withMessage('معرف المنافسة غير صحيح'),
    body('ratedUser')
        .isMongoId()
        .withMessage('معرف المستخدم المُقيّم غير صحيح'),
    body('category')
        .isIn(['performance', 'knowledge', 'presentation', 'persuasion', 'creativity', 'fairness'])
        .withMessage('فئة التقييم غير صحيحة'),
    body('rating')
        .isInt({ min: 1, max: 10 })
        .withMessage('نقاط التقييم يجب أن تكون بين 1 و 10'),
    body('comment')
        .optional()
        .isLength({ max: 500 })
        .withMessage('التعليق يجب ألا يتجاوز 500 حرف')
        .trim(),
    body('isPublic')
        .optional()
        .isBoolean()
        .withMessage('يجب أن تكون قيمة النشر صواب أو خطأ'),
    handleValidationErrors
];

const validateRatingId = [
    param('id')
        .isMongoId()
        .withMessage('معرف التقييم غير صحيح'),
    handleValidationErrors
];

// =========================================
// COMMENT VALIDATION
// =========================================

const validateCreateComment = [
    body('challenge')
        .isMongoId()
        .withMessage('معرف المنافسة غير صحيح'),
    body('content')
        .isLength({ min: 1, max: 1000 })
        .withMessage('محتوى التعليق يجب أن يكون بين 1 و 1000 حرف')
        .trim(),
    body('parentComment')
        .optional()
        .isMongoId()
        .withMessage('معرف التعليق الرئيسي غير صحيح'),
    body('type')
        .optional()
        .isIn(['general', 'question', 'feedback', 'support', 'criticism', 'applause'])
        .withMessage('نوع التعليق غير صحيح'),
    handleValidationErrors
];

const validateCommentId = [
    param('id')
        .isMongoId()
        .withMessage('معرف التعليق غير صحيح'),
    handleValidationErrors
];

// =========================================
// REPORT VALIDATION
// =========================================

const validateCreateReport = [
    body('targetType')
        .isIn(['user', 'challenge', 'comment', 'rating', 'profile', 'message', 'system'])
        .withMessage('نوع الهدف غير صحيح'),
    body('targetId')
        .isMongoId()
        .withMessage('معرف الهدف غير صحيح'),
    body('category')
        .isIn([
            'harassment',
            'spam',
            'fake_information',
            'inappropriate_content',
            'copyright_violation',
            'impersonation',
            'hate_speech',
            'violence',
            'sexual_content',
            'drugs',
            'scam',
            'cheating',
            'technical_issues',
            'other'
        ])
        .withMessage('فئة البلاغ غير صحيحة'),
    body('description')
        .isLength({ min: 10, max: 2000 })
        .withMessage('وصف البلاغ يجب أن يكون بين 10 و 2000 حرف')
        .trim(),
    body('evidence')
        .optional()
        .isLength({ max: 500 })
        .withMessage('الادلة يجب ألا تتجاوز 500 حرف')
        .trim(),
    handleValidationErrors
];

const validateReportId = [
    param('id')
        .isMongoId()
        .withMessage('معرف البلاغ غير صحيح'),
    handleValidationErrors
];

// =========================================
// UPLOAD VALIDATION
// =========================================

const validateFileUpload = [
    body('uploadType')
        .isIn(['avatar', 'document', 'image', 'video'])
        .withMessage('نوع الملف غير صحيح'),
    handleValidationErrors
];

// =========================================
// FINANCE VALIDATION
// =========================================

const validatePayoutRequest = [
    body('amount')
        .isFloat({ min: 10, max: 10000 })
        .withMessage('المبلغ يجب أن يكون بين 10 و 10000'),
    body('currency')
        .isIn(['USD', 'EUR', 'AED', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR'])
        .withMessage('العملة غير صحيحة'),
    body('paymentMethod')
        .isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'crypto', 'wallet'])
        .withMessage('طريقة الدفع غير صحيحة'),
    handleValidationErrors
];

const validateFinanceId = [
    param('id')
        .isMongoId()
        .withMessage('معرف المعاملة المالية غير صحيح'),
    handleValidationErrors
];

// =========================================
// PAGINATION VALIDATION
// =========================================

const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('رقم الصفحة يجب أن يكون رقماً موجباً'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('حد النتائج يجب أن يكون بين 1 و 100'),
    query('sort')
        .optional()
        .isIn(['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'title', '-title'])
        .withMessage('ترتيب النتائج غير صحيح'),
    handleValidationErrors
];

// =========================================
// DATE VALIDATION
// =========================================

const validateDateRange = [
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('تاريخ البداية يجب أن يكون بصيغة صحيحة'),
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('تاريخ النهاية يجب أن يكون بصيغة صحيحة')
        .custom((value, { req }) => {
            if (req.query.startDate && value) {
                const start = new Date(req.query.startDate);
                const end = new Date(value);
                
                if (end <= start) {
                    throw new Error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
                }
            }
            return true;
        }),
    handleValidationErrors
];

// =========================================
// ID VALIDATION HELPERS
// =========================================

const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
};

module.exports = {
    handleValidationErrors,
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
    validateChangePassword,
    validateUpdateProfile,
    validateUserId,
    validateUsername,
    validateCreateChallenge,
    validateUpdateChallenge,
    validateChallengeId,
    validateChallengeQuery,
    validateCreateRating,
    validateRatingId,
    validateCreateComment,
    validateCommentId,
    validateCreateReport,
    validateReportId,
    validateFileUpload,
    validatePayoutRequest,
    validateFinanceId,
    validatePagination,
    validateDateRange,
    isValidObjectId,
    isValidEmail,
    isValidUsername
};