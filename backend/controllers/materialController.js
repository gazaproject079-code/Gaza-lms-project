const { Material, Course, Topic } = require('../models');

exports.createMaterial = async (req, res) => {
  try {
    const { type, title, uri, description, courseId, topicId } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Material type is required' });
    }

    if (!courseId && !topicId) {
      return res.status(400).json({ error: 'Either courseId or topicId must be provided' });
    }

    // Verify course exists if courseId provided
    if (courseId) {
      const course = await Course.findByPk(courseId);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
    }

    // Verify topic exists if topicId provided
    if (topicId) {
      const topic = await Topic.findByPk(topicId);
      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }
    }

    const material = await Material.create({
      type,
      title,
      uri,
      description,
      courseId,
      topicId
    });

    res.status(201).json({ success: true, material });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getMaterials = async (req, res) => {
  try {
    const { courseId, topicId } = req.query;
    const where = {};

    if (courseId) where.courseId = courseId;
    if (topicId) where.topicId = topicId;

    const materials = await Material.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, materials });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, uri, description } = req.body;

    const material = await Material.findByPk(id);

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    if (type) material.type = type;
    if (title !== undefined) material.title = title;
    if (uri !== undefined) material.uri = uri;
    if (description !== undefined) material.description = description;

    await material.save();

    res.json({ success: true, material });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const material = await Material.findByPk(id);

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    await material.destroy();

    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



