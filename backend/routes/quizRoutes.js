const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { authenticateToken } = require('../middleware/auth');

// All quiz routes require authentication
router.use(authenticateToken);

// Get all quizzes with optional filters
router.get('/', quizController.getQuizzes);

// Get quizzes by course
router.get('/course/:courseId', quizController.getQuizzesByCourse);

// Get quiz by topic ID
router.get('/topic/:topicId', quizController.getQuizByTopic);

// Get quiz by ID
router.get('/:id', quizController.getQuizById);

// Submit quiz
router.post('/submit', quizController.submitQuiz);

// Get student's quiz results
router.get('/results/my', quizController.getMyQuizResults);
router.get('/results', quizController.getMyQuizResults);

module.exports = router;
