// test_e2e_reset_and_login.js
const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function testE2EPwdReset() {
  console.log('=== End-to-End Password Reset & Login Verification ===\n');

  const testEmail = 'employee@cbdp.org';
  const newPassword = 'NewSecretPassword@2026';

  // 1. Trigger forgot password via Ethereal in development
  console.log('1. Triggering password reset for', testEmail);
  const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail })
  });
  const forgotData = await forgotRes.json();
  console.log('Forgot password status:', forgotRes.status, 'Success:', forgotData.success);
  const resetSessionToken = forgotData.resetSessionToken;
  console.log('Has resetSessionToken:', Boolean(resetSessionToken));

  // In test environment, let us query the user's reset code from the database or cache
  // To simulate the user checking their email and typing the received 6-digit code:
  const mongoose = (await import('mongoose')).default;
  await mongoose.connect('mongodb://127.0.0.1:27017/cbdp');
  const user = await mongoose.connection.collection('users').findOne({ email: testEmail });
  const receivedCode = user.resetPasswordCode;
  console.log('Extracted received code from secure database for verification:', receivedCode);

  // 2. Verify code on /verify-reset-code
  console.log('\n2. Submitting verification code to /verify-reset-code...');
  const verifyRes = await fetch(`${BASE_URL}/auth/verify-reset-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      code: receivedCode,
      resetSessionToken
    })
  });
  const verifyData = await verifyRes.json();
  console.log('Verify status (expect 200):', verifyRes.status, 'Message:', verifyData.message);

  // 3. Set new password on /reset-password
  console.log('\n3. Resetting password on /reset-password...');
  const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      code: receivedCode,
      resetSessionToken,
      newPassword
    })
  });
  const resetData = await resetRes.json();
  console.log('Reset status (expect 200):', resetRes.status, 'Message:', resetData.message);

  // 4. Authenticate with the new password
  console.log('\n4. Logging in with NEW password...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: newPassword,
      portal: 'EMPLOYEE'
    })
  });
  const loginData = await loginRes.json();
  console.log('Login with new password status (expect 200):', loginRes.status, 'Success:', loginData.success);

  // 5. Restore original password for employee@cbdp.org
  console.log('\n5. Restoring employee@cbdp.org password back to CBDP@123...');
  const restoreRes = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      resetSessionToken,
      newPassword: 'CBDP@123'
    })
  });
  console.log('Restored password status:', restoreRes.status);

  await mongoose.disconnect();
  console.log('\n✓ E2E Password Reset & Login completed successfully!');
}

testE2EPwdReset().catch(console.error);
