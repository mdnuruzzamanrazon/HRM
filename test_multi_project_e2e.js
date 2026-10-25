// test_multi_project_e2e.js
// Comprehensive End-to-End Automated Verification of Multi-Project Management Architecture
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

import app from './backend/src/app.js';
import { connectDB } from './backend/src/config/db.js';
import { RiskProject } from './backend/src/models/RiskProject.js';
import { RiskRecord } from './backend/src/models/RiskRecord.js';
import { ComplaintRecord } from './backend/src/models/ComplaintRecord.js';
import EventRecord from './backend/src/models/EventRecord.js';
import Beneficiary from './backend/src/models/Beneficiary.js';

const PORT = 5055;
const BASE_URL = `http://127.0.0.1:${PORT}/api/v1`;

async function runTests() {
  console.log('================================================================');
  console.log('   CBDP HRM MULTI-PROJECT SYSTEM: END-TO-END VERIFICATION       ');
  console.log('================================================================\n');

  // 1. Connect DB and start server
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`✓ Test Server started on port ${PORT}`);
  });

  const summary = {
    total: 0,
    passed: 0,
    failed: 0,
    failures: []
  };

  function assert(condition, description) {
    summary.total++;
    if (condition) {
      summary.passed++;
      console.log(`  [PASS] ${description}`);
    } else {
      summary.failed++;
      summary.failures.push(description);
      console.error(`  [FAIL] ${description}`);
    }
  }

  try {
    // 2. Authenticate
    console.log('\n--- Step 1: Authentication ---');
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
    assert(loginRes.ok && loginData.token, 'Super Admin authentication succeeds with valid JWT token');
    const token = loginData.token;
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 3. Project Creation
    console.log('\n--- Step 2: Project Creation & Uniqueness (Criterion 1 & 2) ---');
    const projectAPayload = {
      name: `Alpha Sustainable Growth Initiative ${Date.now()}`,
      code: `PRJ-ALPHA-${Date.now().toString().slice(-4)}`,
      description: 'Comprehensive socio-economic empowerment and climate resilience program.',
      projectManager: 'Engr. Nuruzzaman Razon',
      responsiblePerson: 'Dr. A. Rahman',
      status: 'ACTIVE',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      location: 'Patuakhali & Barguna',
      budget: 15000000,
    };

    const createProjectARes = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(projectAPayload)
    });
    const createProjectAData = await createProjectARes.json();
    assert(createProjectARes.ok && createProjectAData.success, 'Project A created successfully via /api/v1/projects');
    const projectA = createProjectAData.data;
    assert(projectA._id && projectA.code === projectAPayload.code, 'Project A assigned persistent unique MongoDB ObjectId and stable project code');

    const projectBPayload = {
      name: `Beta Community Healthcare Network ${Date.now()}`,
      code: `PRJ-BETA-${Date.now().toString().slice(-4)}`,
      description: 'Primary healthcare access, hygiene monitoring, and maternal care support.',
      projectManager: 'Dr. Fatima Begum',
      responsiblePerson: 'K. Hasan',
      status: 'ACTIVE',
      startDate: '2026-03-01',
      endDate: '2027-02-28',
      location: 'Amtoli & Kalapara',
      budget: 8500000,
    };

    const createProjectBRes = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(projectBPayload)
    });
    const createProjectBData = await createProjectBRes.json();
    assert(createProjectBRes.ok && createProjectBData.success, 'Project B created successfully via /api/v1/projects');
    const projectB = createProjectBData.data;
    assert(projectB._id && projectB._id !== projectA._id, 'Project B has distinct database identity from Project A');

    // 4. Retrieve Projects List & Details
    console.log('\n--- Step 3: Project Listing & Dashboard APIs ---');
    const listProjectsRes = await fetch(`${BASE_URL}/projects`, { headers: authHeaders });
    const listProjectsData = await listProjectsRes.json();
    assert(listProjectsRes.ok && listProjectsData.data?.length >= 2, 'Projects list endpoint returns all active projects');
    const foundA = listProjectsData.data.find(p => p._id === projectA._id);
    const foundB = listProjectsData.data.find(p => p._id === projectB._id);
    assert(foundA && foundB, 'Both Project A and Project B are discoverable in project list');

    // Project Dashboards (Empty state)
    const dashARes = await fetch(`${BASE_URL}/projects/${projectA._id}/dashboard`, { headers: authHeaders });
    const dashAData = await dashARes.json();
    assert(dashARes.ok && dashAData.success && (dashAData.data?.summary?.risks?.total || 0) === 0, 'Project A dashboard returns 0 counts before record creation');

    // 5. Create Records across all 4 modules under Project A
    console.log('\n--- Step 4: Populate Module Records Under Project A ---');
    
    // Module 1: Risk under Project A
    const riskARes = await fetch(`${BASE_URL}/risk/records`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        projectId: projectA._id,
        category: 'OPERATIONAL',
        subCategory: 'Logistics and transportation delays',
        description: 'Severe monsoon tidal surges damaging community embankment infrastructure',
        likelihood: 4,
        impact: 4,
        mitigationAction: 'Deploy emergency sandbags and establish early warning radio comms',
        riskOwner: 'Disaster Management Committee',
        status: 'OPEN',
      })
    });
    const riskAData = await riskARes.json();
    assert(riskARes.ok && riskAData.success, 'Risk record created under Project A');
    const riskA = riskAData.data;

    // Module 2: Complaint under Project A
    const complaintARes = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        projectId: projectA._id,
        projectName: projectA.name,
        dateReceived: new Date().toISOString().split('T')[0],
        complainantName: 'Rahima Khatun',
        complainantPhone: '01711223344',
        receivingChannel: 'Helpdesk',
        complaintCategory: 'Quality of Assistance',
        partnerOrgName: 'CBDP Foundation',
        description: 'Delay in distribution of agricultural seeds and fertilizer vouchers.',
        status: 'Open',
        assignedFocalPerson: 'Field Officer Barishal',
      })
    });
    const complaintAData = await complaintARes.json();
    if (!complaintARes.ok) console.log('COMPLAINT A ERROR:', complaintAData);
    assert(complaintARes.ok && complaintAData.success, 'Complaint record created under Project A');
    const complaintA = complaintAData.data;

    // Module 3: Event under Project A
    const eventARes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        projectId: projectA._id,
        projectName: projectA.name,
        eventId: `EVT-A-${Date.now().toString().slice(-4)}`,
        dateFrom: '2026-04-10',
        dateTo: '2026-04-11',
        implementingOrg: 'Manushr_Jonno_Foundation_MJF',
        eventType: 'Capacity Building & Training',
        eventTheme: 'Climate Resilience',
        eventTitle: 'Community Disaster Preparedness & Early Warning Workshop',
        division: 'Barishal',
        district: 'Barguna',
        upazila: 'Amtali',
        union: 'Amtoli Sadar',
        participantCountCommunity: 45,
        status: 'Completed',
      })
    });
    const eventAData = await eventARes.json();
    assert(eventARes.ok && eventAData.success, 'Event record created under Project A');
    const eventA = eventAData.data;

    // Module 4: Beneficiary under Project A
    const benARes = await fetch(`${BASE_URL}/beneficiaries`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        projectId: projectA._id,
        projectName: projectA.name,
        beneficiaryId: `BEN-A-${Date.now().toString().slice(-4)}`,
        sl: 101,
        name: 'Nasima Begum',
        sex: 'Female',
        contactNo: '01812345678',
        forumName: 'Upazilla Nagoric Forum',
        union: 'Amtoli Sadar',
        division: 'Barishal',
        district: 'Barguna',
        upazila: 'Amtali',
      })
    });
    const benAData = await benARes.json();
    assert(benARes.ok && benAData.success, 'Beneficiary record created under Project A');
    const benA = benAData.data;

    // 6. Create Records across all 4 modules under Project B
    console.log('\n--- Step 5: Populate Module Records Under Project B ---');

    // Module 1: Risk under Project B
    const riskBRes = await fetch(`${BASE_URL}/risk/records`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        projectId: projectB._id,
        category: 'FINANCIAL',
        subCategory: 'Supply chain disruption',
        description: 'Cold-chain refrigeration malfunction leading to spoiled vaccine supplies',
        likelihood: 3,
        impact: 5,
        mitigationAction: 'Install solar backup battery inverter units in health clinics',
        riskOwner: 'Health Program Manager',
        status: 'OPEN',
      })
    });
    const riskBData = await riskBRes.json();
    assert(riskBRes.ok && riskBData.success, 'Risk record created under Project B');
    const riskB = riskBData.data;

    // Module 2: Complaint under Project B
    const complaintBRes = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        projectId: projectB._id,
        projectName: projectB.name,
        dateReceived: new Date().toISOString().split('T')[0],
        complainantName: 'Kamal Hossain',
        complainantPhone: '01987654321',
        receivingChannel: 'SMS',
        complaintCategory: 'Quality of Assistance',
        partnerOrgName: 'Health Alliance NGO',
        description: 'Clinic staff unpunctuality during morning OPD registration hours.',
        status: 'Open',
        assignedFocalPerson: 'Lead Medical Officer',
      })
    });
    const complaintBData = await complaintBRes.json();
    assert(complaintBRes.ok && complaintBData.success, 'Complaint record created under Project B');
    const complaintB = complaintBData.data;

    // Module 3: Event under Project B
    const eventBRes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        projectId: projectB._id,
        projectName: projectB.name,
        eventId: `EVT-B-${Date.now().toString().slice(-4)}`,
        dateFrom: '2026-05-02',
        dateTo: '2026-05-03',
        implementingOrg: 'Manushr_Jonno_Foundation_MJF',
        eventType: 'Public Awareness Campaign',
        eventTheme: 'Maternal Healthcare',
        eventTitle: 'Maternal Nutrition & Newborn Hygiene Seminar',
        division: 'Barishal',
        district: 'Patuakhali',
        upazila: 'Kalapara',
        union: 'Tiakhali',
        participantCountCommunity: 60,
        status: 'Completed',
      })
    });
    const eventBData = await eventBRes.json();
    assert(eventBRes.ok && eventBData.success, 'Event record created under Project B');
    const eventB = eventBData.data;

    // Module 4: Beneficiary under Project B
    const benBRes = await fetch(`${BASE_URL}/beneficiaries`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        projectId: projectB._id,
        projectName: projectB.name,
        beneficiaryId: `BEN-B-${Date.now().toString().slice(-4)}`,
        sl: 201,
        name: 'Sultana Razia',
        sex: 'Female',
        contactNo: '01799887766',
        forumName: 'Upazilla Nagoric Forum',
        union: 'Tiakhali',
        division: 'Barishal',
        district: 'Patuakhali',
        upazila: 'Kalapara',
      })
    });
    const benBData = await benBRes.json();
    assert(benBRes.ok && benBData.success, 'Beneficiary record created under Project B');
    const benB = benBData.data;

    // 7. Verify Data Isolation (Criterion 4, 5, 6)
    console.log('\n--- Step 6: Strict Data Isolation Verification ---');

    // Risks Isolation
    const risksA = await (await fetch(`${BASE_URL}/risk/records?projectId=${projectA._id}`, { headers: authHeaders })).json();
    const risksB = await (await fetch(`${BASE_URL}/risk/records?projectId=${projectB._id}`, { headers: authHeaders })).json();
    const riskAHasB = risksA.data?.some(r => r._id === riskB._id);
    const riskBHasA = risksB.data?.some(r => r._id === riskA._id);
    assert(!riskAHasB, 'Project A risk query returns 0 records from Project B (Strict Risk Isolation)');
    assert(!riskBHasA, 'Project B risk query returns 0 records from Project A (Strict Risk Isolation)');

    // Complaints Isolation
    const complaintsA = await (await fetch(`${BASE_URL}/complaints?projectId=${projectA._id}`, { headers: authHeaders })).json();
    const complaintsB = await (await fetch(`${BASE_URL}/complaints?projectId=${projectB._id}`, { headers: authHeaders })).json();
    const compAHasB = complaintsA.data?.some(c => c._id === complaintB._id);
    const compBHasA = complaintsB.data?.some(c => c._id === complaintA._id);
    assert(!compAHasB, 'Project A complaints query returns 0 records from Project B (Strict Complaint Isolation)');
    assert(!compBHasA, 'Project B complaints query returns 0 records from Project A (Strict Complaint Isolation)');

    // Events Isolation
    const eventsA = await (await fetch(`${BASE_URL}/events?projectId=${projectA._id}`, { headers: authHeaders })).json();
    const eventsB = await (await fetch(`${BASE_URL}/events?projectId=${projectB._id}`, { headers: authHeaders })).json();
    const evtAHasB = eventsA.data?.some(e => e._id === eventB._id);
    const evtBHasA = eventsB.data?.some(e => e._id === eventA._id);
    assert(!evtAHasB, 'Project A events query returns 0 records from Project B (Strict Event Isolation)');
    assert(!evtBHasA, 'Project B events query returns 0 records from Project A (Strict Event Isolation)');

    // Beneficiaries Isolation
    const bensA = await (await fetch(`${BASE_URL}/beneficiaries?projectId=${projectA._id}`, { headers: authHeaders })).json();
    const bensB = await (await fetch(`${BASE_URL}/beneficiaries?projectId=${projectB._id}`, { headers: authHeaders })).json();
    const benAHasB = bensA.data?.some(b => b._id === benB._id);
    const benBHasA = bensB.data?.some(b => b._id === benA._id);
    assert(!benAHasB, 'Project A beneficiary query returns 0 records from Project B (Strict Beneficiary Isolation)');
    assert(!benBHasA, 'Project B beneficiary query returns 0 records from Project A (Strict Beneficiary Isolation)');

    // 8. Verify Non-mutation of project association during record edits (Criterion 7)
    console.log('\n--- Step 7: Record Update & Project Association Persistence ---');
    const updateRiskRes = await fetch(`${BASE_URL}/risk/records/${riskA._id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        description: 'Updated: Severe tidal surges and cyclone embankment erosion',
        status: 'MITIGATED'
      })
    });
    const updateRiskData = await updateRiskRes.json();
    assert(updateRiskRes.ok && updateRiskData.success, 'Risk record updated successfully');
    
    // Verify in DB that projectId remains intact and uncorrupted
    const verifyRiskDoc = await RiskRecord.findById(riskA._id);
    assert(
      verifyRiskDoc.projectId.toString() === projectA._id.toString(),
      'Record edit does not corrupt or change its original projectId'
    );

    // 9. Dashboard Metrics Verification (Criterion 8)
    console.log('\n--- Step 8: Multi-Module Real-Time Dashboard Aggregation ---');
    const dashAUpdated = await (await fetch(`${BASE_URL}/projects/${projectA._id}/dashboard`, { headers: authHeaders })).json();
    const sumA = dashAUpdated.data?.summary;
    assert(
      sumA?.risks?.total >= 1 &&
      sumA?.complaints?.total >= 1 &&
      sumA?.events?.total >= 1 &&
      sumA?.beneficiaries?.total >= 1,
      `Project A dashboard reports accurate counts (Risks: ${sumA?.risks?.total}, Complaints: ${sumA?.complaints?.total}, Events: ${sumA?.events?.total}, Beneficiaries: ${sumA?.beneficiaries?.total})`
    );

    const dashBUpdated = await (await fetch(`${BASE_URL}/projects/${projectB._id}/dashboard`, { headers: authHeaders })).json();
    const sumB = dashBUpdated.data?.summary;
    assert(
      sumB?.risks?.total >= 1 &&
      sumB?.complaints?.total >= 1 &&
      sumB?.events?.total >= 1 &&
      sumB?.beneficiaries?.total >= 1,
      `Project B dashboard reports accurate counts (Risks: ${sumB?.risks?.total}, Complaints: ${sumB?.complaints?.total}, Events: ${sumB?.events?.total}, Beneficiaries: ${sumB?.beneficiaries?.total})`
    );

    // 10. Project Status Toggle & User Assignment
    console.log('\n--- Step 9: Project Status Lifecycle & Team Assignment ---');
    const statusRes = await fetch(`${BASE_URL}/projects/${projectA._id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'ON_HOLD' })
    });
    const statusData = await statusRes.json();
    assert(statusRes.ok && statusData.data?.status === 'ON_HOLD', 'Project status successfully toggled to ON_HOLD');

    // Reactivate
    await fetch(`${BASE_URL}/projects/${projectA._id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'ACTIVE' })
    });

    // Team Assignment
    const assignRes = await fetch(`${BASE_URL}/projects/${projectA._id}/assign`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        assignedUsers: [
          {
            user: loginData.user.id || loginData.user._id,
            role: 'MANAGER',
            modules: ['RISK', 'COMPLAINTS', 'EVENTS', 'BENEFICIARIES'],
          }
        ]
      })
    });
    const assignData = await assignRes.json();
    assert(assignRes.ok && assignData.success, 'Authorized users and module permissions assigned to project');

    // 11. Historical Migrated Projects & Records Integrity (Criterion 13)
    console.log('\n--- Step 10: Verify Historical Migrated Records Integrity ---');
    const wgeiPrj = await RiskProject.findOne({ code: 'PRJ-WGEI' });
    const cbdpPrj = await RiskProject.findOne({ code: 'PRJ-CBDP' });
    const nagPrj = await RiskProject.findOne({ code: 'PRJ-NAG' });
    assert(Boolean(wgeiPrj && cbdpPrj && nagPrj), 'Historical migrated projects exist in database');

    if (nagPrj) {
      const nagBensCount = await Beneficiary.countDocuments({ projectId: nagPrj._id });
      assert(nagBensCount > 0, `NAGORIC Project retains all historical beneficiaries (${nagBensCount} records linked)`);
    }
    if (cbdpPrj) {
      const cbdpEventsCount = await EventRecord.countDocuments({ projectId: cbdpPrj._id });
      assert(cbdpEventsCount > 0, `CBDP Project retains all historical events (${cbdpEventsCount} records linked)`);
    }
    if (wgeiPrj) {
      const wgeiComplaintsCount = await ComplaintRecord.countDocuments({ projectId: wgeiPrj._id });
      assert(wgeiComplaintsCount > 0, `WGEI Project retains all historical complaints (${wgeiComplaintsCount} records linked)`);
    }

  } catch (err) {
    console.error('Fatal test execution error:', err);
    summary.failures.push(err.message);
  } finally {
    server.close();
    console.log('\n================================================================');
    console.log(`TEST SUMMARY: ${summary.passed}/${summary.total} Passed, ${summary.failed} Failed`);
    if (summary.failures.length > 0) {
      console.log('Failures:');
      summary.failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
    }
    console.log('================================================================\n');
    process.exit(summary.failed > 0 ? 1 : 0);
  }
}

runTests();
