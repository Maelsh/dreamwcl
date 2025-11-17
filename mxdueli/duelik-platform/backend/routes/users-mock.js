const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');

// This is a mock implementation for testing
// In production, this would use the actual User model and database

const router = express.Router();

// Helper function to get user from token
const getUserFromToken = (token) => {
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        
        // Mock user data - in production this would come from database
        const mockUsers = {
            '1': {
                id: '1',
                username: 'testuser123',
                email: 'testuser123@example.com',
                fullName: 'Test User 123',
                userType: 'user',
                avatar: null,
                bio: 'This is a test user',
                country: 'Test Country',
                dateOfBirth: '1990-01-01',
                isEmailVerified: true,
                isActive: true,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date()
            }
        };
        
        return mockUsers[decoded.id] || null;
    } catch (error) {
        return null;
    }
};

// =========================================
// GET CURRENT USER PROFILE
// =========================================

router.get('/profile', asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'غير مصرح - رمز الوصول مطلوب'
        });
    }

    const token = authHeader.substring(7);
    const user = getUserFromToken(token);
    
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'رمز الوصول غير صحيح'
        });
    }

    res.json({
        success: true,
        user
    });
}));

// =========================================
// GET USER PROFILE BY ID
// =========================================

router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Mock user data
    const mockUsers = {
        '1': {
            id: '1',
            username: 'testuser123',
            email: 'testuser123@example.com',
            fullName: 'Test User 123',
            userType: 'user',
            avatar: null,
            bio: 'This is a test user',
            country: 'Test Country',
            dateOfBirth: '1990-01-01',
            isEmailVerified: true,
            isActive: true,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date()
        }
    };
    
    const user = mockUsers[id];
    
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'المستخدم غير موجود'
        });
    }

    res.json({
        success: true,
        user
    });
}));

// =========================================
// UPDATE USER PROFILE
// =========================================

router.patch('/profile', asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'غير مصرح - رمز الوصول مطلوب'
        });
    }

    const token = authHeader.substring(7);
    const user = getUserFromToken(token);
    
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'رمز الوصول غير صحيح'
        });
    }

    // In a real implementation, this would update the database
    // For mock testing, we just return success
    
    res.json({
        success: true,
        message: 'تم تحديث الملف الشخصي بنجاح',
        user: {
            ...user,
            ...req.body,
            updatedAt: new Date()
        }
    });
}));

module.exports = router;