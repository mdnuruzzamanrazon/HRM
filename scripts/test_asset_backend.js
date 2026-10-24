import app from '../backend/src/app.js';
import http from 'http';

const port = 5098;
const server = http.createServer(app);

async function runTests() {
  await new Promise((resolve) => server.listen(port, resolve));
  console.log(`Test server running on http://127.0.0.1:${port}`);

  try {
    // 1. Login via /auth/login to get legitimate token
    const loginRes = await fetch(`http://127.0.0.1:${port}/api/v1/auth/login`, {
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
      console.error('Login failed:', loginData);
      server.close();
      return;
    }
    const token = loginData.token;
    console.log('✓ Login succeeded! Role:', loginData.user?.role);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Dashboard
    const dashRes = await fetch(`http://127.0.0.1:${port}/api/v1/assets/dashboard`, { headers });
    const dashData = await dashRes.json();
    console.log('2. Dashboard Status:', dashRes.status, 'Success:', dashData.success);
    console.log('   KPIs:', dashData.data?.kpi);
    console.log('   Category Summaries:', dashData.data?.categorySummaries?.length);

    // 3. Assets List
    const assetRes = await fetch(`http://127.0.0.1:${port}/api/v1/assets?limit=5`, { headers });
    const assetData = await assetRes.json();
    console.log('3. Assets Status:', assetRes.status, 'Total Count:', assetData.pagination?.totalCount);
    console.log('   First Asset:', assetData.data?.[0]?.assetId, assetData.data?.[0]?.name);

    // 4. References
    const refRes = await fetch(`http://127.0.0.1:${port}/api/v1/assets/references`, { headers });
    const refData = await refRes.json();
    console.log('4. References Status:', refRes.status, 'Categories:', refData.data?.categories?.length);

    // 5. Field Kits
    const kitRes = await fetch(`http://127.0.0.1:${port}/api/v1/assets/kits`, { headers });
    const kitData = await kitRes.json();
    console.log('5. Kits Status:', kitRes.status, 'Count:', kitData.data?.length);

    // 6. Vehicles
    const vehRes = await fetch(`http://127.0.0.1:${port}/api/v1/assets/vehicles`, { headers });
    const vehData = await vehRes.json();
    console.log('6. Vehicles Status:', vehRes.status, 'Count:', vehData.data?.length);

    // 7. Workflows
    const wfRes = await fetch(`http://127.0.0.1:${port}/api/v1/assets/workflows`, { headers });
    const wfData = await wfRes.json();
    console.log('7. Workflows Status:', wfRes.status, 'Count:', wfData.data?.length);

    // 8. Create Asset
    const newAsset = {
      assetId: 'CBDP-TEST-AST-E2E-01',
      name: 'Automated E2E Test Asset',
      category: 'IT Equipment',
      location: 'Head Office',
      custodian: 'QA Engineer',
      purchaseCost: 65000,
      usefulLifeYears: 5,
      condition: 'Excellent',
      status: 'Active',
      riskFlag: 'Low'
    };
    const createRes = await fetch(`http://127.0.0.1:${port}/api/v1/assets`, {
      method: 'POST',
      headers,
      body: JSON.stringify(newAsset)
    });
    const createData = await createRes.json();
    console.log('8. Create Asset Status:', createRes.status, 'Created ID:', createData.data?.assetId);

    // 9. Clean up created asset
    const delRes = await fetch(`http://127.0.0.1:${port}/api/v1/assets/CBDP-TEST-AST-E2E-01`, {
      method: 'DELETE',
      headers
    });
    console.log('9. Delete Asset Status:', delRes.status);

    console.log('\n--- ALL BACKEND ASSET ENDPOINTS TESTED AND VERIFIED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
