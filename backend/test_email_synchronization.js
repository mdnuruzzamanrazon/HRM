import axios from 'axios';
import mongoose from 'mongoose';
import { User } from './src/models/User.js';
import { Employee } from './src/models/Employee.js';

const API_BASE = 'http://127.0.0.1:5000/api/v1';

async function runSyncTests() {
  console.log('================================================================');
  console.log('   HR & EMPLOYEE PORTAL EMAIL SYNCHRONIZATION TEST SUITE       ');
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

  try {
    // 1. HR Admin Login
    const adminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'mdnuruzzamanrazon@gmail.com',
      password: 'ABCabc@123',
      portal: 'HR'
    });
    const adminToken = adminLoginRes.data.token;
    assert(adminToken, '1. Admin successfully authenticates to HR portal');

    // 2. Fetch employee list and verify deduplication
    const empListRes = await axios.get(`${API_BASE}/employees`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(empListRes.status === 200 && Array.isArray(empListRes.data.data), '2.1 HR retrieves employee workforce directory');

    // Verify all employees have unique emails
    const emails = empListRes.data.data.map(e => (e.email || e.personalDetails?.email || '').toLowerCase().trim());
    const uniqueEmails = new Set(emails);
    assert(emails.length === uniqueEmails.size, `2.2 Zero duplicate employee emails in directory (${emails.length} total, ${uniqueEmails.size} unique)`);

    // 3. Test case-insensitive and whitespace email resolution for Forgot Password
    const targetEmail = 'nuruzzamanrazon62@gmail.com';
    const messyEmail = '   NuRuZzAmAnRaZoN62@gMaIl.CoM   ';

    const forgotRes = await axios.post(`${API_BASE}/auth/forgot-password`, {
      email: messyEmail
    });
    assert(
      forgotRes.status === 200 && forgotRes.data.success,
      '3.1 Forgot Password successfully resolves employee with leading/trailing whitespace and mixed case'
    );
    assert(
      forgotRes.data.email === targetEmail,
      `3.2 Forgot Password normalized email correctly to: ${forgotRes.data.email}`
    );

    // 4. Retrieve code from database and verify
    const dbUser = await User.findOne({ email: targetEmail });
    assert(dbUser && dbUser.resetPasswordCode, `4.1 Database User record updated with verification code`);
    const code = dbUser.resetPasswordCode;

    // 5. Verify the code
    const verifyRes = await axios.post(`${API_BASE}/auth/verify-reset-code`, {
      email: messyEmail,
      code
    });
    assert(verifyRes.status === 200 && verifyRes.data.success, '5.1 Code verification accepts normalized email');

    // 6. Reset password
    const newPass = 'UpdatedPassword@2026';
    const resetRes = await axios.post(`${API_BASE}/auth/reset-password`, {
      email: messyEmail,
      code,
      newPassword: newPass
    });
    assert(resetRes.status === 200 && resetRes.data.success, '6.1 Password reset completes successfully');

    // 7. Verify Employee Portal Login with new password
    const empLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: messyEmail,
      password: newPass,
      portal: 'EMPLOYEE'
    });
    assert(empLoginRes.status === 200 && empLoginRes.data.token, '7.1 Employee successfully signs in to Employee Portal using new password');

    // 8. Prevent duplicate employee creation
    let duplicateRejected = false;
    try {
      await axios.post(
        `${API_BASE}/employees`,
        {
          firstName: 'Duplicate',
          lastName: 'Tester',
          email: targetEmail,
          employeeCode: 'CBDP-DUP-999',
          title: 'QA Engineer',
          department: 'Engineering & Technology',
          employmentType: 'FULL_TIME',
          status: 'ACTIVE',
          joinDate: '2026-01-01'
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
    } catch (err) {
      duplicateRejected = err.response?.status === 400;
    }
    assert(duplicateRejected, '8.1 Attempting to create a duplicate employee with registered email is rejected with HTTP 400');

    // Cleanup: reset password for continued manual usage
    dbUser.passwordHash = await (await import('./src/utils/authUtils.js')).hashPassword('CBDP@123');
    await dbUser.save();
    console.log('[Cleanup] Reset nuruzzamanrazon62@gmail.com password back to CBDP@123.');

  } catch (err) {
    console.error('Test Exception:', err.response?.data || err.message);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runSyncTests();
