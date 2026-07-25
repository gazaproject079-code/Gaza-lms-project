/**
 * TEST SCRIPT - Certificate Generation & Email
 *
 * Run this script to test certificate generation and email sending.
 *
 * Usage: node test-certificate.js
 *
 * Before running:
 * 1. Make sure backend dependencies are installed (npm install)
 * 2. Make sure you have an active certificate template
 * 3. Update USER_EMAIL and COURSE_NAME below
 */

require('dotenv').config();

const { sequelize } = require('./config/database');
const { User, Course, Certificate, CertificateTemplate, TemplateCourse } = require('./models');
const { generateCertificateNumber, generateAndSaveCertificate } = require('./services/certificateService');
const { sendCertificateEmail } = require('./services/emailService');

// ============================================
// UPDATE THESE VALUES FOR YOUR TEST
// ============================================
const USER_EMAIL = 'talhadragneel178@gmail.com';
const COURSE_NAME = 'ethical hacking'; // partial match works
// ============================================

async function testCertificate() {
  try {
    console.log('🚀 Starting certificate test...\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Find user
    const user = await User.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('email')),
        USER_EMAIL.toLowerCase()
      )
    });

    if (!user) {
      console.error('❌ User not found:', USER_EMAIL);
      process.exit(1);
    }
    console.log('✅ User found:', user.name, '-', user.email);

    // Find course
    const course = await Course.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('name')),
        sequelize.fn('LOWER', `%${COURSE_NAME}%`)
      )
    });

    // If exact match doesn't work, try LIKE
    const courseResult = course || await Course.findOne({
      where: {
        name: {
          [require('sequelize').Op.like]: `%${COURSE_NAME}%`
        }
      }
    });

    if (!courseResult) {
      console.error('❌ Course not found containing:', COURSE_NAME);
      const allCourses = await Course.findAll({ attributes: ['id', 'name'] });
      console.log('\nAvailable courses:');
      allCourses.forEach(c => console.log(`  - ID ${c.id}: ${c.name}`));
      process.exit(1);
    }
    console.log('✅ Course found:', courseResult.name, '(ID:', courseResult.id + ')');

    // Show all template assignments for this course
    const allAssignments = await TemplateCourse.findAll({
      where: { courseId: courseResult.id },
      include: [{ model: CertificateTemplate, as: 'template', attributes: ['id', 'name'] }]
    });

    if (allAssignments.length > 0) {
      console.log('\n📋 Template assignments for this course:');
      allAssignments.forEach(a => {
        console.log(`   - Template: ${a.template?.name || 'Unknown'} (ID: ${a.templateId}) - Active: ${a.isActive ? 'YES' : 'No'}`);
      });
    } else {
      console.log('\n📋 No specific templates assigned to this course');
    }

    // Get template for this course
    // First check for course-specific active template
    let template = null;
    const courseTemplateAssignment = await TemplateCourse.findOne({
      where: { courseId: courseResult.id, isActive: true }
    });

    if (courseTemplateAssignment) {
      template = await CertificateTemplate.findByPk(courseTemplateAssignment.templateId);
      if (template) {
        console.log('✅ Course-specific template found:', template.name);
        console.log('   - Template ID:', template.id);
        console.log('   - Background:', template.backgroundImage ? 'Yes' : 'No');
        console.log('   - Signature:', template.adminSignature ? 'Yes' : 'No');
      }
    }

    // Fall back to global default active template
    if (!template) {
      template = await CertificateTemplate.findOne({ where: { isActive: true } });
      if (template) {
        console.log('✅ Using default global template:', template.name);
        console.log('   - Template ID:', template.id);
        console.log('   - Background:', template.backgroundImage ? 'Yes' : 'No');
        console.log('   - Signature:', template.adminSignature ? 'Yes' : 'No');
      } else {
        console.log('⚠️  No active template found, using defaults');
      }
    }

    const templateData = template ? template.get({ plain: true }) : null;

    // Generate certificate
    console.log('\n📄 Generating certificate PDF...');
    const certificateNumber = generateCertificateNumber(user.id, courseResult.id);

    const certificateData = {
      studentName: user.name,
      courseName: courseResult.name,
      certificateNumber,
      issueDate: new Date()
    };

    const { pdfBuffer, certificateUrl } = await generateAndSaveCertificate(certificateData, templateData);
    console.log('✅ Certificate generated:', certificateUrl);

    // Save to database
    let certificate = await Certificate.findOne({
      where: { userId: user.id, courseId: courseResult.id }
    });

    if (certificate) {
      certificate.certificateNumber = certificateNumber;
      certificate.certificateUrl = certificateUrl;
      await certificate.save();
      console.log('✅ Certificate record updated in database');
    } else {
      certificate = await Certificate.create({
        userId: user.id,
        courseId: courseResult.id,
        certificateNumber,
        certificateUrl,
        issuedDate: new Date(),
        grade: 'Pass'
      });
      console.log('✅ Certificate record created in database');
    }

    // Send email
    console.log('\n📧 Sending email to:', user.email);
    try {
      await sendCertificateEmail(
        user.email,
        user.name,
        courseResult.name,
        certificateNumber,
        pdfBuffer
      );
      console.log('✅ Email sent successfully!');
    } catch (emailError) {
      console.error('❌ Email failed:', emailError.message);
      console.log('\n⚠️  Check your .env file for email settings:');
      console.log('   EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS');
    }

    console.log('\n🎉 Test completed!');
    console.log('Certificate Number:', certificateNumber);
    console.log('Certificate URL:', certificateUrl);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testCertificate();
