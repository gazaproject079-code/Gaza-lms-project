const { sequelize } = require('../config/database');
require('dotenv').config();

/**
 * Migration script to transition from Admin table to User table
 * This script:
 * 1. Migrates data from admins table to users table
 * 2. Updates courses table to use userId instead of adminId
 * 3. Creates new student-related tables
 */

async function migrateDatabase() {
  try {
    console.log('🔄 Starting database migration...');

    // Check if admins table exists
    const [tables] = await sequelize.query(
      "SHOW TABLES LIKE 'admins'"
    );

    if (tables.length > 0) {
      console.log('📋 Admins table found. Starting migration...');

      // Create users table if it doesn't exist
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          phone VARCHAR(255),
          role ENUM('student', 'expert', 'admin', 'superadmin') DEFAULT 'student',
          isActive TINYINT(1) DEFAULT 1,
          profilePicture VARCHAR(255),
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ Users table created');

      // Migrate data from admins to users
      await sequelize.query(`
        INSERT INTO users (id, name, email, password, role, isActive, createdAt, updatedAt)
        SELECT id, name, email, password, role, isActive, createdAt, updatedAt
        FROM admins
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.email = admins.email)
      `);

      console.log('✅ Admin data migrated to users table');

      // Check if courses table has adminId column
      const [columns] = await sequelize.query(
        "SHOW COLUMNS FROM courses LIKE 'adminId'"
      );

      if (columns.length > 0) {
        console.log('📋 Updating courses table...');

        // Add userId column if it doesn't exist
        await sequelize.query(`
          ALTER TABLE courses
          ADD COLUMN IF NOT EXISTS userId INT AFTER categoryId
        `).catch(() => {
          // Column might already exist
          console.log('userId column already exists or cannot be added');
        });

        // Copy data from adminId to userId
        await sequelize.query(`
          UPDATE courses SET userId = adminId WHERE userId IS NULL
        `);

        // Drop foreign key constraint on adminId
        await sequelize.query(`
          ALTER TABLE courses DROP FOREIGN KEY IF EXISTS courses_ibfk_2
        `).catch(() => {
          console.log('Foreign key constraint might not exist');
        });

        // Drop adminId column
        await sequelize.query(`
          ALTER TABLE courses DROP COLUMN IF EXISTS adminId
        `).catch(() => {
          console.log('adminId column might not exist');
        });

        // Add foreign key for userId
        await sequelize.query(`
          ALTER TABLE courses
          ADD CONSTRAINT fk_course_user
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        `).catch(() => {
          console.log('Foreign key constraint might already exist');
        });

        console.log('✅ Courses table updated');
      }

      console.log('📋 Renaming admins table to admins_backup...');
      await sequelize.query('RENAME TABLE admins TO admins_backup');
      console.log('✅ Admins table renamed to admins_backup');
    }

    // Sync all models (creates new tables)
    console.log('📋 Creating student-related tables...');
    await sequelize.sync({ alter: false });
    console.log('✅ All tables synced successfully');

    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Login with existing credentials (they have been migrated)');
    console.log('3. You can safely drop admins_backup table after verifying the migration');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateDatabase();
