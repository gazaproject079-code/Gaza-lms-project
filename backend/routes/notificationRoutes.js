const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// All notification routes require authentication
router.use(authenticateToken);

// Get user's notifications
router.get('/my', notificationController.getMyNotifications);

// Mark notification as read
router.put('/read/:id', notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

// Clear all notifications
router.delete('/clear/all', notificationController.clearAllNotifications);
router.delete('/clear', notificationController.clearAllNotifications);

module.exports = router;
