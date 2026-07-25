const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
const templatesDir = path.join(uploadsDir, 'templates');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// General storage for uploads (PDFs, images, materials)
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const uniqueName = `${Date.now()}-${nameWithoutExt}${ext}`;
    cb(null, uniqueName);
  }
});

// Template storage for certificate backgrounds and signatures
const templateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, templatesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const uniqueName = `${Date.now()}-${nameWithoutExt}${ext}`;
    cb(null, uniqueName);
  }
});

module.exports = { generalStorage, templateStorage };
