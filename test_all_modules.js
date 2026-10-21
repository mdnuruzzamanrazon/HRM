// test_all_modules.js
// Exhaustive automated test of all 16 HRM modules using admin credentials
const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function runAudit() {
  console.log('=== CBDP HRM Comprehensive Full-Stack Module Audit ===\n');

  // 1. Authenticate as Super Admin with ABCabc@123@razon
  console.log('1. Testing Super Admin Login with ABCabc@123@razon...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'mdnuruzzamanrazon@gmail.com',
      password: 'ABCabc@123@razon',
      portal: 'HR'
    })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.token) {
    console.error('Failed to log in:', loginData);
    process.exit(1);
  }
  const token = loginData.token;
  console.log('✓ Login successful! Token received. Role:', loginData.user.role);

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const results = [];

  async function testEndpoint(moduleName, endpoint, method = 'GET', body = null) {
    try {
      const opts = { method, headers: authHeaders };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(`${BASE_URL}${endpoint}`, opts);
      const data = await res.json().catch(() => ({ raw: 'non-json' }));
      const passed = res.ok;
      results.push({ module: moduleName, endpoint, method, status: res.status, passed });
      console.log(`[${passed ? 'PASS' : 'FAIL'}] ${moduleName.padEnd(20)} | ${method} ${endpoint.padEnd(30)} -> HTTP ${res.status}`);
      return data;
    } catch (err) {
      results.push({ module: moduleName, endpoint, method, status: 'ERROR', error: err.message, passed: false });
      console.log(`[ERR ] ${moduleName.padEnd(20)} | ${method} ${endpoint.padEnd(30)} -> ${err.message}`);
      return null;
    }
  }

  console.log('\n--- Auditing All 16 HRM Backend Modules ---');

  // Module 1: Dashboard
  await testEndpoint('Dashboard', '/dashboard/stats');

  // Module 2: Employees
  const empData = await testEndpoint('Employees', '/employees');

  // Module 3: Attendance
  await testEndpoint('Attendance', '/attendance/daily');
  await testEndpoint('Attendance', '/attendance/today');
  await testEndpoint('Attendance', '/attendance/corrections');

  // Module 4: Leaves
  await testEndpoint('Leaves', '/leaves');
  await testEndpoint('Leaves', '/leaves/balances');

  // Module 5: Payroll
  await testEndpoint('Payroll', '/payroll');

  // Module 6: Shifts
  await testEndpoint('Shifts', '/shifts');
  await testEndpoint('Shifts', '/shifts/assignments');

  // Module 7: Expenses
  await testEndpoint('Expenses', '/expenses');

  // Module 8: Taxes
  await testEndpoint('Taxes', '/taxes');

  // Module 9: Tracking / Geofence
  await testEndpoint('Tracking', '/tracking/all');

  // Module 10: Notices
  await testEndpoint('Notices', '/notices');

  // Module 11: Tasks
  await testEndpoint('Tasks', '/tasks');

  // Module 12: Notifications
  await testEndpoint('Notifications', '/notifications');

  // Module 13: Security Policies & Audit Logs
  await testEndpoint('Security', '/security/policies');
  await testEndpoint('Security', '/security/audit-logs');
  await testEndpoint('Security', '/security/sessions');

  // Module 14: Workplace Locations
  await testEndpoint('Workplaces', '/workplaces');
  await testEndpoint('Workplaces', '/workplaces/active');

  // Module 15: Employee Portal
  await testEndpoint('EmployeePortal', '/employee-portal/profile');

  // Module 16: Authentication Diagnostics & Verification
  await testEndpoint('AuthDiagnostics', '/auth/email-diagnostics');

  // Module 17: Risk Register Module
  await testEndpoint('RiskRegister', '/risk/projects');
  await testEndpoint('RiskRegister', '/risk/categories');
  await testEndpoint('RiskRegister', '/risk/records');
  await testEndpoint('RiskRegister', '/risk/stats');

  console.log('\n--- Summary ---');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  console.log(`Total tests: ${total}, Passed: ${passed}, Failed: ${total - passed}`);
}

runAudit();
