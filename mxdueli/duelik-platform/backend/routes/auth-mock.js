const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../middleware/errorHandler');

// Mock user database (in-memory for testing)
let mockUsers = [
    {
        id: '1',
        username: 'testuser123',
        email: 'testuser123@example.com',
        password: '$2a$12$5XTRuDsWHIVtBOZQdzQHQ.xptrBd/0y.sU0ZWr2e0GIo0/Jndphti', // TestPassword123!
        fullName: 'Test User 123',
        userType: 'user',
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

const router = express.Router();

// Helper function to generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId, type: 'user' },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
};

// Helper function to create user object without password
const createUserResponse = (user) => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

// Helper function to find user by credentials
const findUserByCredentials = (email, username) => {
    return mockUsers.find(user => 
        user.email === email || user.username === username
    );
};

// =========================================
// REGISTRATION
// =========================================

router.post('/register', asyncHandler(async (req, res) => {
    const { fullName, username, email, password, userType = 'user' } = req.body;

    // Validate required fields
    if (!fullName || !username || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'جميع الحقول مطلوبة'
        });
    }

    // Check if user already exists
    const existingUser = findUserByCredentials(email, username);
    if (existingUser) {
        return res.status(409).json({
            success: false,
            message: 'المستخدم موجود بالفعل'
        });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = {
        id: crypto.randomUUID(),
        username,
        email,
        password: hashedPassword,
        fullName,
        userType,
        isEmailVerified: true, // Auto-verify for testing
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    // Add to mock database
    mockUsers.push(newUser);

    // Generate token
    const token = generateToken(newUser.id);

    // Send response
    res.status(201).json({
        success: true,
        message: 'تم تسجيل المستخدم بنجاح',
        token,
        user: createUserResponse(newUser)
    });
}));

// =========================================
// LOGIN
// =========================================

router.post('/login', asyncHandler(async (req, res) => {
    const { email, password, username } = req.body;

    // Validate required fields
    if ((!email && !username) || !password) {
        return res.status(400).json({
            success: false,
            message: 'البريد الإلكتروني أو اسم المستخدم وكلمة المرور مطلوبان'
        });
    }

    // Find user
    const user = findUserByCredentials(email, username);
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'بيانات الدخول غير صحيحة'
        });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({
            success: false,
            message: 'بيانات الدخول غير صحيحة'
        });
    }

    // Check if account is active
    if (!user.isActive) {
        return res.status(401).json({
            success: false,
            message: 'الحساب غير مفعل'
        });
    }

    // Generate token
    const token = generateToken(user.id);

    // Send response
    res.json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        token,
        user: createUserResponse(user)
    });
}));

// =========================================
// GET CURRENT USER
// =========================================

router.get('/me', asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'غير مصرح - رمز الوصول مطلوب'
        });
    }

    const token = authHeader.substring(7);
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        const user = mockUsers.find(u => u.id === decoded.id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        res.json({
            success: true,
            user: createUserResponse(user)
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'رمز الوصول غير صحيح'
        });
    }
}));

// Export mock data for testing purposes
router.get('/mock-users', (req, res) => {
    res.json({
        success: true,
        users: mockUsers.map(createUserResponse)
    });
});

module.exports = router;