const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Mock challenges data
let mockChallenges = [
    {
        id: '1',
        title: 'Test Challenge',
        description: 'This is a test challenge',
        category: 'dialogue',
        subCategory: 'religions',
        difficulty: 'beginner',
        timeLimit: 30,
        maxParticipants: 2,
        currentParticipants: 1,
        status: 'active',
        rules: ['Be respectful', 'Stay on topic'],
        creatorId: '1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
    }
];

// Helper function to get user from token
const getUserFromToken = (token) => {
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        
        // Mock user data
        const mockUsers = {
            '1': {
                id: '1',
                username: 'testuser123',
                email: 'testuser123@example.com',
                fullName: 'Test User 123',
                userType: 'user',
                isEmailVerified: true,
                isActive: true
            }
        };
        
        return mockUsers[decoded.id] || null;
    } catch (error) {
        return null;
    }
};

// =========================================
// GET ALL CHALLENGES
// =========================================

router.get('/', asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category, difficulty, status } = req.query;
    
    // Filter mock data
    let filteredChallenges = [...mockChallenges];
    
    if (category) {
        filteredChallenges = filteredChallenges.filter(c => c.category === category);
    }
    
    if (difficulty) {
        filteredChallenges = filteredChallenges.filter(c => c.difficulty === difficulty);
    }
    
    if (status) {
        filteredChallenges = filteredChallenges.filter(c => c.status === status);
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedChallenges = filteredChallenges.slice(startIndex, endIndex);
    
    res.json({
        success: true,
        results: paginatedChallenges.length,
        totalChallenges: filteredChallenges.length,
        totalPages: Math.ceil(filteredChallenges.length / limit),
        currentPage: parseInt(page),
        challenges: paginatedChallenges
    });
}));

// =========================================
// GET CHALLENGE BY ID
// =========================================

router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const challenge = mockChallenges.find(c => c.id === id);
    
    if (!challenge) {
        return res.status(404).json({
            success: false,
            message: 'التحدي غير موجود'
        });
    }

    res.json({
        success: true,
        challenge
    });
}));

// =========================================
// CREATE CHALLENGE
// =========================================

router.post('/', asyncHandler(async (req, res) => {
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

    const { 
        title, 
        description, 
        category, 
        subCategory, 
        difficulty, 
        timeLimit, 
        maxParticipants, 
        rules 
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !difficulty) {
        return res.status(400).json({
            success: false,
            message: 'العنوان والوصف والفئة ومستوى الصعوبة مطلوبة'
        });
    }

    // Create new challenge
    const newChallenge = {
        id: Date.now().toString(),
        title,
        description,
        category,
        subCategory: subCategory || 'general',
        difficulty,
        timeLimit: timeLimit || 30,
        maxParticipants: maxParticipants || 2,
        currentParticipants: 1,
        status: 'active',
        rules: rules || [],
        creatorId: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    // Add to mock data
    mockChallenges.push(newChallenge);

    res.status(201).json({
        success: true,
        message: 'تم إنشاء التحدي بنجاح',
        challenge: newChallenge
    });
}));

// =========================================
// UPDATE CHALLENGE
// =========================================

router.patch('/:id', asyncHandler(async (req, res) => {
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

    const { id } = req.params;
    const challengeIndex = mockChallenges.findIndex(c => c.id === id);
    
    if (challengeIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'التحدي غير موجود'
        });
    }

    const challenge = mockChallenges[challengeIndex];
    
    // Check if user is the creator
    if (challenge.creatorId !== user.id) {
        return res.status(403).json({
            success: false,
            message: 'غير مصرح بتعديل هذا التحدي'
        });
    }

    // Update challenge
    const updatedChallenge = {
        ...challenge,
        ...req.body,
        updatedAt: new Date()
    };

    mockChallenges[challengeIndex] = updatedChallenge;

    res.json({
        success: true,
        message: 'تم تحديث التحدي بنجاح',
        challenge: updatedChallenge
    });
}));

// =========================================
// DELETE CHALLENGE
// =========================================

router.delete('/:id', asyncHandler(async (req, res) => {
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

    const { id } = req.params;
    const challengeIndex = mockChallenges.findIndex(c => c.id === id);
    
    if (challengeIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'التحدي غير موجود'
        });
    }

    const challenge = mockChallenges[challengeIndex];
    
    // Check if user is the creator
    if (challenge.creatorId !== user.id) {
        return res.status(403).json({
            success: false,
            message: 'غير مصرح بحذف هذا التحدي'
        });
    }

    // Remove from mock data
    mockChallenges.splice(challengeIndex, 1);

    res.json({
        success: true,
        message: 'تم حذف التحدي بنجاح'
    });
}));

// Mock middleware for authentication
const mockAuthenticate = (req, res, next) => {
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

    req.user = user;
    next();
};

module.exports = router;
module.exports.mockAuthenticate = mockAuthenticate;