const { CertificateTemplate, User, Certificate, Course, TemplateCourse } = require('../models');
const { generateCertificatePDF } = require('../services/certificateService');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Always use local storage
const { templateStorage } = require('../config/localStorage');

// Helper: delete local file
const deleteLocalFile = (filePath) => {
  try {
    if (filePath && filePath.startsWith('/uploads/')) {
      const fullPath = path.join(__dirname, '..', filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log('✅ Deleted local file:', filePath);
      }
    }
  } catch (e) {
    console.log('Could not delete local file:', e.message);
  }
};

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage: templateStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get all certificate templates
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await CertificateTemplate.findAll({
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Course, as: 'courses', attributes: ['id', 'name'], through: { attributes: ['isActive'] } }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, templates });
  } catch (error) {
    console.error('Get all templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get active template
exports.getActiveTemplate = async (req, res) => {
  try {
    const template = await CertificateTemplate.findOne({
      where: { isActive: true },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Course, as: 'courses', attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });

    if (!template) {
      return res.json({ success: true, template: null, message: 'No active template found' });
    }

    res.json({ success: true, template });
  } catch (error) {
    console.error('Get active template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get template by ID
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await CertificateTemplate.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Course, as: 'courses', attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ success: true, template });
  } catch (error) {
    console.error('Get template by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new template
exports.createTemplate = async (req, res) => {
  try {
    const {
      name,
      primaryColor,
      secondaryColor,
      fontFamily,
      titleText,
      subtitleText,
      footerText,
      isActive,
      courseIds
    } = req.body;

    // If setting as active, deactivate other templates
    if (isActive) {
      await CertificateTemplate.update({ isActive: false }, { where: {} });
    }

    const template = await CertificateTemplate.create({
      name: name || 'New Template',
      primaryColor,
      secondaryColor,
      fontFamily,
      titleText,
      subtitleText,
      footerText,
      isActive: isActive || false,
      createdBy: req.user.id
    });

    // Associate courses if provided
    if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
      await template.setCourses(courseIds);
    }

    // Fetch template with courses
    const templateWithCourses = await CertificateTemplate.findByPk(template.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Course, as: 'courses', attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });

    res.status(201).json({ success: true, template: templateWithCourses });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update template
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      primaryColor,
      secondaryColor,
      fontFamily,
      titleText,
      subtitleText,
      footerText,
      courseIds
    } = req.body;

    const template = await CertificateTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Update fields
    if (name !== undefined) template.name = name;
    if (primaryColor !== undefined) template.primaryColor = primaryColor;
    if (secondaryColor !== undefined) template.secondaryColor = secondaryColor;
    if (fontFamily !== undefined) template.fontFamily = fontFamily;
    if (titleText !== undefined) template.titleText = titleText;
    if (subtitleText !== undefined) template.subtitleText = subtitleText;
    if (footerText !== undefined) template.footerText = footerText;

    await template.save();

    // Update course associations if provided
    if (courseIds !== undefined) {
      if (Array.isArray(courseIds)) {
        await template.setCourses(courseIds);
      }
    }

    // Fetch updated template with courses
    const updatedTemplate = await CertificateTemplate.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Course, as: 'courses', attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });

    res.json({ success: true, template: updatedTemplate });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Activate template globally (set as default active - for backward compatibility)
exports.activateTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await CertificateTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Deactivate all other templates globally
    await CertificateTemplate.update({ isActive: false }, { where: {} });

    // Activate this template
    template.isActive = true;
    await template.save();

    res.json({ success: true, template, message: 'Template activated as default successfully' });
  } catch (error) {
    console.error('Activate template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Activate template for specific courses
exports.activateTemplateForCourses = async (req, res) => {
  try {
    const { id } = req.params;
    const { courseIds } = req.body;

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ error: 'Course IDs are required' });
    }

    const template = await CertificateTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Deactivate other templates for these courses
    await TemplateCourse.update(
      { isActive: false },
      { where: { courseId: courseIds } }
    );

    // Activate this template for the specified courses
    for (const courseId of courseIds) {
      // Check if association exists
      const existing = await TemplateCourse.findOne({
        where: { templateId: id, courseId }
      });

      if (existing) {
        existing.isActive = true;
        await existing.save();
      } else {
        // Create association with isActive = true
        await TemplateCourse.create({
          templateId: id,
          courseId,
          isActive: true
        });
      }
    }

    // Fetch updated template with courses
    const updatedTemplate = await CertificateTemplate.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Course, as: 'courses', attributes: ['id', 'name'], through: { attributes: ['isActive'] } }
      ]
    });

    res.json({
      success: true,
      template: updatedTemplate,
      message: `Template activated for ${courseIds.length} course(s)`
    });
  } catch (error) {
    console.error('Activate template for courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get active templates per course (for showing which templates are active for which courses)
exports.getActiveTemplatesPerCourse = async (req, res) => {
  try {
    const activeAssignments = await TemplateCourse.findAll({
      where: { isActive: true },
      include: [
        {
          model: CertificateTemplate,
          as: 'template',
          attributes: ['id', 'name', 'primaryColor', 'secondaryColor']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'name']
        }
      ]
    });

    // Get default active template (for courses without specific assignment)
    const defaultTemplate = await CertificateTemplate.findOne({
      where: { isActive: true },
      attributes: ['id', 'name', 'primaryColor', 'secondaryColor']
    });

    res.json({
      success: true,
      activeAssignments,
      defaultTemplate
    });
  } catch (error) {
    console.error('Get active templates per course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete template
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await CertificateTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Delete associated local files
    if (template.backgroundImage) {
      deleteLocalFile(template.backgroundImage);
    }

    if (template.adminSignature) {
      deleteLocalFile(template.adminSignature);
    }

    await template.destroy();

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload background image
exports.uploadBackground = [
  upload.single('background'),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const template = await CertificateTemplate.findByPk(id);

      // Local storage path
      const fileUrl = `/uploads/templates/${req.file.filename}`;

      if (!template) {
        // Delete the uploaded file
        deleteLocalFile(fileUrl);
        return res.status(404).json({ error: 'Template not found' });
      }

      // Delete old background if exists
      if (template.backgroundImage) {
        deleteLocalFile(template.backgroundImage);
      }

      // Store file URL
      template.backgroundImage = fileUrl;
      await template.save();

      console.log('✅ Background uploaded (Local):', fileUrl);

      res.json({
        success: true,
        backgroundImage: template.backgroundImage,
        message: 'Background image uploaded successfully'
      });
    } catch (error) {
      console.error('Upload background error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
];

// Upload admin signature
exports.uploadAdminSignature = [
  upload.single('signature'),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const template = await CertificateTemplate.findByPk(id);

      // Local storage path
      const fileUrl = `/uploads/templates/${req.file.filename}`;

      if (!template) {
        deleteLocalFile(fileUrl);
        return res.status(404).json({ error: 'Template not found' });
      }

      // Delete old signature if exists
      if (template.adminSignature) {
        deleteLocalFile(template.adminSignature);
      }

      // Store file URL
      template.adminSignature = fileUrl;
      await template.save();

      console.log('✅ Signature uploaded (Local):', fileUrl);

      res.json({
        success: true,
        adminSignature: template.adminSignature,
        message: 'Admin signature uploaded successfully'
      });
    } catch (error) {
      console.error('Upload admin signature error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
];

// Preview certificate with sample data
exports.previewCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    let template = null;
    if (id) {
      template = await CertificateTemplate.findByPk(id);
    } else {
      // Use active template
      template = await CertificateTemplate.findOne({ where: { isActive: true } });
    }

    // Convert Sequelize model to plain object
    const templateData = template ? template.get({ plain: true }) : null;

    console.log('Preview certificate - Template data:', {
      id: templateData?.id,
      name: templateData?.name,
      adminSignature: templateData?.adminSignature,
      backgroundImage: templateData?.backgroundImage,
      primaryColor: templateData?.primaryColor
    });

    // Sample data for preview
    const sampleData = {
      studentName: 'John Doe',
      courseName: 'Advanced JavaScript Development',
      certificateNumber: 'CERT-PREVIEW-123456',
      issueDate: new Date()
    };

    // Generate PDF
    const pdfBuffer = await generateCertificatePDF(sampleData, templateData);

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=certificate-preview.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Preview certificate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get certificate statistics
exports.getCertificateStats = async (req, res) => {
  try {
    const totalCertificates = await Certificate.count();

    const recentCertificates = await Certificate.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Course, as: 'course', attributes: ['id', 'name'] }
      ]
    });

    const activeTemplate = await CertificateTemplate.findOne({
      where: { isActive: true }
    });

    res.json({
      success: true,
      stats: {
        totalCertificates,
        hasActiveTemplate: !!activeTemplate,
        activeTemplateId: activeTemplate?.id || null
      },
      recentCertificates
    });
  } catch (error) {
    console.error('Get certificate stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get template for a specific course
exports.getTemplateForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // First, check for a course-specific active template assignment
    const activeAssignment = await TemplateCourse.findOne({
      where: { courseId, isActive: true }
    });

    if (activeAssignment) {
      const template = await CertificateTemplate.findByPk(activeAssignment.templateId, {
        include: [
          { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
        ]
      });
      if (template) {
        return res.json({ success: true, template, source: 'course-specific' });
      }
    }

    // Fall back to the global default active template
    const defaultTemplate = await CertificateTemplate.findOne({
      where: { isActive: true },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (defaultTemplate) {
      return res.json({ success: true, template: defaultTemplate, source: 'default' });
    }

    return res.json({ success: true, template: null, message: 'No template found for this course' });
  } catch (error) {
    console.error('Get template for course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = exports;
