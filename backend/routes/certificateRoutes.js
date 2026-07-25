const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authenticateToken, requireAdmin, canManageCertificates } = require('../middleware/auth');

// Get student's certificates (requires authentication)
router.get('/my', authenticateToken, certificateController.getMyCertificates);

// Admin/superadmin certificate management routes
router.get('/all', authenticateToken, requireAdmin, canManageCertificates, certificateController.getAllCertificates);

// Generate certificate (requires authentication)
router.post('/', authenticateToken, certificateController.generateCertificate);

// Verify certificate (public route)
router.get('/verify/:certificateNumber', certificateController.verifyCertificate);

// Admin/superadmin certificate detail routes
router.get('/:id', authenticateToken, requireAdmin, canManageCertificates, certificateController.getCertificateById);
router.delete('/:id', authenticateToken, requireAdmin, canManageCertificates, certificateController.deleteCertificate);

module.exports = router;
