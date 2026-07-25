const { StudentUpload } = require('../models');

// List the authenticated student's own uploads
exports.getMyUploads = async (req, res) => {
  try {
    const uploads = await StudentUpload.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(uploads);
  } catch (error) {
    console.error('Error fetching uploads:', error);
    res.status(500).json({ error: 'Failed to fetch uploads' });
  }
};

// Create a new upload record (file already stored via /api/upload/file)
exports.createUpload = async (req, res) => {
  try {
    const { title, description, fileUrl, type } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!fileUrl) {
      return res.status(400).json({ error: 'A file is required' });
    }

    const upload = await StudentUpload.create({
      userId: req.user.id,
      title: title.trim(),
      description: description || null,
      fileUrl,
      type: ['document', 'image', 'certificate', 'other'].includes(type) ? type : 'document'
    });

    res.status(201).json(upload);
  } catch (error) {
    console.error('Error creating upload:', error);
    res.status(500).json({ error: 'Failed to create upload' });
  }
};

// Delete an upload (owner only)
exports.deleteUpload = async (req, res) => {
  try {
    const { id } = req.params;
    const upload = await StudentUpload.findByPk(id);

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }
    if (upload.userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own uploads' });
    }

    await upload.destroy();
    res.json({ message: 'Upload deleted successfully' });
  } catch (error) {
    console.error('Error deleting upload:', error);
    res.status(500).json({ error: 'Failed to delete upload' });
  }
};
