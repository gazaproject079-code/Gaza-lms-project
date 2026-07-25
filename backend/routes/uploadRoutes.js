const express = require('express');
const router = express.Router();
const multer = require('multer');
const { generalStorage } = require('../config/cloudinary');

// Accept PDFs, images, and videos
const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: PDF, images, and videos.'), false);
  }
};

const upload = multer({
  storage: generalStorage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB (covers large videos)
});

// Upload single file → returns Cloudinary URL
router.post('/file', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Cloudinary puts the public CDN URL in req.file.path
    const fileUrl = req.file.path;

    console.log('✅ File uploaded to Cloudinary:', fileUrl);

    res.json({
      success: true,
      file: {
        url: fileUrl,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Upload multiple files → returns array of Cloudinary URLs
router.post('/files', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files.map(file => ({
      url: file.path,         // Cloudinary CDN URL
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    }));

    console.log(`✅ ${files.length} files uploaded to Cloudinary`);

    res.json({ success: true, files });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

module.exports = router;
