const { sequelize } = require('../config/database');
const { Admin } = require('../models');

async function addAdminIdToCourses() {
  try {
    console.log('🔄 Starting migration: Adding adminId column to courses table...');

    // Check if the column already exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'courses' AND COLUMN_NAME = 'adminId'
    `);

    if (results.length > 0) {
      console.log('✅ adminId column already exists in courses table');
      process.exit(0);
    }

    // Get the first super admin to use as default
    const superAdmin = await Admin.findOne({ where: { role: 'superadmin' } });

    if (!superAdmin) {
      console.error('❌ No super admin found. Please run seedSuperAdmin.js first.');
      process.exit(1);
    }

    console.log(`📌 Using super admin (${superAdmin.email}) as default creator for existing courses`);

    // Add the adminId column with a default value
    await sequelize.query(`
      ALTER TABLE courses
      ADD COLUMN adminId INTEGER NOT NULL DEFAULT ${superAdmin.id}
    `);

    console.log('✅ adminId column added successfully');

    // Add the foreign key constraint
    await sequelize.query(`
      ALTER TABLE courses
      ADD CONSTRAINT fk_courses_admin
      FOREIGN KEY (adminId)
      REFERENCES admins(id)
      ON DELETE CASCADE
    `);

    console.log('✅ Foreign key constraint added successfully');
    console.log('✅ Migration completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
addAdminIdToCourses();
