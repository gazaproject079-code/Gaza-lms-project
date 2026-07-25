require('dotenv').config();
const { sequelize, testConnection } = require('../config/database');
const User = require('../models/User');
const { sendSuperAdminWelcomeEmail } = require('../services/emailService');

const seedSuperAdmin = async () => {
  try {
    // Test connection (this will also create database if needed)
    await testConnection();

    // Sync models (create tables if they don't exist)
    await sequelize.sync({ force: false });
    console.log('✅ Database synced - tables created');

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'gazarisefyp@gmail.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'gazarise@123';

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({
      where: { email: superAdminEmail }
    });

    if (existingSuperAdmin) {
      console.log('ℹ️  Super admin already exists');
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Role: ${existingSuperAdmin.role}`);
      process.exit(0);
    }

    // Create super admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: superAdminEmail,
      password: superAdminPassword,
      role: 'superadmin',
      isActive: true
    });

    console.log('✅ Super admin created successfully!');
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Password: ${superAdminPassword}`);
    console.log(`   Role: ${superAdmin.role}`);

    // Send welcome email to super admin
    console.log('\n📧 Sending welcome email to super admin...');
    try {
      await sendSuperAdminWelcomeEmail(
        superAdmin.email,
        superAdmin.name,
        superAdminPassword
      );
      console.log('✅ Welcome email sent successfully!');
    } catch (emailError) {
      console.log('⚠️  Could not send welcome email:', emailError.message);
      console.log('   (Super admin account was still created)');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding super admin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();

