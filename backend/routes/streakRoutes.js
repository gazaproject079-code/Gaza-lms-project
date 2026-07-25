const express = require('express');
const router = express.Router();
const streakController = require('../controllers/streakController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Record today as an active day and return updated streak
router.post('/activity', streakController.recordActivity);

// Get current streak data (read-only)
router.get('/', streakController.getStreak);

module.exports = router;
