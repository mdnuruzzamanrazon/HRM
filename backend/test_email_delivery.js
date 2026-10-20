import dotenv from 'dotenv';
dotenv.config();

import { sendVerificationCodeEmail, diagnoseEmailConfiguration } from './src/services/emailService.js';

async function testEmailDelivery() {
  console.log('====================================================');
  console.log('       TESTING EMAIL DELIVERY TO GMAIL');
  console.log('====================================================');
  
  const recipient = process.argv[2] || 'nuruzzamanrazon62@gmail.com';
  console.log(`Recipient: ${recipient}`);

  console.log('\n--- Step 1: Checking Email Diagnostics ---');
  const diagnostics = await diagnoseEmailConfiguration();
  console.log(JSON.stringify(diagnostics, null, 2));

  if (!diagnostics.hasCredentials && process.env.NODE_ENV === 'production') {
    console.error('\n[ERROR] No email credentials detected in environment variables.');
    console.error('Please configure RESEND_API_KEY or SMTP_USER & SMTP_PASS.');
    process.exit(1);
  }

  console.log('\n--- Step 2: Dispatching Test Verification Code ---');
  const testCode = '849201';
  try {
    const result = await sendVerificationCodeEmail({
      to: recipient,
      code: testCode,
      expiresInMinutes: 10,
      employeeName: 'Nuruzzaman Razon'
    });
    console.log('\n[SUCCESS] Verification email accepted for delivery:');
    console.log(JSON.stringify(result, null, 2));
    console.log(`\nPlease check ${recipient} inbox and spam folder for 6-digit code: ${testCode}`);
  } catch (err) {
    console.error('\n[FAILURE] Email dispatch failed:');
    console.error(err.message);
    process.exit(1);
  }
}

testEmailDelivery();
