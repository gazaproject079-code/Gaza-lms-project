const express = require('express');
const multer = require('multer');
const {
  getLibraryItems,
  createLibraryItem,
  approveLibraryItem,
  deleteLibraryItem,
  uploadLibraryFile,
} = require('../controllers/libraryController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { libraryStorage } = require('../config/cloudinary');

const router = express.Router();
const upload = multer({
  storage: libraryStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
});

// GET all approved library items (or all items if admin/superadmin)
router.get('/', authenticateToken, getLibraryItems);

// POST upload a PDF or video file to Cloudinary, returns { url, filename }
router.post('/upload', authenticateToken, upload.single('file'), uploadLibraryFile);

// POST create a new library item (needs approval if student)
router.post('/', authenticateToken, createLibraryItem);

// PUT approve a library item
router.put('/:id/approve', authenticateToken, requireAdmin, approveLibraryItem);

// DELETE a library item
router.delete('/:id', authenticateToken, requireAdmin, deleteLibraryItem);

module.exports = router;
