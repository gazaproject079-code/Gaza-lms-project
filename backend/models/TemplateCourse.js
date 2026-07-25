const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TemplateCourse = sequelize.define('TemplateCourse', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  templateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'certificate_templates',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this template is active for this specific course'
  }
}, {
  tableName: 'template_courses',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['templateId', 'courseId']
    }
  ]
});

module.exports = TemplateCourse;
