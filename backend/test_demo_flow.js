import axios from 'axios';

const API_BASE = 'http://127.0.0.1:5000/api/v1';

async function testDemoModeFlow() {
  console.log('================================================================');
  console.log('        TESTING DEMO MODE & PERSISTENT STORE RECOVERY FLOW      ');
  console.log('================================================================\n');

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
    // 1. Forgot password request for employee in demo store
    const targetEmail = 'robert.chen@cbdp.org';
    const forgotRes = await axios.post(`${API_BASE}/auth/forgot-password`, {
      email: '   ROBERT.CHEN@CBDP.ORG   '
    });
    assert(forgotRes.status === 200 && forgotRes.data.success, '1. Forgot Password accepts mixed-case email for robert.chen@cbdp.org');

    // 2. Cooldown check
    let cooldownTriggered = false;
    try {
      await axios.post(`${API_BASE}/auth/forgot-password`, { email: targetEmail });
    } catch (e) {
      cooldownTriggered = e.response?.status === 429;
    }
    assert(cooldownTriggered, '2. Cooldown 30-second rate limiting is active');

    // 3. Reset password test
    // In demo mode or test, verifyResetCode with invalid code fails
    let invalidCodeFailed = false;
    try {
      await axios.post(`${API_BASE}/auth/verify-reset-code`, {
        email: targetEmail,
        code: '123456'
      });
    } catch (e) {
      invalidCodeFailed = e.response?.status === 400;
    }
    assert(invalidCodeFailed, '3. Invalid 6-digit code is properly rejected');

  } catch (err) {
    console.error('Test Exception:', err.response?.data || err.message);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`DEMO SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

testDemoModeFlow();
