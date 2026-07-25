const { sequelize } = require('./config/database');
const models = require('./models');

async function syncDatabase() {
  try {
    console.log('Synchronizing database schema (alter: true)...');
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully!');
  } catch (error) {
    console.error('Error syncing database:', error);
  } finally {
    process.exit(0);
  }
}

syncDatabase();
