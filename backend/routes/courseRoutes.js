const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateToken } = require('../middleware/auth');

// Read operations - publicly accessible (no authentication required)
router.get('/', courseController.getAllCourses);
router.get('/top', courseController.getTopCourses); // must be before /:id
router.get('/:id', courseController.getCourseById);

// Write operations - require authentication
router.post('/', authenticateToken, courseController.createCourse);
router.put('/:id', authenticateToken, courseController.updateCourse);
router.delete('/:id', authenticateToken, courseController.deleteCourse);
router.patch('/:id/publish', authenticateToken, courseController.publishCourse);

module.exports = router;



