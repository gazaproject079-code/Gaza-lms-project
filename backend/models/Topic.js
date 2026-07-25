const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Topic = sequelize.define('Topic', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('locked', 'unlocked', 'completed'),
    defaultValue: 'locked'
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  topicType: {
    type: DataTypes.ENUM('recorded', 'live'),
    allowNull: false,
    defaultValue: 'recorded'
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
  tableName: 'topics'
});

module.exports = Topic;



