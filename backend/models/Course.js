const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  level: {
    type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
    allowNull: false
  },
  language: {
    type: DataTypes.ENUM('English', 'Urdu'),
    allowNull: false,
    defaultValue: 'English'
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'published'),
    defaultValue: 'draft'
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  thumbnailImage: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  creationMode: {
    type: DataTypes.ENUM('ai', 'manual'),
    allowNull: false,
    defaultValue: 'manual'
  },
  deliveryMode: {
    type: DataTypes.ENUM('recorded', 'live', 'topic-wise'),
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
  tableName: 'courses'
});

module.exports = Course;


