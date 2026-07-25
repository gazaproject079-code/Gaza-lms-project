const express = require('express');
const { getMyRecordings, createRecording, updateRecording, deleteRecording } = require('../controllers/recordingController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, getMyRecordings);
router.post('/', authenticateToken, requireAdmin, createRecording);
router.put('/:id', authenticateToken, requireAdmin, updateRecording);
router.delete('/:id', authenticateToken, requireAdmin, deleteRecording);

module.exports = router;
