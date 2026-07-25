const express = require('express');
const router = express.Router();
const { getMyUploads, createUpload, deleteUpload } = require('../controllers/studentUploadController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// List my uploads
router.get('/my', getMyUploads);

// Create a new upload record
router.post('/', createUpload);

// Delete one of my uploads
router.delete('/:id', deleteUpload);

module.exports = router;
