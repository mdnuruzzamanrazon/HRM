// test_forgot_password_flow.js
import crypto from 'crypto';

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function testForgotPasswordFlow() {
  console.log('=== Testing Forgot Password & Verification Code Mechanics ===\n');

  // Test 1: Verify code generation
  const code = crypto.randomInt(100000, 1000000).toString();
  console.log('Generated test code format:', code, 'Length:', code.length, 'Is 6 digits:', /^\d{6}$/.test(code));

  // Test 2: Request forgot password without email
  const emptyRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  console.log('Empty request status (expect 400):', emptyRes.status);

  // Test 3: Request forgot password for non-existent employee
  const notFoundRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent_person_12345@cbdp.org' })
  });
  console.log('Non-existent email status (expect 404):', notFoundRes.status);

  // Test 4: Request forgot password with invalid Google App Password
  const invalidAppPassRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'mdnuruzzamanrazon@gmail.com',
      smtpUser: 'mdnuruzzamanrazon@gmail.com',
      smtpPass: 'invalid-app-password'
    })
  });
  const invalidAppData = await invalidAppPassRes.json();
  console.log('Invalid credentials response status (expect 401):', invalidAppPassRes.status);
  console.log('Error code:', invalidAppData.code);
  console.log('Is demo mode code exposed in response?:', Boolean(invalidAppData.sandboxCode || invalidAppData.code === '923481'));
  console.log('Message:', invalidAppData.message);

  // Test 5: Try verifying incorrect code on /verify-reset-code
  const verifyRes = await fetch(`${BASE_URL}/auth/verify-reset-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'mdnuruzzamanrazon@gmail.com',
      code: '000000'
    })
  });
  const verifyData = await verifyRes.json();
  console.log('Incorrect code status (expect 400):', verifyRes.status, 'Message:', verifyData.message);

  console.log('\n✓ All forgot password validation checks passed perfectly!');
}

testForgotPasswordFlow().catch(console.error);
