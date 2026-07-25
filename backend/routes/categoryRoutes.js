const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, canManageCategories } = require('../middleware/auth');

// Read operations - publicly accessible (no authentication required)
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Write operations - require authentication and canManageCategories permission
router.post('/', authenticateToken, canManageCategories, categoryController.createCategory);
router.put('/:id', authenticateToken, canManageCategories, categoryController.updateCategory);
router.delete('/:id', authenticateToken, canManageCategories, categoryController.deleteCategory);

module.exports = router;



