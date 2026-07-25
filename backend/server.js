const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { sequelize, testConnection } = require('./config/database');
require('./models');
const { User } = require('./models');
const { sendSuperAdminWelcomeEmail } = require('./services/emailService');
const syncCourseColumns = require('./scripts/syncCourseColumns');

const migrateAdminToInstructor = require('./scripts/migrateAdminToInstructor');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const courseRoutes = require('./routes/courseRoutes');
const topicRoutes = require('./routes/topicRoutes');
const materialRoutes = require('./routes/materialRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const progressRoutes = require('./routes/progressRoutes');
const quizRoutes = require('./routes/quizRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const certificateTemplateRoutes = require('./routes/certificateTemplateRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiChatRoutes = require('./routes/aiChatRoutes');
const streakRoutes = require('./routes/streakRoutes');
const todoRoutes = require('./routes/todoRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const forumRoutes = require('./routes/forumRoutes');
const sponsorshipRoutes = require('./routes/sponsorshipRoutes');
const studentUploadRoutes = require('./routes/studentUploadRoutes');
const liveLectureRoutes = require('./routes/liveLectureRoutes');
const recordingRoutes = require('./routes/recordingRoutes');
const { initScheduledReminders } = require('./controllers/todoController');

const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO for Forum functionality
io.on('connection', (socket) => {
  console.log('A user connected via socket:', socket.id);

  socket.on('joinChannel', (channelId) => {
    socket.join(`channel_${channelId}`);
    console.log(`Socket ${socket.id} joined channel_${channelId}`);
  });

  socket.on('leaveChannel', (channelId) => {
    socket.leave(`channel_${channelId}`);
    console.log(`Socket ${socket.id} left channel_${channelId}`);
  });

  socket.on('sendMessage', async (data) => {
    const { channelId, senderId, content } = data;
    try {
      const { ForumMessage, ForumChannel, User } = require('./models');

      // Check if this is an instructor-only posting channel
      const channel = await ForumChannel.findByPk(channelId);
      if (channel?.adminOnly) {
        const sender = await User.findByPk(senderId, { attributes: ['role'] });
        const role = sender?.role;
        if (role !== 'instructor' && role !== 'superadmin') {
          socket.emit('messageDenied', { reason: 'Only instructors can post in this channel.' });
          return;
        }
      }

      const message = await ForumMessage.create({ channelId, senderId, content });

      const messageWithSender = await ForumMessage.findByPk(message.id, {
        include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'email', 'profilePicture', 'role'] }]
      });

      io.to(`channel_${channelId}`).emit('newMessage', messageWithSender);
    } catch (error) {
      console.error('Error saving/emitting socket message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}));

async function initSuperAdmin() {
  try {
    const superadminEmail = process.env.SUPER_ADMIN_EMAIL;
    const superadminPassword = process.env.SUPER_ADMIN_PASSWORD;
    const superadminName = process.env.SUPER_ADMIN_NAME || 'Super Admin';

    if (!superadminEmail || !superadminPassword) {
      console.log('SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in .env - skipping superadmin creation');
      return;
    }

    const existingSuperAdmin = await User.findOne({ where: { role: 'superadmin' } });

    if (!existingSuperAdmin) {
      await User.create({
        name: superadminName,
        email: superadminEmail,
        password: superadminPassword,
        role: 'superadmin',
        isActive: true,
        emailVerified: true,
        authProvider: 'local'
      });
      console.log('SuperAdmin created successfully');
      console.log(`Email: ${superadminEmail}`);

      try {
        await sendSuperAdminWelcomeEmail(superadminEmail, superadminName, superadminPassword);
        console.log('Welcome email sent to SuperAdmin');
      } catch (emailError) {
        console.log('Could not send welcome email:', emailError.message);
      }
    } else {
      console.log('SuperAdmin already exists');
    }
  } catch (error) {
    console.error('Error creating SuperAdmin:', error.message);
  }
}

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/certificate-templates', certificateTemplateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/sponsorships', sponsorshipRoutes);
app.use('/api/student-uploads', studentUploadRoutes);
app.use('/api/live-lectures', liveLectureRoutes);
app.use('/api/recordings', recordingRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

async function startServer() {
  try {
    await testConnection();
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }

  try { await syncCourseColumns(); } catch (e) { console.error('syncCourseColumns failed (non-fatal):', e.message); }
  try { await migrateAdminToInstructor(); } catch (e) { console.error('migrateAdminToInstructor failed (non-fatal):', e.message); }
  try { await initSuperAdmin(); } catch (e) { console.error('initSuperAdmin failed (non-fatal):', e.message); }

  try { await initScheduledReminders(); } catch (e) { console.error('initScheduledReminders failed (non-fatal):', e.message); }

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

module.exports = app;
