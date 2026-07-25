/**
 * Email Delivery Test Script
 * Tests email delivery using Brevo HTTP API
 *
 * Usage: node test-email-delivery.js <email_address>
 */

require('dotenv').config();
const { sendOTPEmail } = require('./services/emailService');

const testEmail = process.argv[2];

if (!testEmail) {
  console.log('Usage: node test-email-delivery.js <email_address>');
  console.log('Example: node test-email-delivery.js your-email@gmail.com');
  process.exit(1);
}

console.log('='.repeat(60));
console.log('GazaRise Email Delivery Test (Brevo HTTP API)');
console.log('='.repeat(60));
console.log(`\nTo: ${testEmail}`);
console.log(`From: ${process.env.SMTP_FROM_EMAIL}`);
console.log('');

async function testEmailDelivery() {
  const testCode = Math.floor(100000 + Math.random() * 900000);

  try {
    console.log('Sending test OTP email...\n');
    const result = await sendOTPEmail(testEmail, testCode.toString(), 'Test User');

    console.log('\n' + '='.repeat(60));
    console.log('EMAIL SENT SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`Message ID: ${result.messageId}`);
    console.log(`Test Code: ${testCode}`);

    console.log('\nCheck your email:');
    console.log('1. Wait 1-2 minutes');
    console.log('2. Check INBOX');
    console.log('3. Check SPAM/JUNK folder');
    console.log(`4. Look for subject: "${testCode} is your GazaRise verification code"`);

  } catch (error) {
    console.error('\nEMAIL FAILED:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check BREVO_API_KEY in .env');
    console.log('2. Verify sender email in Brevo dashboard');
  }
}

testEmailDelivery();
