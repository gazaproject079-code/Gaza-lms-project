const { sequelize } = require('../config/database');
require('dotenv').config();

async function finalFix() {
  try {
    console.log('🔧 Final Fix: Updating database schema...\n');

    // Step 1: Check current situation
    const [coursesColumns] = await sequelize.query("SHOW COLUMNS FROM courses");
    const hasAdminId = coursesColumns.some(col => col.Field === 'adminId');
    const hasUserId = coursesColumns.some(col => col.Field === 'userId');

    console.log(`Current state: adminId=${hasAdminId}, userId=${hasUserId}\n`);

    if (!hasAdminId && hasUserId) {
      console.log('✓ Database already migrated!');
      console.log('Checking foreign key constraints...\n');

      // Fix any orphaned courses
      const [orphanedCourses] = await sequelize.query(`
        SELECT c.id, c.userId
        FROM courses c
        LEFT JOIN users u ON c.userId = u.id
        WHERE u.id IS NULL
      `);

      if (orphanedCourses.length > 0) {
        console.log(`Found ${orphanedCourses.length} courses with invalid userId`);

        // Get first admin/superadmin user
        const [firstAdmin] = await sequelize.query(`
          SELECT id FROM users WHERE role IN ('admin', 'superadmin') LIMIT 1
        `);

        if (firstAdmin.length > 0) {
          const adminId = firstAdmin[0].id;
          console.log(`Reassigning orphaned courses to user ID: ${adminId}`);

          await sequelize.query(`
            UPDATE courses
            SET userId = ?
            WHERE id IN (${orphanedCourses.map(c => c.id).join(',')})
          `, {
            replacements: [adminId]
          });

          console.log('✓ Orphaned courses reassigned');
        }
      } else {
        console.log('✓ No orphaned courses found');
      }

      // Try to add foreign key constraint
      try {
        await sequelize.query(`
          ALTER TABLE courses
          ADD CONSTRAINT fk_course_user
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        `);
        console.log('✓ Foreign key constraint added');
      } catch (err) {
        if (err.message.includes('Duplicate key')) {
          console.log('✓ Foreign key constraint already exists');
        } else {
          throw err;
        }
      }

      console.log('\n🎉 Database is ready!');
      console.log('\n Restart your server and try creating a course.');
      process.exit(0);
    }

    // If we still have adminId, do the migration
    if (hasAdminId) {
      console.log('Starting migration from adminId to userId...\n');

      // Create users table
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
      console.log('✓ Users table created');

      // Migrate admins to users
      const [adminTables] = await sequelize.query("SHOW TABLES LIKE 'admins'");
      if (adminTables.length > 0) {
        await sequelize.query(`
          INSERT IGNORE INTO users (id, name, email, password, role, isActive, createdAt, updatedAt)
          SELECT id, name, email, password, role, isActive, createdAt, updatedAt
          FROM admins
        `);
        console.log('✓ Admin data migrated to users');
      }

      // Add userId column if doesn't exist
      if (!hasUserId) {
        await sequelize.query(`
          ALTER TABLE courses ADD COLUMN userId INT AFTER categoryId
        `);
        console.log('✓ userId column added');
      }

      // Copy adminId to userId
      await sequelize.query(`
        UPDATE courses SET userId = adminId WHERE userId IS NULL OR userId = 0
      `);
      console.log('✓ Data copied from adminId to userId');

      // Drop foreign key constraints
      const constraintNames = ['courses_ibfk_2', 'fk_courses_admin', 'courses_adminId_fkey'];
      for (const constraintName of constraintNames) {
        try {
          await sequelize.query(`ALTER TABLE courses DROP FOREIGN KEY ${constraintName}`);
          console.log(`✓ Dropped constraint: ${constraintName}`);
        } catch (err) {
          // Constraint doesn't exist
        }
      }

      // Drop adminId column
      await sequelize.query(`ALTER TABLE courses DROP COLUMN adminId`);
      console.log('✓ adminId column dropped');

      // Add foreign key
      await sequelize.query(`
        ALTER TABLE courses
        ADD CONSTRAINT fk_course_user
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('✓ Foreign key constraint added');

      console.log('\n🎉 Migration completed!');
      console.log('\nRestart your server and try creating a course.');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Fix failed:', error.message);
    console.log('\nManual SQL commands to fix:');
    console.log('1. Check foreign keys: SHOW CREATE TABLE courses;');
    console.log('2. Drop all foreign keys related to adminId');
    console.log('3. Drop adminId column: ALTER TABLE courses DROP COLUMN adminId;');
    console.log('4. Add foreign key: ALTER TABLE courses ADD CONSTRAINT fk_course_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;');
    process.exit(1);
  }
}

finalFix();
