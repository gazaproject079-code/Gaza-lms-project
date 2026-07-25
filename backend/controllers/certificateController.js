const { Certificate, Course, User, Enrollment, CertificateTemplate } = require('../models');
const crypto = require('crypto');
const { generateAndSaveCertificate } = require('../services/certificateService');
const { sendCertificateEmail } = require('../services/emailService');

// Get all certificates for authenticated student
exports.getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Course, as: 'course' }
      ],
      order: [['issuedDate', 'DESC']]
    });

    res.json({ success: true, certificates });
  } catch (error) {
    console.error('Get my certificates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAllCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.findAll({
      include: [
        { model: Course, as: 'course' },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ],
      order: [['issuedDate', 'DESC']]
    });

    res.json({ success: true, certificates });
  } catch (error) {
    console.error('Get all certificates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Generate certificate for completed course
exports.generateCertificate = async (req, res) => {
  try {
    const { courseId, grade } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // Check if enrollment is completed
    const enrollment = await Enrollment.findOne({
      where: {
        userId: req.user.id,
        courseId,
        status: 'completed'
      }
    });

    if (!enrollment) {
      return res.status(400).json({ error: 'Course must be completed to generate certificate' });
    }

    // Check if certificate already exists
    const existing = await Certificate.findOne({
      where: {
        userId: req.user.id,
        courseId
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Certificate already generated for this course' });
    }

    // Get course and user
    const course = await Course.findByPk(courseId);
    const user = await User.findByPk(req.user.id);

    // Generate unique certificate number
    const certificateNumber = generateCertificateNumber(user.id, courseId);
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/certificates/verify/${certificateNumber}`;

    // Create certificate
    const certificate = await Certificate.create({
      userId: req.user.id,
      courseId,
      certificateNumber,
      verificationUrl,
      grade: grade || 'Pass',
      issuedDate: new Date()
    });

    // Generate PDF and send email if requested (after payment)
    const sendEmail = req.body.sendEmail === true;
    if (sendEmail) {
      try {
        // Find the active certificate template (course-specific first, then global)
        const template = await CertificateTemplate.findOne({ where: { isActive: true } });

        const { pdfBuffer, certificateUrl } = await generateAndSaveCertificate(
          {
            studentName: user.name,
            courseName: course.name,
            certificateNumber,
            issueDate: new Date(),
            grade: grade || 'Pass',
          },
          template
        );

        // Save PDF URL back to certificate record
        await certificate.update({ certificateUrl });

        // Send email with PDF attachment
        await sendCertificateEmail(
          user.email,
          user.name,
          course.name,
          certificateNumber,
          pdfBuffer
        );

        console.log(`📧 Certificate email sent to ${user.email}`);
      } catch (emailErr) {
        // Don't fail the whole request if PDF/email fails — cert is still created
        console.error('⚠️  Certificate PDF/email error:', emailErr.message);
      }
    }

    // Include course details in response
    const certificateWithDetails = await Certificate.findByPk(certificate.id, {
      include: [{ model: Course, as: 'course' }]
    });

    res.status(201).json({ success: true, certificate: certificateWithDetails });
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify certificate
exports.verifyCertificate = async (req, res) => {
  try {
    const { certificateNumber } = req.params;

    const certificate = await Certificate.findOne({
      where: { certificateNumber },
      include: [
        { model: Course, as: 'course' },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json({
      success: true,
      valid: true,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        studentName: certificate.user.name,
        courseName: certificate.course.name,
        issuedDate: certificate.issuedDate,
        grade: certificate.grade
      }
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findByPk(req.params.id, {
      include: [
        { model: Course, as: 'course' },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json({ success: true, certificate });
  } catch (error) {
    console.error('Get certificate by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findByPk(req.params.id);

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    await certificate.destroy();
    res.json({ success: true, message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error('Delete certificate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to generate unique certificate number
function generateCertificateNumber(userId, courseId) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CERT-${userId}-${courseId}-${timestamp}-${random}`;
}

module.exports = exports;
