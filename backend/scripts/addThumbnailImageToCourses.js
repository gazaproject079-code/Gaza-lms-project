const { sequelize } = require('../config/database');

async function addThumbnailImageColumn() {
  try {
    console.log('Adding thumbnailImage column to courses table...');

    // Add the thumbnailImage column
    await sequelize.query(`
      ALTER TABLE courses
      ADD COLUMN thumbnailImage VARCHAR(255) DEFAULT NULL
    `);

    console.log('✅ thumbnailImage column added successfully!');
    process.exit(0);
  } catch (error) {
    // If column already exists, just warn
    if (error.message.includes('Duplicate column name') || error.message.includes('already exists')) {
      console.log('⚠️  thumbnailImage column already exists, skipping...');
      process.exit(0);
    }

    console.error('❌ Error adding thumbnailImage column:', error.message);
    process.exit(1);
  }
}

addThumbnailImageColumn();
