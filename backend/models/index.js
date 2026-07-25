const User = require('./User');
const Category = require('./Category');
const Course = require('./Course');
const Topic = require('./Topic');
const Material = require('./Material');
const Feedback = require('./Feedback');
const Enrollment = require('./Enrollment');
const Progress = require('./Progress');
const Quiz = require('./Quiz');
const QuizResult = require('./QuizResult');
const Certificate = require('./Certificate');
const CertificateTemplate = require('./CertificateTemplate');
const TemplateCourse = require('./TemplateCourse');
const Notification = require('./Notification');
const AIChatSession = require('./AIChatSession');
const AIChatMessage = require('./AIChatMessage');
const DailyActivity = require('./DailyActivity');
const Todo = require('./Todo');
const LibraryItem = require('./LibraryItem');
const ForumChannel = require('./ForumChannel');
const ForumMessage = require('./ForumMessage');
const ChannelRead = require('./ChannelRead');
const Sponsorship = require('./Sponsorship');
const StudentUpload = require('./StudentUpload');
const LiveLecture = require('./LiveLecture');
const Recording = require('./Recording');
const { sequelize } = require('../config/database');

User.hasMany(Course, { foreignKey: 'userId', as: 'courses', onDelete: 'CASCADE' });
Course.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });

Course.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Course, { foreignKey: 'categoryId', as: 'courses' });

Topic.belongsTo(Course, { foreignKey: 'courseId', as: 'course', onDelete: 'CASCADE' });
Course.hasMany(Topic, { foreignKey: 'courseId', as: 'topics', onDelete: 'CASCADE' });

Material.belongsTo(Course, { foreignKey: 'courseId', as: 'course', onDelete: 'CASCADE' });
Course.hasMany(Material, { foreignKey: 'courseId', as: 'materials', onDelete: 'CASCADE' });
Material.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic', onDelete: 'CASCADE' });
Topic.hasMany(Material, { foreignKey: 'topicId', as: 'materials', onDelete: 'CASCADE' });

Feedback.belongsTo(Course, { foreignKey: 'courseId', as: 'course', onDelete: 'CASCADE' });
Course.hasMany(Feedback, { foreignKey: 'courseId', as: 'feedbacks', onDelete: 'CASCADE' });
Feedback.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic', onDelete: 'CASCADE' });
Topic.hasMany(Feedback, { foreignKey: 'topicId', as: 'feedbacks', onDelete: 'CASCADE' });
Feedback.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'SET NULL' });
User.hasMany(Feedback, { foreignKey: 'userId', as: 'submittedFeedbacks', onDelete: 'SET NULL' });

User.hasMany(Enrollment, { foreignKey: 'userId', as: 'enrollments', onDelete: 'CASCADE' });
Enrollment.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments', onDelete: 'CASCADE' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course', onDelete: 'CASCADE' });

User.hasMany(Progress, { foreignKey: 'userId', as: 'progress', onDelete: 'CASCADE' });
Progress.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
Course.hasMany(Progress, { foreignKey: 'courseId', as: 'progress', onDelete: 'CASCADE' });
Progress.belongsTo(Course, { foreignKey: 'courseId', as: 'course', onDelete: 'CASCADE' });
Topic.hasMany(Progress, { foreignKey: 'topicId', as: 'progress', onDelete: 'CASCADE' });
Progress.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic', onDelete: 'CASCADE' });

Course.hasMany(Quiz, { foreignKey: 'courseId', as: 'quizzes', onDelete: 'CASCADE' });
Quiz.belongsTo(Course, { foreignKey: 'courseId', as: 'course', onDelete: 'CASCADE' });
Topic.hasMany(Quiz, { foreignKey: 'topicId', as: 'quizzes', onDelete: 'CASCADE' });
Quiz.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic', onDelete: 'SET NULL' });

User.hasMany(QuizResult, { foreignKey: 'userId', as: 'quizResults', onDelete: 'CASCADE' });
QuizResult.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
Quiz.hasMany(QuizResult, { foreignKey: 'quizId', as: 'results', onDelete: 'CASCADE' });
QuizResult.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz', onDelete: 'CASCADE' });
Course.hasMany(QuizResult, { foreignKey: 'courseId', as: 'quizResults', onDelete: 'CASCADE' });
QuizResult.belongsTo(Course, { foreignKey: 'courseId', as: 'course', onDelete: 'CASCADE' });

User.hasMany(Certificate, { foreignKey: 'userId', as: 'certificates', onDelete: 'CASCADE' });
Certificate.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
Course.hasMany(Certificate, { foreignKey: 'courseId', as: 'certificates', onDelete: 'CASCADE' });
Certificate.belongsTo(Course, { foreignKey: 'courseId', as: 'course', onDelete: 'CASCADE' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });

User.hasMany(CertificateTemplate, { foreignKey: 'createdBy', as: 'certificateTemplates', onDelete: 'SET NULL' });
CertificateTemplate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator', onDelete: 'SET NULL' });
CertificateTemplate.belongsToMany(Course, {
  through: TemplateCourse,
  foreignKey: 'templateId',
  otherKey: 'courseId',
  as: 'courses',
});
Course.belongsToMany(CertificateTemplate, {
  through: TemplateCourse,
  foreignKey: 'courseId',
  otherKey: 'templateId',
  as: 'certificateTemplates',
});
TemplateCourse.belongsTo(CertificateTemplate, { foreignKey: 'templateId', as: 'template' });
TemplateCourse.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
CertificateTemplate.hasMany(TemplateCourse, { foreignKey: 'templateId', as: 'templateCourses' });
Course.hasMany(TemplateCourse, { foreignKey: 'courseId', as: 'templateCourses' });

User.hasMany(AIChatSession, { foreignKey: 'userId', as: 'chatSessions', onDelete: 'CASCADE' });
AIChatSession.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
AIChatSession.hasMany(AIChatMessage, { foreignKey: 'sessionId', as: 'messages', onDelete: 'CASCADE' });
AIChatMessage.belongsTo(AIChatSession, { foreignKey: 'sessionId', as: 'session', onDelete: 'CASCADE' });

User.hasMany(Todo, { foreignKey: 'userId', as: 'todos', onDelete: 'CASCADE' });
Todo.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
User.hasMany(DailyActivity, { foreignKey: 'userId', as: 'dailyActivities', onDelete: 'CASCADE' });
DailyActivity.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });

User.hasMany(LibraryItem, { foreignKey: 'uploadedBy', as: 'uploadedLibraryItems' });
LibraryItem.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
User.hasMany(LibraryItem, { foreignKey: 'approvedBy', as: 'approvedLibraryItems' });
LibraryItem.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

User.hasMany(ForumChannel, { foreignKey: 'createdBy', as: 'forumChannels' });
ForumChannel.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

ForumChannel.hasMany(ForumMessage, { foreignKey: 'channelId', as: 'messages', onDelete: 'CASCADE' });
ForumMessage.belongsTo(ForumChannel, { foreignKey: 'channelId', as: 'channel', onDelete: 'CASCADE' });

User.hasMany(ForumMessage, { foreignKey: 'senderId', as: 'forumMessages', onDelete: 'CASCADE' });
ForumMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender', onDelete: 'CASCADE' });

User.hasMany(Sponsorship, { foreignKey: 'sponsorId', as: 'sponsoredStudents', onDelete: 'CASCADE' });
Sponsorship.belongsTo(User, { foreignKey: 'sponsorId', as: 'sponsor', onDelete: 'CASCADE' });

User.hasMany(Sponsorship, { foreignKey: 'studentId', as: 'sponsors', onDelete: 'CASCADE' });
Sponsorship.belongsTo(User, { foreignKey: 'studentId', as: 'student', onDelete: 'CASCADE' });

ForumChannel.belongsTo(User, { foreignKey: 'directUserId1', as: 'directUser1' });
ForumChannel.belongsTo(User, { foreignKey: 'directUserId2', as: 'directUser2' });

User.hasMany(StudentUpload, { foreignKey: 'userId', as: 'uploads', onDelete: 'CASCADE' });
StudentUpload.belongsTo(User, { foreignKey: 'userId', as: 'student', onDelete: 'CASCADE' });

Course.hasMany(LiveLecture, { foreignKey: 'courseId', as: 'liveLectures', onDelete: 'CASCADE' });
LiveLecture.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Topic.hasOne(LiveLecture, { foreignKey: 'topicId', as: 'liveLecture', onDelete: 'CASCADE' });
LiveLecture.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic' });

Course.hasMany(Recording, { foreignKey: 'courseId', as: 'recordings', onDelete: 'CASCADE' });
Recording.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Topic.hasOne(Recording, { foreignKey: 'topicId', as: 'recording', onDelete: 'CASCADE' });
Recording.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic' });

module.exports = {
  sequelize,
  User,
  Category,
  Course,
  Topic,
  Material,
  Feedback,
  Enrollment,
  Progress,
  Quiz,
  QuizResult,
  Certificate,
  CertificateTemplate,
  TemplateCourse,
  Notification,
  AIChatSession,
  AIChatMessage,
  DailyActivity,
  Todo,
  LibraryItem,
  ForumChannel,
  ForumMessage,
  Sponsorship,
  StudentUpload,
  LiveLecture,
  Recording,
  ChannelRead,
};
