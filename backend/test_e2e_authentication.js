import axios from 'axios';
import mongoose from 'mongoose';
import { User } from './src/models/User.js';
import { Employee } from './src/models/Employee.js';

const API_BASE = 'http://127.0.0.1:5000/api/v1';

const runTests = async () => {
  console.log('================================================================');
  console.log('      END-TO-END AUTHENTICATION & PASSWORD VERIFICATION TEST    ');
  console.log('================================================================\n');

  await mongoose.connect('mongodb://127.0.0.1:27017/cbdp');
  console.log('[Test Setup] Connected to MongoDB 127.0.0.1:27017/cbdp\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    if (condition) {
      console.log(`  [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${description}`);
      failed++;
    }
  };

  // -------------------------------------------------------------------------
  // TEST SUITE 1: HR-MANAGED EMPLOYEE PASSWORD RESET & LOGIN WORKFLOW
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('TEST SUITE 1: HR-Managed Employee Password Change & Login Flow');
  console.log('----------------------------------------------------------------');

  try {
    // 1.1 HR Admin Login
    const adminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'mdnuruzzamanrazon@gmail.com',
      password: 'ABCabc@123',
      portal: 'HR'
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data.token, '1.1 HR Admin logs in successfully and receives JWT token');
    const adminToken = adminLoginRes.data.token;

    // 1.2 Fetch Employee Record (Sarah Jenkins)
    const empRes = await axios.get(`${API_BASE}/employees`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const sarahEmp = empRes.data.data.find(e => e.email === 'employee@cbdp.org');
    assert(sarahEmp && sarahEmp._id, `1.2 HR finds employee record: ${sarahEmp?.firstName} ${sarahEmp?.lastName} (${sarahEmp?._id})`);

    // 1.3 HR Sets New Password for Sarah Jenkins
    const hrNewPassword = 'HrNewPass@2026';
    const resetRes = await axios.post(
      `${API_BASE}/employees/${sarahEmp._id}/reset-password`,
      { newPassword: hrNewPassword, isTemporary: true },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(resetRes.status === 200 && resetRes.data.success, '1.3 HR Portal successfully resets employee password');

    // 1.4 Verify old password no longer works
    let oldPasswordRejected = false;
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: 'employee@cbdp.org',
        password: 'OldPasswordShouldFail123!',
        portal: 'EMPLOYEE'
      });
    } catch (err) {
      oldPasswordRejected = err.response?.status === 401;
    }
    assert(oldPasswordRejected, '1.4 Old/incorrect password is rejected with HTTP 401');

    // 1.5 Employee logs in with HR-assigned password
    const empLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'employee@cbdp.org',
      password: hrNewPassword,
      portal: 'EMPLOYEE'
    });
    assert(
      empLoginRes.status === 200 && 
      empLoginRes.data.token && 
      empLoginRes.data.mustChangePassword === true,
      '1.5 Employee successfully logs in with HR-assigned password and is flagged for first-login password setup'
    );
    const empToken = empLoginRes.data.token;

    // 1.6 Employee completes first-login password change
    const permanentPass = 'EmployeeOwnSecret@2026';
    const firstLoginChangeRes = await axios.post(
      `${API_BASE}/auth/change-first-login-password`,
      { newPassword: permanentPass },
      { headers: { Authorization: `Bearer ${empToken}` } }
    );
    assert(
      firstLoginChangeRes.status === 200 && 
      firstLoginChangeRes.data.success &&
      firstLoginChangeRes.data.token,
      '1.6 Employee completes first-login password change and receives refreshed JWT session token'
    );

    // 1.7 Employee logs in with their newly configured permanent password
    const finalEmpLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'employee@cbdp.org',
      password: permanentPass,
      portal: 'EMPLOYEE'
    });
    assert(
      finalEmpLogin.status === 200 && 
      finalEmpLogin.data.mustChangePassword === false,
      '1.7 Employee logs in with permanent password and mustChangePassword is now false'
    );

  } catch (err) {
    console.error('Suite 1 Exception:', err.response?.data || err.message);
    failed++;
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 2: FORGOT PASSWORD 6-DIGIT VERIFICATION CODE WORKFLOW
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------');
  console.log('TEST SUITE 2: Email-Based Forgot Password Verification Code Flow');
  console.log('----------------------------------------------------------------');

  try {
    const targetEmail = 'employee@cbdp.org';

    // 2.1 Request Forgot Password Code for registered email
    const forgotRes = await axios.post(`${API_BASE}/auth/forgot-password`, {
      email: targetEmail
    });
    assert(
      forgotRes.status === 200 && 
      forgotRes.data.success && 
      forgotRes.data.expiresInMinutes === 10,
      '2.1 Forgot password accepts registered email and returns delivery success with 10-minute expiry'
    );
    assert(forgotRes.data.verificationCode === undefined, '2.1b Security check: Verification code is NOT exposed in API response');

    // 2.2 Verify Code in Database and Cache
    const dbUser = await User.findOne({ email: targetEmail });
    assert(
      dbUser && 
      dbUser.resetPasswordCode && 
      dbUser.resetPasswordCode.length === 6 &&
      dbUser.resetPasswordExpires > new Date(),
      `2.2 Secure random 6-digit code (${dbUser?.resetPasswordCode}) stored in MongoDB with future expiration`
    );
    const activeCode = dbUser.resetPasswordCode;

    // 2.3 Verify Cooldown Rate Limiting (requesting immediately again triggers cooldown)
    let cooldownTriggered = false;
    try {
      await axios.post(`${API_BASE}/auth/forgot-password`, { email: targetEmail });
    } catch (err) {
      cooldownTriggered = err.response?.status === 429;
    }
    assert(cooldownTriggered, '2.3 Cooldown rate limiting active: Immediate duplicate request returns HTTP 429');

    // 2.4 Verify with invalid code is rejected
    let invalidCodeRejected = false;
    try {
      await axios.post(`${API_BASE}/auth/verify-reset-code`, {
        email: targetEmail,
        code: '000000'
      });
    } catch (err) {
      invalidCodeRejected = err.response?.status === 400;
    }
    assert(invalidCodeRejected, '2.4 Invalid 6-digit code (000000) rejected with HTTP 400');

    // 2.5 Verify with correct code succeeds
    const verifySuccessRes = await axios.post(`${API_BASE}/auth/verify-reset-code`, {
      email: targetEmail,
      code: activeCode
    });
    assert(verifySuccessRes.status === 200 && verifySuccessRes.data.success, '2.5 Correct 6-digit code verified successfully');

    // 2.6 Reset password with the verified code
    const selfResetPass = 'SelfResetPass@2026';
    const resetPwRes = await axios.post(`${API_BASE}/auth/reset-password`, {
      email: targetEmail,
      code: activeCode,
      newPassword: selfResetPass
    });
    assert(resetPwRes.status === 200 && resetPwRes.data.success, '2.6 Password reset successfully completed with verification code');

    // 2.7 Verify single-use enforcement: Attempting to reuse the same code fails
    let reuseRejected = false;
    try {
      await axios.post(`${API_BASE}/auth/reset-password`, {
        email: targetEmail,
        code: activeCode,
        newPassword: 'AnotherPassword@123'
      });
    } catch (err) {
      reuseRejected = err.response?.status === 400;
    }
    assert(reuseRejected, '2.7 Single-use enforcement: Reusing the same verification code is strictly rejected (HTTP 400)');

    // 2.8 Login with the self-reset password succeeds
    const postResetLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: targetEmail,
      password: selfResetPass,
      portal: 'EMPLOYEE'
    });
    assert(postResetLogin.status === 200 && postResetLogin.data.token, '2.8 Employee successfully logs in with new self-reset password');

    // 2.9 Invalid email test
    let invalidEmailRejected = false;
    try {
      await axios.post(`${API_BASE}/auth/forgot-password`, {
        email: 'nonexistent.user.test@cbdp.org'
      });
    } catch (err) {
      invalidEmailRejected = err.response?.status === 404;
    }
    assert(invalidEmailRejected, '2.9 Unregistered email address returns HTTP 404');

  } catch (err) {
    console.error('Suite 2 Exception:', err.response?.data || err.message);
    failed++;
  }

  // -------------------------------------------------------------------------
  // TEST SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  // Reset employee password back to standard demo password for continued manual usage
  const finalEmp = await User.findOne({ email: 'employee@cbdp.org' });
  if (finalEmp) {
    const { hashPassword } = await import('./src/utils/authUtils.js');
    finalEmp.passwordHash = await hashPassword('ABCabc@123');
    finalEmp.mustChangePassword = false;
    await finalEmp.save();
    console.log('[Cleanup] Reset employee@cbdp.org password back to ABCabc@123 for user convenience.');
  }

  process.exit(failed > 0 ? 1 : 0);
};

runTests();
