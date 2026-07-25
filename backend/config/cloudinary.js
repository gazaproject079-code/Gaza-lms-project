const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// General storage for uploads (PDFs, images, materials)
const generalStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isPdf = file.mimetype === 'application/pdf';
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const uniqueName = `${Date.now()}-${nameWithoutExt}${ext}`;
    return {
      folder: 'gazarise/uploads',
      resource_type: isPdf ? 'raw' : 'image',
      public_id: isPdf ? uniqueName : undefined,
      allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
    };
  },
});

// Template storage for certificate backgrounds and signatures
const templateStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'gazarise/templates',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  },
});

// Library storage: supports PDFs and videos.
// resource_type:'auto' lets Cloudinary detect the type (video/raw/image) automatically,
// which avoids multer-storage-cloudinary v4 incompatibilities with explicit 'video' type.
const libraryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const uniqueName = `${Date.now()}-${nameWithoutExt}`;
    return {
      folder: 'gazarise/library',
      resource_type: 'auto',
      public_id: uniqueName,
    };
  },
});

module.exports = { cloudinary, generalStorage, templateStorage, libraryStorage };
