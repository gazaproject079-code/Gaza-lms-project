const { sequelize, Topic, Course, Material, Quiz, LiveLecture, Recording } = require('../models');

function ensureTopicAuthoringAccess(user, course) {
  const isSuperAdmin = user.role === 'superadmin';
  const isAdmin = user.role === 'instructor';
  const canManageAll = user.permissions?.canManageAllCourses === true;
  const isOwner = course.userId === user.id;

  if (!isSuperAdmin && !isAdmin) {
    return 'Only admins can manage course topics';
  }

  if (!isSuperAdmin && !isOwner && !canManageAll) {
    return 'You do not have permission to manage topics for this course';
  }

  return null;
}

function sanitizeQuizQuestions(questions = []) {
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions
    .map((question, index) => ({
      id: question.id || `${index + 1}`,
      question: `${question.question || question.prompt || ''}`.trim(),
      prompt: `${question.prompt || question.question || ''}`.trim(),
      options: Array.isArray(question.options)
        ? question.options.map((option) => `${option || ''}`.trim())
        : [],
      correctAnswer: Number.isInteger(question.correctAnswer)
        ? question.correctAnswer
        : Number(question.correctAnswer || 0),
    }))
    .filter((question) => question.question && question.options.length > 0);
}

exports.createTopic = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { courseId, title, materials, questions, topicType, liveLecture, recording } = req.body;

    if (!courseId || !title) {
      return res.status(400).json({ error: 'Course ID and title are required' });
    }

    // Verify course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const accessError = ensureTopicAuthoringAccess(req.user, course);
    if (accessError) {
      return res.status(403).json({ error: accessError });
    }

    // Get the highest order number for this course
    const lastTopic = await Topic.findOne({
      where: { courseId },
      order: [['order', 'DESC']]
    });

    const order = lastTopic ? lastTopic.order + 1 : 0;

    // First topic (order 0) should be unlocked, rest should be locked
    const status = order === 0 ? 'unlocked' : 'locked';

    const topic = await Topic.create({
      courseId,
      title,
      status: status,
      completed: false,
      order,
      topicType: topicType || 'recorded'
    }, { transaction });

    // Add materials if provided
    if (materials && Array.isArray(materials) && materials.length > 0) {
      const topicMaterials = materials.map(material => ({
        ...material,
        topicId: topic.id,
        courseId: courseId
      }));
      await Material.bulkCreate(topicMaterials, { transaction });
    }

    // Add Live Lecture if live
    if (topicType === 'live' && liveLecture) {
      await LiveLecture.create({
        title: `${title} - Live Session`,
        description: `Live lecture for topic: ${title}`,
        scheduledTime: liveLecture.scheduledTime,
        meetingLink: liveLecture.meetingLink,
        courseId,
        topicId: topic.id,
        status: 'scheduled'
      }, { transaction });
    }

    // Add Recording if recorded
    if (topicType === 'recorded' && recording && recording.videoUrl) {
      await Recording.create({
        title: `${title} - Recording`,
        description: `Recorded lecture for topic: ${title}`,
        videoUrl: recording.videoUrl,
        duration: recording.duration || null,
        courseId,
        topicId: topic.id
      }, { transaction });
    }

    // Create quiz if questions provided (manual mode courses)
    const normalizedQuestions = sanitizeQuizQuestions(questions);
    if (normalizedQuestions.length > 0) {
      await Quiz.create({
        courseId,
        topicId: topic.id,
        title: `${title} Quiz`,
        questions: JSON.stringify(normalizedQuestions),
        passingScore: 70,
        isActive: true,
      }, { transaction });
    }

    await transaction.commit();

    const createdTopic = await Topic.findByPk(topic.id, {
      include: [
        { model: Material, as: 'materials' },
        { model: Quiz, as: 'quizzes' },
        { model: LiveLecture, as: 'liveLecture' },
        { model: Recording, as: 'recording' }
      ]
    });

    res.status(201).json({ success: true, topic: createdTopic });
  } catch (error) {
    await transaction.rollback();
    console.error('Create topic error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTopicsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const topics = await Topic.findAll({
      where: { courseId },
      include: [
        { model: Material, as: 'materials' },
        { model: Quiz, as: 'quizzes' },
        { model: LiveLecture, as: 'liveLecture' },
        { model: Recording, as: 'recording' }
      ],
      order: [['order', 'ASC']]
    });

    res.json({ success: true, topics });
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateTopic = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { title, status, completed, order, materials, questions, topicType, liveLecture, recording } = req.body;

    const topic = await Topic.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    }, { transaction });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const course = topic.course;
    const accessError = ensureTopicAuthoringAccess(req.user, course);
    if (accessError) {
      return res.status(403).json({ error: accessError });
    }

    if (title) topic.title = title;
    if (status) topic.status = status;
    if (typeof completed === 'boolean') topic.completed = completed;
    if (typeof order === 'number') topic.order = order;
    if (topicType) topic.topicType = topicType;

    await topic.save({ transaction });

    const activeType = topicType || topic.topicType;

    if (activeType === 'live') {
      // Delete existing recording if any
      await Recording.destroy({ where: { topicId: topic.id }, transaction });

      if (liveLecture) {
        const existingLive = await LiveLecture.findOne({ where: { topicId: topic.id }, transaction });
        const livePayload = {
          title: `${topic.title} - Live Session`,
          description: `Live lecture for topic: ${topic.title}`,
          scheduledTime: liveLecture.scheduledTime,
          meetingLink: liveLecture.meetingLink,
          courseId: topic.courseId,
          topicId: topic.id
        };
        if (existingLive) {
          await existingLive.update(livePayload, { transaction });
        } else {
          await LiveLecture.create({ ...livePayload, status: 'scheduled' }, { transaction });
        }
      }
    } else if (activeType === 'recorded') {
      // Delete existing live lecture if any
      await LiveLecture.destroy({ where: { topicId: topic.id }, transaction });

      if (recording) {
        const existingRec = await Recording.findOne({ where: { topicId: topic.id }, transaction });
        const recPayload = {
          title: `${topic.title} - Recording`,
          description: `Recorded lecture for topic: ${topic.title}`,
          videoUrl: recording.videoUrl,
          duration: recording.duration || null,
          courseId: topic.courseId,
          topicId: topic.id
        };
        if (existingRec) {
          await existingRec.update(recPayload, { transaction });
        } else {
          await Recording.create(recPayload, { transaction });
        }
      }
    }

    if (Array.isArray(materials)) {
      await Material.destroy({ where: { topicId: topic.id }, transaction });

      if (materials.length > 0) {
        await Material.bulkCreate(
          materials.map((material) => ({
            ...material,
            topicId: topic.id,
            courseId: topic.courseId
          })),
          { transaction }
        );
      }
    }

    if (Array.isArray(questions)) {
      const normalizedQuestions = sanitizeQuizQuestions(questions);
      const existingQuiz = await Quiz.findOne({ where: { topicId: topic.id }, transaction });
      const quizPayload = {
        courseId: topic.courseId,
        topicId: topic.id,
        title: `${topic.title} Quiz`,
        questions: JSON.stringify(normalizedQuestions),
        passingScore: 70,
        isActive: true,
      };

      if (existingQuiz && normalizedQuestions.length === 0) {
        await existingQuiz.destroy({ transaction });
      } else if (existingQuiz) {
        await existingQuiz.update(quizPayload, { transaction });
      } else if (normalizedQuestions.length > 0) {
        await Quiz.create(quizPayload, { transaction });
      }
    }

    await transaction.commit();

    const updatedTopic = await Topic.findByPk(id, {
      include: [
        { model: Material, as: 'materials' },
        { model: Quiz, as: 'quizzes' },
        { model: LiveLecture, as: 'liveLecture' },
        { model: Recording, as: 'recording' }
      ]
    });

    res.json({ success: true, topic: updatedTopic });
  } catch (error) {
    await transaction.rollback();
    console.error('Update topic error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await Topic.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const course = topic.course;
    const accessError = ensureTopicAuthoringAccess(req.user, course);
    if (accessError) {
      return res.status(403).json({ error: accessError });
    }

    await topic.destroy();

    res.json({ success: true, message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
