const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DailyActivity = sequelize.define('DailyActivity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  activityDate: {
    type: DataTypes.DATEONLY, // stored as 'YYYY-MM-DD'
    allowNull: false,
  },
}, {
  tableName: 'daily_activities',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'activityDate'],
    },
  ],
});

module.exports = DailyActivity;
