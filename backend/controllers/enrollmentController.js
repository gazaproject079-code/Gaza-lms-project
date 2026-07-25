const { Enrollment, Course, User, Category, Topic, Progress } = require('../models');

// Get all enrollments for the authenticated student
exports.getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Course,
          as: 'course',
          include: [
            { model: Category, as: 'category' },
            { model: Topic, as: 'topics', separate: true, order: [['order', 'ASC']] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, enrollments });
  } catch (error) {
    console.error('Get my enrollments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Enroll in a course
exports.enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({
      where: {
        userId: req.user.id,
        courseId
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      userId: req.user.id,
      courseId,
      status: 'enrolled'
    });

    res.status(201).json({ success: true, enrollment });
  } catch (error) {
    console.error('Enroll in course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Unenroll from a course
exports.unenrollFromCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      where: {
        userId: req.user.id,
        courseId
      }
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    // Delete related progress records
    await Progress.destroy({
      where: {
        userId: req.user.id,
        courseId
      }
    });

    await enrollment.destroy();

    res.json({ success: true, message: 'Unenrolled successfully' });
  } catch (error) {
    console.error('Unenroll from course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check if enrolled in a course
exports.checkEnrollment = async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      where: {
        userId: req.user.id,
        courseId
      }
    });

    res.json({
      success: true,
      enrolled: !!enrollment,
      enrollment: enrollment || null
    });
  } catch (error) {
    console.error('Check enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateEnrollmentProgress = async (req, res) => {
  try {
    const { courseId, progress } = req.body;

    if (!courseId || typeof progress !== 'number') {
      return res.status(400).json({ error: 'Course ID and numeric progress are required' });
    }

    const enrollment = await Enrollment.findOne({
      where: {
        userId: req.user.id,
        courseId
      }
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    enrollment.progressPercentage = Math.max(0, Math.min(100, progress));
    enrollment.status = enrollment.progressPercentage >= 100
      ? 'completed'
      : enrollment.progressPercentage > 0
        ? 'in-progress'
        : 'enrolled';
    enrollment.completedAt = enrollment.progressPercentage >= 100 ? new Date() : null;
    await enrollment.save();

    res.json({ success: true, enrollment });
  } catch (error) {
    console.error('Update enrollment progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = exports;
