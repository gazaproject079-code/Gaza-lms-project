const express = require('express');
const router = express.Router();
const aiChatController = require('../controllers/aiChatController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Session routes
router.post('/sessions', aiChatController.createSession);
router.get('/sessions', aiChatController.getSessions);
router.get('/sessions/:id', aiChatController.getSession);
router.put('/sessions/:id', aiChatController.updateSession);
router.delete('/sessions/:id', aiChatController.deleteSession);

// Message routes
router.post('/sessions/:id/messages', aiChatController.sendMessage);

module.exports = router;
