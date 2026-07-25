const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/my', todoController.getTodos);
router.post('/', todoController.createTodo);
router.patch('/:id/toggle', todoController.toggleTodo);
router.delete('/:id', todoController.deleteTodo);

module.exports = router;
