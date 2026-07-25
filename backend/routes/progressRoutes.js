const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { authenticateToken } = require('../middleware/auth');

// All progress routes require authentication
router.use(authenticateToken);

// Get student's progress
router.get('/my', progressController.getMyProgress);

// Update topic progress
router.post('/topic', progressController.updateTopicProgress);

// Get learning statistics
router.get('/stats', progressController.getLearningStats);

// Reset course progress
router.delete('/reset/:courseId', progressController.resetCourseProgress);

module.exports = router;
