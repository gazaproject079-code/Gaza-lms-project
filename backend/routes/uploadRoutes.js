const express = require('express');
const router = express.Router();
const multer = require('multer');

// Always use local storage
const { generalStorage } = require('../config/localStorage');

// File filter to accept only PDFs and images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and images are allowed.'), false);
  }
};

const upload = multer({
  storage: generalStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Upload single file
router.post('/file', upload.single('file'), (req, res) => {
  try {
    console.log('📤 File upload request received');

    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Local storage path
    const fileUrl = `/uploads/${req.file.filename}`;

    console.log('✅ File uploaded successfully:');
    console.log('   - Original name:', req.file.originalname);
    console.log('   - URL:', fileUrl);
    console.log('   - Size:', req.file.size, 'bytes');
    console.log('   - Type:', req.file.mimetype);
    console.log('   - Storage: Local');

    res.json({
      success: true,
      file: {
        url: fileUrl,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Upload multiple files
router.post('/files', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));

    console.log(`✅ ${files.length} files uploaded (Local)`);

    res.json({
      success: true,
      files: files
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

module.exports = router;
