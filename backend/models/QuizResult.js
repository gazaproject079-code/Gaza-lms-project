const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const QuizResult = sequelize.define('QuizResult', {
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
  quizId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'quizzes',
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
  answers: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'User submitted answers'
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Score percentage (0-100)'
  },
  correctAnswers: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  totalQuestions: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  passed: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  timeTaken: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Time taken in seconds'
  },
  attemptNumber: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
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
  tableName: 'quiz_results'
});

module.exports = QuizResult;
