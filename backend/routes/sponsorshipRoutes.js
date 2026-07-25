const express = require('express');
const router = express.Router();
const sponsorshipController = require('../controllers/sponsorshipController');
const { authenticateToken } = require('../middleware/auth');

// All sponsorship routes require authentication
router.use(authenticateToken);

// Get available students (public to authenticated users, mainly sponsors)
router.get('/available-students', sponsorshipController.getAvailableStudents);

// Sponsor a student (Sponsors only - though logic handled in controller)
router.post('/sponsor/:studentId', sponsorshipController.sponsorStudent);

// Get sponsored students (For a sponsor)
router.get('/my-students', sponsorshipController.getMySponsoredStudents);

// Get my sponsors (for a student — returns sponsors who have sponsored them)
router.get('/my-sponsors', sponsorshipController.getMySponsors);

// Get student profile details
router.get('/student-profile/:studentId', sponsorshipController.getStudentProfile);

module.exports = router;
