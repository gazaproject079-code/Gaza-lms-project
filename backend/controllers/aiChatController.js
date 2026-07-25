const { AIChatSession, AIChatMessage } = require('../models');
const openaiService = require('../services/openaiService');

const WELCOME_MESSAGE = "Hello! I'm GazaRise AI, your academic assistant. I can help with studying, coding, writing, research, course questions, and general learning support. I can also format comparisons and settings in tables when useful.";

exports.createSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    const session = await AIChatSession.create({
      userId,
      title: title || 'New Chat',
      lastMessageAt: new Date()
    });

    const welcomeMessage = await AIChatMessage.create({
      sessionId: session.id,
      content: WELCOME_MESSAGE,
      sender: 'ai',
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      session: {
        ...session.toJSON(),
        messages: [welcomeMessage]
      }
    });
  } catch (error) {
    console.error('Create chat session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await AIChatSession.findAll({
      where: { userId },
      order: [['lastMessageAt', 'DESC']],
      include: [{
        model: AIChatMessage,
        as: 'messages',
        limit: 1,
        order: [['timestamp', 'DESC']]
      }]
    });

    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Get chat sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const session = await AIChatSession.findOne({
      where: { id, userId },
      include: [{
        model: AIChatMessage,
        as: 'messages'
      }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    const orderedMessages = (session.messages || [])
      .slice()
      .sort((a, b) => new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt));

    res.json({
      success: true,
      session: {
        ...session.toJSON(),
        messages: orderedMessages
      }
    });
  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const content = req.body.content?.trim();

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const session = await AIChatSession.findOne({
      where: { id, userId },
      include: [{
        model: AIChatMessage,
        as: 'messages'
      }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    const orderedMessages = (session.messages || [])
      .slice()
      .sort((a, b) => new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt));

    const userMessage = await AIChatMessage.create({
      sessionId: id,
      content,
      sender: 'user',
      timestamp: new Date()
    });

    const chatHistory = orderedMessages
      .filter((message) => message.sender === 'user' || message.content !== WELCOME_MESSAGE)
      .slice(-12)
      .map((message) => ({
        sender: message.sender,
        content: message.content
      }));

    let aiResponseContent;
    try {
      const response = await openaiService.answerGeneralChat({
        message: content,
        chatHistory,
        userContext: req.user
      });
      aiResponseContent = response.answer;
    } catch (error) {
      console.error('OpenAI chat generation error:', error);
      aiResponseContent = "I'm having trouble reaching the AI service right now. Please try again in a moment.";
    }

    const aiMessage = await AIChatMessage.create({
      sessionId: id,
      content: aiResponseContent,
      sender: 'ai',
      timestamp: new Date()
    });

    if (session.title === 'New Chat') {
      const newTitle = content.substring(0, 50) + (content.length > 50 ? '...' : '');
      await session.update({ title: newTitle });
    }

    await session.update({ lastMessageAt: new Date() });

    res.json({
      success: true,
      userMessage,
      aiMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title } = req.body;

    const session = await AIChatSession.findOne({
      where: { id, userId }
    });

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    if (title) {
      session.title = title;
    }

    await session.save();

    res.json({ success: true, session });
  } catch (error) {
    console.error('Update chat session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const session = await AIChatSession.findOne({
      where: { id, userId }
    });

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    await AIChatMessage.destroy({
      where: { sessionId: id }
    });

    await session.destroy();

    res.json({ success: true, message: 'Chat session deleted successfully' });
  } catch (error) {
    console.error('Delete chat session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
