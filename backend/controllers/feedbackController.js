const { Feedback, Course, Topic } = require('../models');

exports.createFeedback = async (req, res) => {
  try {
    if (!['student', 'sponsor', 'instructor', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to submit feedback' });
    }

    const {
      courseName,
      userName,
      feedback,
      rating,
      courseId,
      topicId,
      topicTitle,
      lectureId,
      feedbackType,
      regenerateCommand,
    } = req.body;

    if (!courseName || !userName || !feedback || !rating) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify course exists if courseId provided
    if (courseId) {
      const course = await Course.findByPk(courseId);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
    }
    if (topicId) {
      const topic = await Topic.findByPk(topicId);
      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }
    }
    const feedbackRecord = await Feedback.create({
      courseName,
      userName,
      feedback,
      rating,
      courseId,
      topicId: topicId || null,
      topicTitle: topicTitle || null,
      lectureId: lectureId || null,
      userId: req.user.id,
      feedbackType: feedbackType || 'general_course_feedback',
      regenerateCommand: `${regenerateCommand || ''}`.trim() || null,
    });

    res.status(201).json({ success: true, feedback: feedbackRecord });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    if (!['instructor', 'superadmin', 'student', 'sponsor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to view feedback' });
    }

    const where = {};
    if (req.query.courseId) where.courseId = req.query.courseId;
    if (req.query.topicId) where.topicId = req.query.topicId;
    if (req.query.lectureId) where.lectureId = req.query.lectureId;
    if (req.query.feedbackType) where.feedbackType = req.query.feedbackType;
    if (['student', 'sponsor'].includes(req.user.role)) {
      where.userId = req.user.id;
    }

    const feedbacks = await Feedback.findAll({
      where,
      include: [
        { model: Course, as: 'course', attributes: ['id', 'name'] },
        { model: Topic, as: 'topic', attributes: ['id', 'title'] },
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, feedbacks });
  } catch (error) {
    console.error('Get feedbacks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getFeedbackById = async (req, res) => {
  try {
    if (!['instructor', 'superadmin', 'student', 'sponsor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to view feedback' });
    }

    const { id } = req.params;

    const feedback = await Feedback.findByPk(id, {
      include: [
        { model: Course, as: 'course' },
        { model: Topic, as: 'topic' },
      ]
    });

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    if (['student', 'sponsor'].includes(req.user.role) && feedback.userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only view your own feedback' });
    }

    res.json({ success: true, feedback });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateFeedback = async (req, res) => {
  try {
    if (!['instructor', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only admins can update feedback' });
    }

    const { id } = req.params;
    const { courseName, userName, feedback, rating, regenerateCommand } = req.body;

    const feedbackRecord = await Feedback.findByPk(id);

    if (!feedbackRecord) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    if (courseName) feedbackRecord.courseName = courseName;
    if (userName) feedbackRecord.userName = userName;
    if (feedback) feedbackRecord.feedback = feedback;
    if (rating && rating >= 1 && rating <= 5) feedbackRecord.rating = rating;
    if (regenerateCommand !== undefined) feedbackRecord.regenerateCommand = `${regenerateCommand || ''}`.trim() || null;

    await feedbackRecord.save();

    res.json({ success: true, feedback: feedbackRecord });
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    if (!['instructor', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only admins can delete feedback' });
    }

    const { id } = req.params;

    const feedback = await Feedback.findByPk(id);

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    await feedback.destroy();

    res.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

