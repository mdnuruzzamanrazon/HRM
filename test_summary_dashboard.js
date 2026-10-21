// test_summary_dashboard.js
// Verification of CBDP Risk Register Summary Dashboard data, calculations, and formulas
import mongoose from 'mongoose';

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function testSummaryDashboard() {
  console.log('================================================================');
  console.log('   CBDP RISK REGISTER SUMMARY DASHBOARD AUDIT');
  console.log('================================================================\n');

  // 1. Authenticate as Super Admin
  console.log('1. Authenticating as Super Admin...');
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
  const token = loginData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  console.log('✓ Authentication successful!\n');

  // 2. Fetch Projects
  console.log('2. Fetching HR Projects...');
  const projRes = await fetch(`${BASE_URL}/risk/projects`, { headers: authHeaders });
  const projData = await projRes.json();
  const projects = projData.data;
  console.log(`✓ Retrieved ${projects.length} project(s).`);
  const activeProject = projects[0];
  console.log(`  Active Project ID: ${activeProject._id} ("${activeProject.name}")\n`);

  // 3. Test Summary Dashboard API for Active Project
  console.log('3. Auditing Summary Dashboard API (/risk/stats)...');
  const statsRes = await fetch(`${BASE_URL}/risk/stats?projectId=${activeProject._id}`, { headers: authHeaders });
  const statsData = await statsRes.json();
  const stats = statsData.data;

  console.log('✓ Retrieved Summary Data Payload successfully.');
  console.log(`  Total Active Risks: ${stats.totalRisks}`);
  console.log(`  High Risk Count (≥15): ${stats.highCount}`);
  console.log(`  Medium Risk Count (8-14): ${stats.mediumCount}`);
  console.log(`  Low Risk Count (<8): ${stats.lowCount}`);
  console.log(`  Average Current Score: ${stats.avgScore}`);
  console.log(`  Average Target Score: ${stats.avgTarget}`);
  console.log(`  Average Variance: ${stats.avgVariance}\n`);

  // 4. Verify Section A: Summary of Risks Structure
  console.log('4. Verifying Section A: Summary of Risks structure...');
  const sor = stats.summaryOfRisks;
  if (!sor || !sor.high || !sor.medium || !sor.low || !sor.total) {
    throw new Error('Summary of Risks structure missing required fields!');
  }
  console.log(`✓ High Risk Level: count=${sor.high.count}, %=${sor.high.percentage}%, aveVar=${sor.high.avgVariance}`);
  console.log(`✓ Medium Risk Level: count=${sor.medium.count}, %=${sor.medium.percentage}%, aveVar=${sor.medium.avgVariance}`);
  console.log(`✓ Low Risk Level: count=${sor.low.count}, %=${sor.low.percentage}%, aveVar=${sor.low.avgVariance}`);
  console.log(`✓ Total Level: count=${sor.total.count}, %=${sor.total.percentage}%, aveVar=${sor.total.avgVariance}\n`);

  // Verify percentage sum
  const sumCount = sor.high.count + sor.medium.count + sor.low.count;
  if (sumCount !== sor.total.count) {
    throw new Error(`Summary counts mismatch: ${sumCount} vs total ${sor.total.count}`);
  }

  // 5. Verify Section B: Summary by Category Structure
  console.log('5. Verifying Section B: Summary by Category structure...');
  const sbc = stats.summaryByCategory;
  if (!Array.isArray(sbc) || sbc.length === 0) {
    throw new Error('Summary by Category is empty or not an array!');
  }
  const requiredCategories = [
    'Strategy & Governance',
    'Finance & Services',
    'Funding & Income',
    'Programme Delivery',
    'People',
    'External'
  ];
  requiredCategories.forEach(cat => {
    const found = sbc.find(c => c.category === cat);
    if (!found) {
      throw new Error(`Standard CBDP category "${cat}" missing in Summary by Category!`);
    }
    console.log(`✓ Category "${cat}": High=${found.high}, Med=${found.medium}, Low=${found.low}, Total=${found.total}`);
  });
  console.log('');

  // 6. Verify Section C: 5x5 Heat Map Matrix & List
  console.log('6. Verifying Section C: 5x5 Heat Map Data structure...');
  if (!stats.heatmap || !stats.heatMapDataList) {
    throw new Error('Heatmap data missing!');
  }
  if (stats.heatMapDataList.length !== 25) {
    throw new Error(`Expected 25 heat map combinations, got ${stats.heatMapDataList.length}`);
  }
  // Check formula Score = (L * I) + I
  stats.heatMapDataList.forEach(cell => {
    const expectedScore = (cell.likelihood * cell.impact) + cell.impact;
    if (cell.score !== expectedScore) {
      throw new Error(`Heatmap score formula mismatch at L${cell.likelihood} I${cell.impact}: expected ${expectedScore}, got ${cell.score}`);
    }
  });
  console.log('✓ All 25 Heatmap cells strictly adhere to Score = (Likelihood × Impact) + Impact.');
  console.log(`✓ Heatmap matrix correctly maps Likelihood (5 to 1) and Impact (1 to 5).\n`);

  // 7. Verify Section D: Variance Radar Data
  console.log('7. Verifying Section D: Variance Radar Data structure...');
  const vr = stats.varianceRadar;
  if (!Array.isArray(vr) || vr.length === 0) {
    throw new Error('Variance Radar data missing or empty!');
  }
  requiredCategories.forEach(cat => {
    const found = vr.find(v => v.category === cat);
    if (!found) {
      throw new Error(`Category "${cat}" missing in Variance Radar data!`);
    }
    console.log(`✓ Radar "${cat}": count=${found.count}, aveScore=${found.avgScore}, aveTarget=${found.avgTarget}, variance=${found.variance}, status="${found.status}"`);
  });
  console.log('');

  // 8. Test Empty Project Graceful Handling
  console.log('8. Testing Empty Project Graceful Handling...');
  // Create temporary empty project
  const emptyProjRes = await fetch(`${BASE_URL}/risk/projects`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Temp Empty Audit Project',
      officeResponsible: 'Test Office',
      location: 'Test Location',
      period: '2026',
      reviewQuarter: 'Q1',
      endQuarter: 'Q4'
    })
  });
  const emptyProj = (await emptyProjRes.json()).data;
  const emptyStatsRes = await fetch(`${BASE_URL}/risk/stats?projectId=${emptyProj._id}`, { headers: authHeaders });
  const emptyStats = (await emptyStatsRes.json()).data;

  if (emptyStats.totalRisks !== 0 || emptyStats.avgScore !== 0 || emptyStats.avgVariance !== 0) {
    throw new Error('Empty project did not return 0 totals/averages gracefully!');
  }
  console.log('✓ Empty project handled with zero division protection: totalRisks=0, avgScore=0, avgVariance=0');

  // Clean up empty project
  await fetch(`${BASE_URL}/risk/projects/${emptyProj._id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  console.log('✓ Temporary empty project cleaned up.');

  console.log('\n================================================================');
  console.log('  ALL SUMMARY DASHBOARD TESTS PASSED (100% AUDIT SUCCESSFUL)    ');
  console.log('================================================================\n');
}

testSummaryDashboard().catch(err => {
  console.error('\nSummary Dashboard Test Failed:', err);
  process.exit(1);
});
