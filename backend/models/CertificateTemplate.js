const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CertificateTemplate = sequelize.define('CertificateTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Default Template'
  },
  backgroundImage: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Optional background design image URL'
  },
  // NOTE: No logoImage field - logo is automatic from assets
  adminSignature: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Admin signature image URL - uploaded by admin'
  },
  primaryColor: {
    type: DataTypes.STRING(20),
    defaultValue: '#4F46E5'
  },
  secondaryColor: {
    type: DataTypes.STRING(20),
    defaultValue: '#22D3EE'
  },
  fontFamily: {
    type: DataTypes.STRING(100),
    defaultValue: 'Arial, sans-serif'
  },
  titleText: {
    type: DataTypes.STRING,
    defaultValue: 'Certificate of Completion'
  },
  subtitleText: {
    type: DataTypes.STRING,
    defaultValue: 'This is to certify that'
  },
  footerText: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'certificate_templates',
  timestamps: true
});

module.exports = CertificateTemplate;
