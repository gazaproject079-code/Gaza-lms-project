const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChannelRead = sequelize.define('ChannelRead', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  channelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  lastReadAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'channel_reads',
  timestamps: false,
  indexes: [{ unique: true, fields: ['userId', 'channelId'] }],
});

module.exports = ChannelRead;
