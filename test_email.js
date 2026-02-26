require('dotenv').config();
const { sendWelcomeEmail } = require('./src/services/mailService');

async function testEmail() {
  console.log('🧪 Starting Email Test...');
  console.log('📍 EMAIL_USER:', process.env.EMAIL_USER || 'MISSING');
  console.log('📍 EMAIL_PASS:', process.env.EMAIL_PASS ? 'FOUND (HIDDEN)' : 'MISSING');

  const testEmail = 'jmaulik21@gmail.com';
  const testName = 'Test User';

  const result = await sendWelcomeEmail(testEmail, testName);

  if (result) {
    console.log('\n✅ TEST SUCCESS: Email service seems to be configured correctly.');
  } else {
    console.log('\n❌ TEST FAILED: Check the error logs above for details.');
  }
}

testEmail();
