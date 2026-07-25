const { Quiz, QuizResult, Course, Enrollment, Topic, Progress } = require('../models');

function normalizeQuizQuestions(rawQuestions) {
  if (Array.isArray(rawQuestions)) {
    return rawQuestions;
  }

  if (typeof rawQuestions === 'string') {
    try {
      const parsed = JSON.parse(rawQuestions);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  return [];
}

exports.getQuizzes = async (req, res) => {
  try {
    const { courseId, topicId } = req.query;

    if (topicId) {
      return exports.getQuizByTopic({
        ...req,
        params: { ...req.params, topicId }
      }, res);
    }

    if (courseId) {
      return exports.getQuizzesByCourse({
        ...req,
        params: { ...req.params, courseId }
      }, res);
    }

    const quizzes = await Quiz.findAll({
      where: { isActive: true },
      include: [{ model: Course, as: 'course' }]
    });

    const sanitizedQuizzes = quizzes.map(quiz => {
      const quizData = quiz.toJSON();
      quizData.questions = normalizeQuizQuestions(quizData.questions).map(q => ({
          id: q.id,
          question: q.question,
          options: q.options,
        }));
      return quizData;
    });

    res.json({ success: true, quizzes: sanitizedQuizzes });
  } catch (error) {
    console.error('Get quizzes list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all quizzes for a course
exports.getQuizzesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const quizzes = await Quiz.findAll({
      where: { courseId, isActive: true },
      include: [{ model: Course, as: 'course' }]
    });

    // Don't send answers to client
    const sanitizedQuizzes = quizzes.map(quiz => {
      const quizData = quiz.toJSON();
      quizData.questions = normalizeQuizQuestions(quizData.questions).map(q => ({
          id: q.id,
          question: q.question,
          options: q.options,
          // Don't include correctAnswer
        }));
      return quizData;
    });

    res.json({ success: true, quizzes: sanitizedQuizzes });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get quiz by topic ID
exports.getQuizByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;

    const quiz = await Quiz.findOne({
      where: { topicId, isActive: true },
      include: [{ model: Course, as: 'course' }]
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found for this topic' });
    }

    const quizData = quiz.toJSON();
    quizData.questions = normalizeQuizQuestions(quizData.questions).map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
    }));

    res.json({ success: true, quiz: quizData });
  } catch (error) {
    console.error('Get quiz by topic error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get quiz by ID
exports.getQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Don't send answers to client
    const quizData = quiz.toJSON();
    quizData.questions = normalizeQuizQuestions(quizData.questions).map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
    }));

    res.json({ success: true, quiz: quizData });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Submit quiz
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId, answers, timeTaken } = req.body;

    if (!quizId || !answers) {
      return res.status(400).json({ error: 'Quiz ID and answers are required' });
    }

    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      where: {
        userId: req.user.id,
        courseId: quiz.courseId
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'You must be enrolled in this course' });
    }

    // Calculate score
    const questions = normalizeQuizQuestions(quiz.questions);
    let correctAnswers = 0;
    const totalQuestions = questions.length;

    questions.forEach(question => {
      const userAnswer = answers[question.id];
      if (userAnswer === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = score >= (quiz.passingScore || 70);

    // Get attempt number
    const previousAttempts = await QuizResult.count({
      where: {
        userId: req.user.id,
        quizId
      }
    });

    // Save result
    const result = await QuizResult.create({
      userId: req.user.id,
      quizId,
      courseId: quiz.courseId,
      answers,
      score,
      correctAnswers,
      totalQuestions,
      passed,
      timeTaken,
      attemptNumber: previousAttempts + 1
    });

    let nextTopicId = null;

    if (passed && quiz.topicId) {
      // Mark current topic as completed in Progress
      const [progress] = await Progress.findOrCreate({
        where: { userId: req.user.id, courseId: quiz.courseId, topicId: quiz.topicId },
        defaults: { completed: true, completedAt: new Date() }
      });
      if (!progress.completed) {
        await progress.update({ completed: true, completedAt: new Date() });
      }

      // Mark topic as completed
      await Topic.update(
        { completed: true },
        { where: { id: quiz.topicId } }
      );

      // Find and unlock next topic
      const currentTopic = await Topic.findByPk(quiz.topicId);
      if (currentTopic) {
        const nextTopic = await Topic.findOne({
          where: { courseId: quiz.courseId, order: currentTopic.order + 1 }
        });
        if (nextTopic) {
          // Unlock if still locked (first-time completion)
          if (nextTopic.status === 'locked') {
            await nextTopic.update({ status: 'unlocked' });
          }
          // Always return nextTopicId so frontend navigates forward (including course repeat)
          nextTopicId = nextTopic.id;
        }
      }

      // Update enrollment progress
      const totalTopics = await Topic.count({ where: { courseId: quiz.courseId } });
      const completedCount = await Progress.count({
        where: { userId: req.user.id, courseId: quiz.courseId, completed: true }
      });
      const progressPercentage = totalTopics > 0 ? (completedCount / totalTopics) * 100 : 0;

      const enrollmentRecord = await Enrollment.findOne({
        where: { userId: req.user.id, courseId: quiz.courseId }
      });
      if (enrollmentRecord) {
        enrollmentRecord.progressPercentage = progressPercentage;
        if (progressPercentage === 100) {
          enrollmentRecord.status = 'completed';
          enrollmentRecord.completedAt = new Date();
        } else if (progressPercentage > 0) {
          enrollmentRecord.status = 'in-progress';
        }
        await enrollmentRecord.save();
      }
    }

    res.status(201).json({
      success: true,
      result: {
        id: result.id,
        score,
        correctAnswers,
        totalQuestions,
        passed,
        attemptNumber: result.attemptNumber,
        nextTopicId,
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get quiz results for authenticated student
exports.getMyQuizResults = async (req, res) => {
  try {
    const results = await QuizResult.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Quiz, as: 'quiz' },
        { model: Course, as: 'course' }
      ],
      order: [['submittedAt', 'DESC']]
    });

    res.json({ success: true, results });
  } catch (error) {
    console.error('Get my quiz results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = exports;
