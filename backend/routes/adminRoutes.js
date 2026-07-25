const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Create admin (super admin only)
router.post('/', requireSuperAdmin, adminController.createAdmin);

// Get all admins (super admin only)
router.get('/', requireSuperAdmin, adminController.getAllAdmins);

// Get admin by ID (super admin only)
router.get('/:id', requireSuperAdmin, adminController.getAdminById);

// Update admin (super admin only)
router.put('/:id', requireSuperAdmin, adminController.updateAdmin);

// Toggle admin active status (super admin only)
router.patch('/:id/toggle-status', requireSuperAdmin, adminController.toggleAdminStatus);

// Update admin permissions (super admin only)
router.patch('/:id/permissions', requireSuperAdmin, adminController.updateAdminPermissions);

// Delete admin (super admin only) - Kept for backward compatibility but not used in UI
router.delete('/:id', requireSuperAdmin, adminController.deleteAdmin);

module.exports = router;



