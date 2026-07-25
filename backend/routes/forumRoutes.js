const express = require('express');
const {
  getChannels,
  createChannel,
  getMessages,
  getOrCreateDirectChannel,
  getInstructorsForStudent,
  getStudentsForInstructor,
  getDirectChannels,
  getPeersForInstructor,
  getSponsorsForAdmin,
  markChannelRead,
} = require('../controllers/forumController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET all channels accessible to user
router.get('/channels', authenticateToken, getChannels);

// POST create a channel (only admins/superadmins can create channels per requirements)
router.post('/channels', authenticateToken, requireAdmin, createChannel);

// GET messages for a channel
router.get('/channels/:channelId/messages', authenticateToken, getMessages);

// POST mark a channel as read (clears unread count for this user)
router.post('/channels/:channelId/read', authenticateToken, markChannelRead);

// POST get or create direct message channel
router.post('/channels/direct', authenticateToken, getOrCreateDirectChannel);

// GET instructors for current student
router.get('/instructors', authenticateToken, getInstructorsForStudent);

// GET students for current instructor
router.get('/students', authenticateToken, getStudentsForInstructor);

// GET all direct channels for current instructor/admin (DM inbox)
router.get('/direct-channels', authenticateToken, getDirectChannels);

// GET other instructors/admins for peer-to-peer chat
router.get('/peers', authenticateToken, getPeersForInstructor);

// GET all active sponsors (for admin/instructor sponsors tab)
router.get('/sponsors', authenticateToken, getSponsorsForAdmin);

module.exports = router;
