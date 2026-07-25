const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { authenticateToken } = require('../middleware/auth');

// All enrollment routes require authentication
router.use(authenticateToken);

// Get student's enrollments
router.get('/my', enrollmentController.getMyEnrollments);

// Enroll in a course
router.post('/', enrollmentController.enrollInCourse);

// Unenroll from a course
router.delete('/:courseId', enrollmentController.unenrollFromCourse);

// Check enrollment status
router.get('/check/:courseId', enrollmentController.checkEnrollment);

// Update enrollment progress
router.put('/progress', enrollmentController.updateEnrollmentProgress);

module.exports = router;
