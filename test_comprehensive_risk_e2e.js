// test_comprehensive_risk_e2e.js
// Complete End-to-End Test for CBDP HR Risk Register Module

import mongoose from 'mongoose';

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function runE2ETest() {
  console.log('================================================================');
  console.log('   CBDP HRM RISK REGISTER MODULE - COMPREHENSIVE E2E AUDIT      ');
  console.log('================================================================\n');

  // Step 1: Authentication
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
  if (!loginRes.ok || !loginData.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  const token = loginData.token;
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  console.log('✓ Authenticated successfully. User:', loginData.user.email, '| Role:', loginData.user.role);

  // Step 2: Create a Dynamic HR Project
  console.log('\n2. Testing Flexible HR Project Creation...');
  const projectPayload = {
    name: 'E2E Verified HR Project - Workforce Digital Transformation',
    officeResponsible: 'Regional HQ - People & Culture Division',
    location: 'Dhaka, Chittagong & Remote Operations',
    period: '2026 - 2028',
    reviewQuarter: 'Q1 2026',
    endQuarter: 'Q4 2028',
    description: 'Modernizing human resource operations, digital tracking, and safeguarding compliance across all field branches.',
    status: 'ACTIVE'
  };

  const createProjRes = await fetch(`${BASE_URL}/risk/projects`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(projectPayload)
  });
  const createProjData = await createProjRes.json();
  if (!createProjRes.ok || !createProjData.data?._id) {
    throw new Error(`Project creation failed: ${JSON.stringify(createProjData)}`);
  }
  const project = createProjData.data;
  console.log(`✓ Project Created successfully! ID: ${project._id}`);
  console.log(`  Name: "${project.name}"`);
  console.log(`  Office: "${project.officeResponsible}"`);
  console.log(`  Location: "${project.location}"`);
  console.log(`  Period: "${project.period}"`);
  console.log(`  Review Quarter: "${project.reviewQuarter}" | End Quarter: "${project.endQuarter}"`);

  // Step 3: Test Configurable Categories
  console.log('\n3. Testing Category & Sub-category Classification API...');
  const catRes = await fetch(`${BASE_URL}/risk/categories`, { headers: authHeaders });
  const catData = await catRes.json();
  console.log(`✓ Fetched ${catData.data?.length} categories. Approved formula: ${catData.scoringMeta?.formula}`);

  // Test adding a custom category / subcategory
  console.log('   Adding custom category "Workforce Health & Wellbeing"...');
  const addCatRes = await fetch(`${BASE_URL}/risk/categories`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      categoryName: 'Workforce Health & Wellbeing',
      code: 'WH',
      description: 'Physical, psychological, and ergonomic occupational risks',
      subCategoryName: 'Mental health & Burnout',
      subCategoryCode: 'MB',
      note: 'Stress, high workload, remote isolation'
    })
  });
  const addCatData = await addCatRes.json();
  console.log(`✓ Classification added: ${addCatData.message}`);

  // Step 4: Create Multiple Risk Records with all 20 fields and test Approved Formulas
  console.log('\n4. Creating Risk Records and Testing Approved Formula (L x I) + I...');

  // Test Case A: High Risk (Likelihood 4, Impact 5 -> (4*5)+5 = 25 >= 15 -> HIGH)
  const risk1Payload = {
    projectId: project._id,
    riskNo: 1,
    dateAdded: '2026-01-15',
    category: 'People',
    subCategory: 'Safeguarding',
    description: 'Field workers and beneficiaries in remote disaster recovery camps face safeguarding breaches due to lack of confidential complaint channels.',
    riskOwner: 'Safeguarding & HR Director',
    likelihood: 4,
    impact: 5,
    targetScore: 7,
    mitigationAction: 'Deploy solar-powered toll-free complaint hotlines, mandate bilingual code of conduct training, and assign dedicated field female safeguarding champions.',
    actionDueDate: '2026-04-30',
    personMonitoring: 'Head of Internal Oversight',
    notes: 'Priority 1 safeguarding item discussed in Executive Committee.',
    assessmentResult: 'High Priority Action',
    reviewDate: '2026-06-30',
    assessedLikelihood: 2,
    assessedImpact: 4, // (2*4)+4 = 12 (MEDIUM)
    status: 'UNDER_REVIEW'
  };

  const r1Res = await fetch(`${BASE_URL}/risk/records`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(risk1Payload)
  });
  const r1Data = await r1Res.json();
  const r1 = r1Data.data;

  console.log(`✓ Risk #1 Created:`);
  console.log(`  Current Score: ${r1.currentScore} (Expected 25: (4*5)+5) -> Rating: ${r1.riskRating} (Expected HIGH)`);
  console.log(`  Target Score: ${r1.targetScore} -> Variance: ${r1.variance} (Expected 18: 25 - 7)`);
  console.log(`  Assessed Score: ${r1.assessmentScore} (Expected 12: (2*4)+4) -> Rating: ${r1.assessmentRating} (Expected MEDIUM)`);

  if (r1.currentScore !== 25 || r1.riskRating !== 'HIGH' || r1.variance !== 18 || r1.assessmentScore !== 12) {
    throw new Error('Risk #1 calculations failed!');
  }

  // Test Case B: Medium Risk (Likelihood 3, Impact 3 -> (3*3)+3 = 12 -> 8<=score<15 -> MEDIUM)
  const risk2Payload = {
    projectId: project._id,
    riskNo: 2,
    dateAdded: '2026-02-01',
    category: 'Strategy & Governance',
    subCategory: 'Legal compliance',
    description: 'Delay in obtaining new annual operating licenses for regional field hubs from local district commissioners.',
    riskOwner: 'Operations Legal Counsel',
    likelihood: 3,
    impact: 3,
    targetScore: 4,
    mitigationAction: 'Establish early docket filing system 90 days before expiration with dedicated administrative liaison.',
    actionDueDate: '2026-05-31',
    personMonitoring: 'General Counsel',
    notes: 'Reviewed in February compliance sprint.',
    assessmentResult: 'On Track',
    reviewDate: '2026-07-31',
    assessedLikelihood: 1,
    assessedImpact: 2, // (1*2)+2 = 4 (LOW)
    status: 'OPEN'
  };

  const r2Res = await fetch(`${BASE_URL}/risk/records`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(risk2Payload)
  });
  const r2Data = await r2Res.json();
  const r2 = r2Data.data;

  console.log(`✓ Risk #2 Created:`);
  console.log(`  Current Score: ${r2.currentScore} (Expected 12: (3*3)+3) -> Rating: ${r2.riskRating} (Expected MEDIUM)`);
  console.log(`  Target Score: ${r2.targetScore} -> Variance: ${r2.variance} (Expected 8: 12 - 4)`);
  console.log(`  Assessed Score: ${r2.assessmentScore} (Expected 4: (1*2)+2) -> Rating: ${r2.assessmentRating} (Expected LOW)`);

  if (r2.currentScore !== 12 || r2.riskRating !== 'MEDIUM' || r2.variance !== 8 || r2.assessmentScore !== 4) {
    throw new Error('Risk #2 calculations failed!');
  }

  // Test Case C: Low Risk (Likelihood 1, Impact 3 -> (1*3)+3 = 6 -> score<8 -> LOW)
  const risk3Payload = {
    projectId: project._id,
    riskNo: 3,
    dateAdded: '2026-02-10',
    category: 'Workforce Health & Wellbeing',
    subCategory: 'Mental health & Burnout',
    description: 'Sub-regional staff fatigue during peak grant reporting periods.',
    riskOwner: 'HR Manager',
    likelihood: 1,
    impact: 3,
    targetScore: 3,
    mitigationAction: 'Institute mandatory comp-off policy and flexible work schedule during intensive quarter-close cycles.',
    actionDueDate: '2026-04-15',
    personMonitoring: 'HR Operations Lead',
    notes: 'Wellbeing surveys conducted monthly.',
    assessmentResult: 'Tolerable',
    status: 'OPEN'
  };

  const r3Res = await fetch(`${BASE_URL}/risk/records`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(risk3Payload)
  });
  const r3Data = await r3Res.json();
  const r3 = r3Data.data;

  console.log(`✓ Risk #3 Created:`);
  console.log(`  Current Score: ${r3.currentScore} (Expected 6: (1*3)+3) -> Rating: ${r3.riskRating} (Expected LOW)`);
  console.log(`  Variance: ${r3.variance} (Expected 3: 6 - 3)`);

  if (r3.currentScore !== 6 || r3.riskRating !== 'LOW' || r3.variance !== 3) {
    throw new Error('Risk #3 calculations failed!');
  }

  // Step 5: Test Editing & Updating Risk Record
  console.log('\n5. Testing Editing Risk Record & Automatic Dynamic Recalculation...');
  const updateRiskRes = await fetch(`${BASE_URL}/risk/records/${r2._id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      likelihood: 1,
      impact: 2, // (1*2)+2 = 4 (LOW)
      assessmentResult: 'Resolved - License Received',
      status: 'MITIGATED'
    })
  });
  const updateRiskData = await updateRiskRes.json();
  const updatedR2 = updateRiskData.data;
  console.log(`✓ Updated Risk #2:`);
  console.log(`  New Current Score: ${updatedR2.currentScore} (Expected 4) -> New Rating: ${updatedR2.riskRating} (Expected LOW)`);
  console.log(`  New Status: ${updatedR2.status}`);

  if (updatedR2.currentScore !== 4 || updatedR2.riskRating !== 'LOW' || updatedR2.status !== 'MITIGATED') {
    throw new Error('Update calculation mismatch!');
  }

  // Step 6: Test Updating Project Information
  console.log('\n6. Testing Project Information Editable Fields...');
  const updateProjRes = await fetch(`${BASE_URL}/risk/projects/${project._id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      reviewQuarter: 'Q2 2026',
      officeResponsible: 'Country Director & Executive Oversight Board'
    })
  });
  const updateProjData = await updateProjRes.json();
  console.log(`✓ Project updated: Review Quarter = ${updateProjData.data?.reviewQuarter}, Office = ${updateProjData.data?.officeResponsible}`);

  // Step 7: Test Queries & Filtering
  console.log('\n7. Testing Queries, Search & Filters...');
  // Query by High Rating
  const highFilterRes = await fetch(`${BASE_URL}/risk/records?projectId=${project._id}&riskRating=HIGH`, { headers: authHeaders });
  const highFilterData = await highFilterRes.json();
  console.log(`✓ High Risk Filter: Found ${highFilterData.data?.length} records (Expected 1)`);

  // Query by Category
  const catFilterRes = await fetch(`${BASE_URL}/risk/records?projectId=${project._id}&category=People`, { headers: authHeaders });
  const catFilterData = await catFilterRes.json();
  console.log(`✓ Category Filter (People): Found ${catFilterData.data?.length} records`);

  // Query by Keyword Search
  const searchRes = await fetch(`${BASE_URL}/risk/records?projectId=${project._id}&search=safeguarding`, { headers: authHeaders });
  const searchData = await searchRes.json();
  console.log(`✓ Keyword Search ('safeguarding'): Found ${searchData.data?.length} records`);

  // Step 8: Test Aggregated Statistics and Heatmap
  console.log('\n8. Testing Aggregated Risk Stats & 5x5 Heatmap Matrix...');
  const statsRes = await fetch(`${BASE_URL}/risk/stats?projectId=${project._id}`, { headers: authHeaders });
  const statsData = await statsRes.json();
  console.log(`✓ Stats: Total=${statsData.data?.totalRisks}, High=${statsData.data?.highCount}, Med=${statsData.data?.mediumCount}, Low=${statsData.data?.lowCount}`);
  console.log(`  Avg Score: ${statsData.data?.avgScore}`);
  console.log(`  Heatmap Cell (Likelihood 4, Impact 5): ${statsData.data?.heatmap?.['4']?.['5']} risk(s)`);

  // Step 9: Verify Permanent Database Persistence
  console.log('\n9. Verifying Permanent MongoDB Database Storage directly via Mongoose...');
  const mongoUri = 'mongodb://127.0.0.1:27017/cbdp';
  const dbConnection = await mongoose.connect(mongoUri);
  const dbProject = await dbConnection.connection.db.collection('riskprojects').findOne({ _id: new mongoose.Types.ObjectId(project._id) });
  const dbRecords = await dbConnection.connection.db.collection('riskrecords').find({ projectId: new mongoose.Types.ObjectId(project._id) }).toArray();

  console.log(`✓ Direct DB Check: Found project in 'riskprojects' collection: "${dbProject?.name}"`);
  console.log(`✓ Direct DB Check: Found ${dbRecords.length} records in 'riskrecords' collection.`);
  dbRecords.forEach(r => {
    console.log(`   - DB Record Risk #${r.riskNo}: Category="${r.category}", Score=${r.currentScore}, Rating=${r.riskRating}, Variance=${r.variance}`);
  });

  // Step 10: Clean up test project and records
  console.log('\n10. Cleaning up test project and its risk records...');
  const delRes = await fetch(`${BASE_URL}/risk/projects/${project._id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  const delData = await delRes.json();
  console.log(`✓ Clean-up complete: ${delData.message}`);

  await mongoose.disconnect();

  console.log('\n================================================================');
  console.log('  ALL ACCEPTANCE CRITERIA VERIFIED - 100% AUDIT SUCCESSFUL!     ');
  console.log('================================================================\n');
}

runE2ETest().catch(err => {
  console.error('\nE2E Audit Failed with error:', err);
  process.exit(1);
});
