const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.post('/', topicController.createTopic);
router.get('/course/:courseId', topicController.getTopicsByCourse);
router.put('/:id', topicController.updateTopic);
router.delete('/:id', topicController.deleteTopic);

module.exports = router;



