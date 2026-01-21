const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/survey/submit
// @desc    Submit feedback/survey
// @access  Private
router.post('/submit', authMiddleware, surveyController.submitFeedback);

// @route   GET /api/survey/past-submissions
// @desc    Get past survey submissions
// @access  Private
router.get('/past-submissions', authMiddleware, surveyController.getPastSubmissions);

// @route   GET /api/survey/dashboard-stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/dashboard-stats', authMiddleware, surveyController.getDashboardStats);

module.exports = router;