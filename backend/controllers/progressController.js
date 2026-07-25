const { Progress, Course, Topic, Enrollment, Certificate, CertificateTemplate, TemplateCourse, User, sequelize } = require('../models');
const { generateAndSaveCertificate, generateCertificateNumber } = require('../services/certificateService');
const { sendCertificateEmail } = require('../services/emailService');
const { recordActivityForUser } = require('./streakController');

// Get all progress for authenticated student
exports.getMyProgress = async (req, res) => {
  try {
    const progress = await Progress.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Course, as: 'course' },
        { model: Topic, as: 'topic' }
      ],
      order: [['updatedAt', 'DESC']]
    });

    res.json({ success: true, progress });
  } catch (error) {
    console.error('Get my progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update topic progress (mark as completed)
exports.updateTopicProgress = async (req, res) => {
  try {
    const { courseId, topicId, completed, timeSpent } = req.body;

    if (!courseId || !topicId) {
      return res.status(400).json({ error: 'Course ID and Topic ID are required' });
    }

    // Check if student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      where: {
        userId: req.user.id,
        courseId
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'You must be enrolled in this course' });
    }

    // Find or create progress record
    let [progress, created] = await Progress.findOrCreate({
      where: {
        userId: req.user.id,
        courseId,
        topicId
      },
      defaults: {
        completed: completed || false,
        timeSpent: timeSpent || 0,
        completedAt: completed ? new Date() : null
      }
    });

    // Update if already exists
    if (!created) {
      progress.completed = completed !== undefined ? completed : progress.completed;
      progress.timeSpent = timeSpent !== undefined ? timeSpent : progress.timeSpent;
      progress.completedAt = completed ? new Date() : progress.completedAt;
      await progress.save();
    }

    // Update enrollment progress percentage
    await updateEnrollmentProgress(req.user.id, courseId);

    // Record daily activity for streak tracking (fire-and-forget)
    recordActivityForUser(req.user.id);

    res.json({ success: true, progress });
  } catch (error) {
    console.error('Update topic progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get learning statistics
exports.getLearningStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { Op } = require('sequelize');

    // Get enrollment counts (exclude dropped courses)
    const enrolledCount = await Enrollment.count({
      where: {
        userId,
        status: { [Op.ne]: 'dropped' }
      }
    });

    const completedCount = await Enrollment.count({
      where: { userId, status: 'completed' }
    });

    // Count in-progress and enrolled as "in progress"
    const inProgressCount = await Enrollment.count({
      where: {
        userId,
        status: { [Op.in]: ['in-progress', 'enrolled'] }
      }
    });

    // Get total topics completed
    const topicsCompleted = await Progress.count({
      where: { userId, completed: true }
    });

    res.json({
      success: true,
      stats: {
        enrolled: enrolledCount,
        completed: completedCount,
        inProgress: inProgressCount,
        topicsCompleted
      }
    });
  } catch (error) {
    console.error('Get learning stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reset course progress
exports.resetCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Delete all progress for this course
    await Progress.destroy({
      where: {
        userId: req.user.id,
        courseId
      }
    });

    // Update enrollment
    const enrollment = await Enrollment.findOne({
      where: {
        userId: req.user.id,
        courseId
      }
    });

    if (enrollment) {
      enrollment.status = 'enrolled';
      enrollment.progressPercentage = 0;
      enrollment.completedAt = null;
      await enrollment.save();
    }

    res.json({ success: true, message: 'Course progress reset successfully' });
  } catch (error) {
    console.error('Reset course progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to update enrollment progress
async function updateEnrollmentProgress(userId, courseId) {
  try {
    // Get total topics for course
    const totalTopics = await Topic.count({ where: { courseId } });

    if (totalTopics === 0) {
      return;
    }

    // Get completed topics
    const completedTopics = await Progress.count({
      where: {
        userId,
        courseId,
        completed: true
      }
    });

    // Calculate percentage
    const progressPercentage = (completedTopics / totalTopics) * 100;

    // Update enrollment
    const enrollment = await Enrollment.findOne({
      where: { userId, courseId }
    });

    if (enrollment) {
      const wasNotCompleted = enrollment.status !== 'completed';
      enrollment.progressPercentage = progressPercentage;

      if (progressPercentage === 100) {
        enrollment.status = 'completed';
        enrollment.completedAt = new Date();

        // Auto-generate certificate if course is now completed and wasn't before
        if (wasNotCompleted) {
          await generateAndSendCertificate(userId, courseId);
        }
      } else if (progressPercentage > 0) {
        enrollment.status = 'in-progress';
      }

      await enrollment.save();
    }
  } catch (error) {
    console.error('Update enrollment progress error:', error);
  }
}

// Helper function to generate and send certificate
async function generateAndSendCertificate(userId, courseId) {
  try {
    // Check if certificate already exists
    const existingCert = await Certificate.findOne({
      where: { userId, courseId }
    });

    if (existingCert) {
      console.log(`Certificate already exists for user ${userId}, course ${courseId}`);
      return;
    }

    // Fetch user and course
    const user = await User.findByPk(userId);
    const course = await Course.findByPk(courseId);

    if (!user || !course) {
      console.error('User or course not found for certificate generation');
      return;
    }

    // Get template for this course
    // First check for course-specific active template
    let template = null;
    const courseTemplateAssignment = await TemplateCourse.findOne({
      where: { courseId, isActive: true }
    });

    if (courseTemplateAssignment) {
      template = await CertificateTemplate.findByPk(courseTemplateAssignment.templateId);
      console.log(`Using course-specific template: ${template?.name} for course ${courseId}`);
    }

    // Fall back to global default active template
    if (!template) {
      template = await CertificateTemplate.findOne({
        where: { isActive: true }
      });
      console.log(`Using default template: ${template?.name || 'none'}`);
    }

    // Generate unique certificate number
    const certificateNumber = generateCertificateNumber(userId, courseId);
    const issueDate = new Date();

    // Certificate data
    const certificateData = {
      studentName: user.name,
      courseName: course.name,
      certificateNumber,
      issueDate
    };

    // Generate and save PDF
    const { pdfBuffer, certificateUrl } = await generateAndSaveCertificate(certificateData, template);

    // Create certificate record in database
    const certificate = await Certificate.create({
      userId,
      courseId,
      certificateNumber,
      issuedDate: issueDate,
      verificationUrl: `/api/certificates/verify/${certificateNumber}`,
      grade: 'Pass',
      certificateUrl
    });

    console.log(`Certificate generated: ${certificateNumber}`);

    // Send email with certificate
    try {
      await sendCertificateEmail(
        user.email,
        user.name,
        course.name,
        certificateNumber,
        pdfBuffer
      );
      console.log(`Certificate email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send certificate email:', emailError);
      // Don't throw - certificate was still created successfully
    }

    return certificate;
  } catch (error) {
    console.error('Error generating and sending certificate:', error);
    // Don't throw - we don't want to break the progress update flow
  }
}

module.exports = exports;
