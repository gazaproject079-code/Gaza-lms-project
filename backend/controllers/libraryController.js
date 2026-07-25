const { LibraryItem, User } = require('../models');

exports.getLibraryItems = async (req, res) => {
  try {
    const { role } = req.user;
    let whereClause = { status: 'approved' };
    
    // Admins and Superadmins can see all items, including pending ones
    if (role === 'instructor' || role === 'superadmin') {
      whereClause = {};
    }

    const items = await LibraryItem.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'approver', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(items);
  } catch (error) {
    console.error('Error fetching library items:', error);
    res.status(500).json({ error: 'Failed to fetch library items' });
  }
};

exports.createLibraryItem = async (req, res) => {
  try {
    const { title, description, url, type } = req.body;
    const { id: userId, role } = req.user;

    // Determine initial status based on role
    let initialStatus = 'pending';
    let approvedBy = null;
    
    if (role === 'instructor' || role === 'superadmin') {
      initialStatus = 'approved';
      approvedBy = userId;
    }

    const newItem = await LibraryItem.create({
      title,
      description,
      url,
      type,
      status: initialStatus,
      uploadedBy: userId,
      approvedBy
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating library item:', error);
    res.status(500).json({ error: 'Failed to create library item' });
  }
};

exports.approveLibraryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    const { id: adminId } = req.user;

    const item = await LibraryItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ error: 'Library item not found' });
    }

    item.status = status;
    if (status === 'approved') {
      item.approvedBy = adminId;
    }
    
    await item.save();

    res.json(item);
  } catch (error) {
    console.error('Error approving library item:', error);
    res.status(500).json({ error: 'Failed to update library item status' });
  }
};

exports.uploadLibraryFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: req.file.path, filename: req.file.originalname });
  } catch (error) {
    console.error('Error uploading library file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

exports.deleteLibraryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LibraryItem.findByPk(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Library item not found' });
    }

    await item.destroy();
    res.json({ message: 'Library item deleted successfully' });
  } catch (error) {
    console.error('Error deleting library item:', error);
    res.status(500).json({ error: 'Failed to delete library item' });
  }
};
