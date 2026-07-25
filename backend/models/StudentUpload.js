const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Documents/files a student uploads to their profile so sponsors can review
// their progress and supporting evidence (e.g. school records, photos, reports).
const StudentUpload = sequelize.define('StudentUpload', {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('document', 'image', 'certificate', 'other'),
    allowNull: false,
    defaultValue: 'document'
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
  tableName: 'student_uploads'
});

module.exports = StudentUpload;
