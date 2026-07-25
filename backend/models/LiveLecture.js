const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LiveLecture = sequelize.define('LiveLecture', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  scheduledTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  meetingLink: {
    type: DataTypes.STRING,
    allowNull: false
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  topicId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'topics',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'live', 'ended'),
    allowNull: false,
    defaultValue: 'scheduled'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'live_lectures'
});

module.exports = LiveLecture;
