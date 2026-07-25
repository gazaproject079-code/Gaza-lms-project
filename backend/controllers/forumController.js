const { ForumChannel, ForumMessage, User, ChannelRead } = require('../models');
const { Op } = require('sequelize');

exports.getChannels = async (req, res) => {
  try {
    const { role } = req.user;
    
    const userId = req.user.id;
    
    let whereClause = {
      [Op.or]: [
        { type: 'public' },
        { 
          type: 'direct',
          [Op.or]: [
            { directUserId1: userId },
            { directUserId2: userId }
          ]
        }
      ]
    };
    
    if (role === 'instructor' || role === 'superadmin') {
      whereClause[Op.or].push({ type: 'adminOnly' });
      // Admins can also see old legacy channels marked adminOnly
      whereClause[Op.or].push({ adminOnly: true });
    }

    const channels = await ForumChannel.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json(channels);
  } catch (error) {
    console.error('Error fetching forum channels:', error);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
};

exports.createChannel = async (req, res) => {
  try {
    const { name, description, adminOnly, icon } = req.body;
    const { id: userId } = req.user;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    // adminOnly controls messaging (only instructors/admins can send messages)
    // All users can still view the channel
    const isAdminOnly = adminOnly === true || adminOnly === 'true';

    const channel = await ForumChannel.create({
      name: name.trim(),
      description: description || null,
      icon: icon || 'forum',
      adminOnly: isAdminOnly,
      type: 'public', // all channels are publicly visible; adminOnly restricts posting only
      createdBy: userId
    });

    res.status(201).json(channel);
  } catch (error) {
    console.error('Error creating forum channel:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { role } = req.user;

    const channel = await ForumChannel.findByPk(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Access control check
    if (channel.type === 'adminOnly' && role !== 'instructor' && role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. Admin only channel.' });
    }

    if (channel.type === 'direct') {
      if (channel.directUserId1 !== req.user.id && channel.directUserId2 !== req.user.id && role !== 'instructor' && role !== 'superadmin') {
         return res.status(403).json({ error: 'Access denied to this direct message.' });
      }
    }

    const messages = await ForumMessage.findAll({
      where: { channelId },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'email', 'profilePicture', 'role'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

exports.getOrCreateDirectChannel = async (req, res) => {
  try {
    const { targetUserId, courseId, courseName } = req.body;
    const currentUserId = req.user.id;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Each course gets its own channel — encode courseId in the name so same two
    // users can have separate conversations per course (and one general DM).
    const channelName = courseId ? `direct-course-${courseId}` : 'Direct Chat';

    const userPairClause = {
      type: 'direct',
      [Op.or]: [
        { directUserId1: currentUserId, directUserId2: targetUserId },
        { directUserId1: targetUserId, directUserId2: currentUserId }
      ]
    };

    let channel;
    if (courseId) {
      // Course-specific: match exact channel name so histories stay isolated per course.
      channel = await ForumChannel.findOne({
        where: { ...userPairClause, name: channelName },
        order: [['createdAt', 'ASC']],
      });
    } else {
      // General DM: find any non-course channel (covers sponsor-created channels too).
      // Exclude course-specific channels so general history never bleeds into a course thread.
      channel = await ForumChannel.findOne({
        where: { ...userPairClause, name: { [Op.notLike]: 'direct-course-%' } },
        order: [['createdAt', 'ASC']],
      });
    }

    if (!channel) {
      channel = await ForumChannel.create({
        name: channelName,
        description: courseName || `Direct message between ${req.user.name} and ${targetUser.name}`,
        type: 'direct',
        directUserId1: currentUserId,
        directUserId2: targetUserId,
        createdBy: currentUserId
      });
    }

    res.json(channel);
  } catch (error) {
    console.error('Error getting/creating direct channel:', error);
    res.status(500).json({ error: 'Failed to get or create direct channel' });
  }
};

exports.getInstructorsForStudent = async (req, res) => {
  try {
    const { Course, User: UserModel } = require('../models');

    // Return ALL instructors and superadmins with their created courses
    const instructors = await UserModel.findAll({
      where: { role: ['instructor', 'superadmin'] },
      attributes: ['id', 'name', 'email', 'profilePicture', 'role'],
    });

    const instructorsWithCourses = await Promise.all(
      instructors.map(async (instructor) => {
        const courses = await Course.findAll({
          where: { userId: instructor.id },
          attributes: ['id', 'name'],
        });
        return { ...instructor.toJSON(), courses };
      })
    );

    res.json(instructorsWithCourses);
  } catch (error) {
    console.error('Error fetching instructors:', error);
    res.status(500).json({ error: 'Failed to fetch instructors' });
  }
};

exports.getDirectChannels = async (req, res) => {
  try {
    const userId = req.user.id;
    const { User: UserModel } = require('../models');

    const channels = await ForumChannel.findAll({
      where: {
        type: 'direct',
        [Op.or]: [
          { directUserId1: userId },
          { directUserId2: userId }
        ]
      },
      order: [['updatedAt', 'DESC']]
    });

    const enriched = await Promise.all(channels.map(async (ch) => {
      const otherUserId = ch.directUserId1 === userId ? ch.directUserId2 : ch.directUserId1;
      const otherUser = await UserModel.findByPk(otherUserId, {
        attributes: ['id', 'name', 'email', 'role', 'profilePicture']
      });

      // Count messages from the other user that arrived after this user last read the channel
      const readRecord = await ChannelRead.findOne({ where: { userId, channelId: ch.id } });
      const lastReadAt = readRecord ? readRecord.lastReadAt : new Date(0);
      const unreadCount = await ForumMessage.count({
        where: {
          channelId: ch.id,
          senderId: { [Op.ne]: userId },
          createdAt: { [Op.gt]: lastReadAt },
        },
      });

      return { ...ch.toJSON(), otherUser, unreadCount };
    }));

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching direct channels:', error);
    res.status(500).json({ error: 'Failed to fetch direct channels' });
  }
};

exports.getSponsorsForAdmin = async (req, res) => {
  try {
    const { User: UserModel } = require('../models');
    const sponsors = await UserModel.findAll({
      where: { role: 'sponsor', isActive: true },
      attributes: ['id', 'name', 'email', 'profilePicture', 'role'],
    });
    res.json(sponsors);
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    res.status(500).json({ error: 'Failed to fetch sponsors' });
  }
};

exports.getPeersForInstructor = async (req, res) => {
  try {
    const { id: currentUserId } = req.user;
    const { User: UserModel } = require('../models');
    const peers = await UserModel.findAll({
      where: { role: ['instructor', 'superadmin'], id: { [Op.ne]: currentUserId } },
      attributes: ['id', 'name', 'email', 'profilePicture', 'role'],
    });
    res.json(peers);
  } catch (error) {
    console.error('Error fetching peers:', error);
    res.status(500).json({ error: 'Failed to fetch peers' });
  }
};

exports.getStudentsForInstructor = async (req, res) => {
  try {
    const instructorId = req.user.id;
    const { Course, Enrollment, User: UserModel } = require('../models');

    // Find courses created by this instructor
    const courses = await Course.findAll({
      where: { userId: instructorId },
      attributes: ['id']
    });
    const courseIds = courses.map(c => c.id);

    if (courseIds.length === 0) {
      return res.json([]);
    }

    // Find all enrollments for these courseIds, include user (student)
    const enrollments = await Enrollment.findAll({
      where: { courseId: courseIds },
      include: [
        {
          model: UserModel,
          as: 'user', // Student
          attributes: ['id', 'name', 'email', 'profilePicture', 'role']
        }
      ]
    });

    // Extract unique students
    const studentsMap = {};
    enrollments.forEach(e => {
      if (e.user) {
        studentsMap[e.user.id] = e.user;
      }
    });

    res.json(Object.values(studentsMap));
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

// Mark a channel as read (upsert lastReadAt = now)
exports.markChannelRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const channelId = parseInt(req.params.channelId, 10);
    await ChannelRead.upsert({ userId, channelId, lastReadAt: new Date() });
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking channel read:', error);
    res.status(500).json({ error: 'Failed to mark channel as read' });
  }
};
