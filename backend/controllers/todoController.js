const { Todo, User } = require('../models');
const { sendReminderEmail } = require('../services/emailService');

// In-memory map of scheduled timers: todoId -> { emailTimer, expiryTimer }
const scheduledTimers = new Map();

const clearTimers = (todoId) => {
  const timers = scheduledTimers.get(todoId);
  if (timers) {
    clearTimeout(timers.emailTimer);
    clearTimeout(timers.expiryTimer);
    scheduledTimers.delete(todoId);
  }
};

const scheduleReminder = async (todo, userEmail, userName) => {
  if (!todo.scheduledAt) return;
  clearTimers(todo.id);

  const now = Date.now();
  const scheduledTime = new Date(todo.scheduledAt).getTime();
  const emailTime = scheduledTime - 30 * 60 * 1000; // 30 min before

  const timers = {};

  // Schedule email 30 min before
  const emailDelay = emailTime - now;
  if (emailDelay > 0) {
    timers.emailTimer = setTimeout(async () => {
      try {
        const current = await Todo.findByPk(todo.id);
        if (current && current.status === 'pending') {
          await sendReminderEmail(userEmail, userName, current.text, current.scheduledAt);
          await current.update({ status: 'sent' });
          console.log(`✅ Reminder email sent for todo ${todo.id}`);
        }
      } catch (err) {
        console.error(`❌ Failed to send reminder email for todo ${todo.id}:`, err.message);
      }
    }, emailDelay);
  } else if (scheduledTime > now) {
    // Less than 30 min away — send email immediately if not already sent
    try {
      const current = await Todo.findByPk(todo.id);
      if (current && current.status === 'pending') {
        await sendReminderEmail(userEmail, userName, current.text, current.scheduledAt);
        await current.update({ status: 'sent' });
        console.log(`✅ Immediate reminder email sent for todo ${todo.id} (< 30 min away)`);
      }
    } catch (err) {
      console.error(`❌ Failed to send immediate reminder email for todo ${todo.id}:`, err.message);
    }
  }

  // Schedule expiry at scheduled time
  const expiryDelay = scheduledTime - now;
  if (expiryDelay > 0) {
    timers.expiryTimer = setTimeout(async () => {
      try {
        const current = await Todo.findByPk(todo.id);
        if (current && current.status !== 'completed') {
          await current.update({ status: 'expired' });
          console.log(`⏰ Todo ${todo.id} marked as expired`);
        }
      } catch (err) {
        console.error(`❌ Failed to expire todo ${todo.id}:`, err.message);
      }
      scheduledTimers.delete(todo.id);
    }, expiryDelay);
  }

  if (Object.keys(timers).length > 0) {
    scheduledTimers.set(todo.id, timers);
  }
};

// Called on server start to reschedule existing pending reminders
const initScheduledReminders = async () => {
  try {
    const { Op } = require('sequelize');
    const pendingTodos = await Todo.findAll({
      where: {
        scheduledAt: { [Op.gt]: new Date() },
        status: ['pending', 'sent'],
      },
      include: [{ model: User, as: 'user', attributes: ['email', 'name'] }],
    });

    for (const todo of pendingTodos) {
      if (todo.user) {
        await scheduleReminder(todo, todo.user.email, todo.user.name);
      }
    }
    console.log(`✅ Rescheduled ${pendingTodos.length} pending reminder(s) on server start`);
  } catch (err) {
    console.error('❌ Failed to init scheduled reminders:', err.message);
  }
};

// GET /api/todos/my
exports.getTodos = async (req, res) => {
  try {
    const todos = await Todo.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, todos });
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/todos
exports.createTodo = async (req, res) => {
  try {
    const { text, type, scheduledAt } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Todo text is required' });
    }

    const todo = await Todo.create({
      userId: req.user.id,
      text: text.trim(),
      type: type || 'reminder',
      scheduledAt: scheduledAt || null,
      status: 'pending',
    });

    // Schedule email + expiry if scheduledAt provided
    if (scheduledAt) {
      const user = await User.findByPk(req.user.id, { attributes: ['email', 'name'] });
      if (user) {
        await scheduleReminder(todo, user.email, user.name);
      }
    }

    res.status(201).json({ success: true, todo });
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PATCH /api/todos/:id/toggle
exports.toggleTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    todo.completed = !todo.completed;
    todo.completedAt = todo.completed ? new Date() : null;
    todo.status = todo.completed ? 'completed' : 'pending';
    await todo.save();

    // If marking complete, cancel scheduled timers
    if (todo.completed) {
      clearTimers(todo.id);
    } else if (todo.scheduledAt && new Date(todo.scheduledAt) > new Date()) {
      // Re-schedule if unchecked and still in future
      const user = await User.findByPk(req.user.id, { attributes: ['email', 'name'] });
      if (user) await scheduleReminder(todo, user.email, user.name);
    }

    res.json({ success: true, todo });
  } catch (error) {
    console.error('Toggle todo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/todos/:id
exports.deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    clearTimers(todo.id);
    await todo.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.initScheduledReminders = initScheduledReminders;
