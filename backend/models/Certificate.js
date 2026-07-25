const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Certificate = sequelize.define('Certificate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  certificateNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  issuedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  verificationUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  grade: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Final grade or score'
  },
  certificateUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL to certificate PDF/image'
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
  tableName: 'certificates',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'courseId']
    }
  ]
});

module.exports = Certificate;
