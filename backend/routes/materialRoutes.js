const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.post('/', materialController.createMaterial);
router.get('/', materialController.getMaterials);
router.put('/:id', materialController.updateMaterial);
router.delete('/:id', materialController.deleteMaterial);

module.exports = router;



