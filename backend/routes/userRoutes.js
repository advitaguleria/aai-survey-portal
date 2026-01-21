const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authMiddleware, userController.getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, upload.single('employeeIdImage'), userController.updateProfile);

// @route   PUT /api/users/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', authMiddleware, userController.changePassword);

// @route   GET /api/users/all
// @desc    Get all users (admin)
// @access  Private (Admin only)
router.get('/all', authMiddleware, userController.getAllUsers);

module.exports = router;