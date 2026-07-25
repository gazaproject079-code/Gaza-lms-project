const express = require('express');
const { getMyLiveLectures, createLiveLecture, updateLiveLecture, deleteLiveLecture } = require('../controllers/liveLectureController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, getMyLiveLectures);
router.post('/', authenticateToken, requireAdmin, createLiveLecture);
router.put('/:id', authenticateToken, requireAdmin, updateLiveLecture);
router.delete('/:id', authenticateToken, requireAdmin, deleteLiveLecture);

module.exports = router;
