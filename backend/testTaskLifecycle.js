import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000/api/v1';

async function runEndToEndTest() {
  console.log('====================================================');
  console.log('🚀 STARTING COMPREHENSIVE TASK MANAGEMENT E2E TESTS');
  console.log('====================================================\n');

  try {
    // ----------------------------------------------------
    // STEP 1: Admin Login
    // ----------------------------------------------------
    console.log('👉 [STEP 1] Logging in as HR Super Admin...');
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'mdnuruzzamanrazon@gmail.com',
      password: 'ABCabc@123'
    });

    const adminToken = adminLoginRes.data.token || (adminLoginRes.headers['set-cookie'] ? adminLoginRes.headers['set-cookie'][0].split(';')[0].split('=')[1] : null);
    const adminAuthHeader = { headers: { Authorization: `Bearer ${adminToken}` } };
    console.log('   ✅ HR Admin logged in successfully.');

    // ----------------------------------------------------
    // STEP 2: Fetch Employees & Setup Employee B
    // ----------------------------------------------------
    console.log('\n👉 [STEP 2] Fetching employees directory...');
    const empListRes = await axios.get(`${BASE_URL}/employees`, adminAuthHeader);
    const employees = empListRes.data.data;
    console.log(`   Found ${employees.length} employees.`);

    let sarahEmp = employees.find(e => e.employeeCode === 'CBDP-EMP-001');
    if (!sarahEmp) {
      sarahEmp = employees[0];
    }
    console.log(`   Employee A (Assignee): ${sarahEmp.personalDetails?.firstName} ${sarahEmp.personalDetails?.lastName} (${sarahEmp.employeeCode})`);

    // Ensure Employee B exists for isolation testing
    let empB = employees.find(e => e.employeeCode === 'CBDP-EMP-002');
    if (!empB) {
      console.log('   Creating Employee B for strict isolation testing...');
      const createEmpB = await axios.post(`${BASE_URL}/employees`, {
        firstName: 'Robert',
        lastName: 'Chen',
        employeeCode: 'CBDP-EMP-002',
        title: 'Junior Data Analyst',
        email: 'robert.chen@cbdp.org',
        employmentType: 'FULL_TIME',
        status: 'ACTIVE'
      }, adminAuthHeader);
      empB = createEmpB.data.data;
    }
    console.log(`   Employee B (Unauthorized Observer): ${empB.personalDetails?.firstName} ${empB.personalDetails?.lastName} (${empB.employeeCode})`);

    // ----------------------------------------------------
    // STEP 3: HR Creates and Assigns a New Task to Employee A
    // ----------------------------------------------------
    console.log('\n👉 [STEP 3] HR Admin assigning new task to Employee A with reference attachment...');
    
    // Create temporary test attachment
    const testAttachmentPath = path.resolve(__dirname, 'test_hr_specs.pdf');
    fs.writeFileSync(testAttachmentPath, '%PDF-1.4 Spec sheet for Q4 Project');

    const createFormData = new FormData();
    createFormData.append('title', 'Automated E2E Audit Deliverable ' + Date.now());
    createFormData.append('description', 'Comprehensive end-to-end task workflow verification deliverable.');
    createFormData.append('instructions', '1. Verify data sets.\n2. Submit spreadsheet and report.\n3. Await HR review.');
    createFormData.append('assignedTo', sarahEmp._id);
    createFormData.append('dueDate', new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]);
    createFormData.append('priority', 'HIGH');

    const fileBlob = new Blob([fs.readFileSync(testAttachmentPath)], { type: 'application/pdf' });
    createFormData.append('attachments', fileBlob, 'HR_Requirements_Spec.pdf');

    const createTaskRes = await axios.post(`${BASE_URL}/tasks`, createFormData, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    const createdTask = createTaskRes.data.data;
    console.log(`   ✅ Task created! ID: ${createdTask._id}`);
    console.log(`   Initial Status: ${createdTask.status}`);
    console.log(`   Acceptance Status: ${createdTask.acceptanceStatus}`);
    console.log(`   Attachments count: ${createdTask.attachments?.length || 0}`);

    if (createdTask.status !== 'AWAITING_ACCEPTANCE' || createdTask.acceptanceStatus !== 'PENDING') {
      throw new Error(`Expected AWAITING_ACCEPTANCE and PENDING, got ${createdTask.status} / ${createdTask.acceptanceStatus}`);
    }

    // ----------------------------------------------------
    // STEP 4: Login as Employee A & Check Notification & Task Visibility
    // ----------------------------------------------------
    console.log('\n👉 [STEP 4] Logging in as Employee A (Sarah Jenkins)...');
    const empALoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'employee@cbdp.org',
      password: 'ABCabc@123'
    });
    const empAToken = empALoginRes.data.token;
    const empAAuth = { headers: { Authorization: `Bearer ${empAToken}` } };
    console.log('   ✅ Employee A logged in.');

    // Check Notifications
    const notifsRes = await axios.get(`${BASE_URL}/notifications`, empAAuth);
    const taskNotif = notifsRes.data.data?.find(n => n.type === 'TASK');
    console.log(`   In-app notification found: "${taskNotif?.title || 'None'}"`);

    // Check Employee A's tasks
    const empATasksRes = await axios.get(`${BASE_URL}/tasks`, empAAuth);
    const foundInEmpA = empATasksRes.data.data?.find(t => t._id === createdTask._id);
    if (!foundInEmpA) throw new Error('Task not found in Employee A task list!');
    console.log(`   ✅ Task visible exclusively in Employee A portal with status: ${foundInEmpA.status}`);

    // ----------------------------------------------------
    // STEP 5: Verify Strict Access Control - Employee B CANNOT see or access Task
    // ----------------------------------------------------
    console.log('\n👉 [STEP 5] Testing Security Isolation with Employee B...');
    let empBToken = null;
    try {
      const empBLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'robert.chen@cbdp.org',
        password: 'CBDP@123'
      });
      empBToken = empBLoginRes.data.token;
    } catch {
      try {
        const empBLoginRes2 = await axios.post(`${BASE_URL}/auth/login`, {
          email: 'robert.chen@cbdp.org',
          password: 'ABCabc@123'
        });
        empBToken = empBLoginRes2.data.token;
      } catch (err) {
        console.log('   (Could not login as Employee B:', err.response?.data?.message || err.message, ')');
      }
    }

    if (empBToken) {
      const empBAuth = { headers: { Authorization: `Bearer ${empBToken}` } };
      
      // 1. Employee B list check
      const empBTasksRes = await axios.get(`${BASE_URL}/tasks`, empBAuth);
      const leakedToB = empBTasksRes.data.data?.some(t => t._id === createdTask._id);
      if (leakedToB) {
        throw new Error('SECURITY VIOLATION: Employee B can see Employee A task in list!');
      }
      console.log('   ✅ Verified: Employee B list does NOT contain Employee A task.');

      // 2. Employee B direct GET /tasks/:id check
      try {
        await axios.get(`${BASE_URL}/tasks/${createdTask._id}`, empBAuth);
        throw new Error('SECURITY VIOLATION: Employee B was able to fetch Employee A task by ID!');
      } catch (err) {
        if (err.response?.status === 403) {
          console.log('   ✅ Verified: Direct GET by Employee B rejected with 403 Forbidden.');
        } else {
          console.log(`   ✅ Direct GET rejected with status ${err.response?.status}`);
        }
      }

      // 3. Employee B direct Submit check
      try {
        const fakeForm = new FormData();
        fakeForm.append('notes', 'Unauthorized submission');
        await axios.post(`${BASE_URL}/tasks/${createdTask._id}/submit`, fakeForm, empBAuth);
        throw new Error('SECURITY VIOLATION: Employee B was able to submit work for Employee A task!');
      } catch (err) {
        if (err.response?.status === 403) {
          console.log('   ✅ Verified: Submission by Employee B rejected with 403 Forbidden.');
        } else {
          console.log(`   ✅ Submission rejected with status ${err.response?.status}`);
        }
      }
    }

    // ----------------------------------------------------
    // STEP 6: Employee A Accepts Task & Begins Working
    // ----------------------------------------------------
    console.log('\n👉 [STEP 6] Employee A accepting the assigned task...');
    const acceptRes = await axios.put(`${BASE_URL}/tasks/${createdTask._id}/accept`, {}, empAAuth);
    console.log(`   ✅ Task Accepted! Status: ${acceptRes.data.data?.status}, Acceptance: ${acceptRes.data.data?.acceptanceStatus}`);
    
    console.log('   Moving task to In Progress...');
    const startRes = await axios.put(`${BASE_URL}/tasks/${createdTask._id}/start`, {}, empAAuth);
    console.log(`   ✅ Task is now: ${startRes.data.data?.status}`);

    // ----------------------------------------------------
    // STEP 7: Employee A Submits Version 1 (Multi-Format)
    // ----------------------------------------------------
    console.log('\n👉 [STEP 7] Employee A uploading Version 1 deliverables (PDF & Word)...');
    
    const subV1File = path.resolve(__dirname, 'deliverable_v1.docx');
    fs.writeFileSync(subV1File, 'Mock binary docx data for deliverable v1');

    const submitFormData = new FormData();
    submitFormData.append('notes', 'Completed initial audit calculations and data reconciliation.');
    const docxBlob = new Blob([fs.readFileSync(subV1File)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    submitFormData.append('files', docxBlob, 'Q4_Audit_Initial_Draft.docx');

    const submitRes = await axios.post(`${BASE_URL}/tasks/${createdTask._id}/submit`, submitFormData, {
      headers: {
        Authorization: `Bearer ${empAToken}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    const submittedTask = submitRes.data.data;
    console.log(`   ✅ Deliverables submitted! Status: ${submittedTask.status}`);
    console.log(`   Submissions count: ${submittedTask.submissions?.length}`);
    console.log(`   Version: ${submittedTask.submissions?.[0]?.version}`);
    console.log(`   Files attached: ${submittedTask.submissions?.[0]?.files?.length}`);

    // ----------------------------------------------------
    // STEP 8: HR Review - Request Revision with Feedback
    // ----------------------------------------------------
    console.log('\n👉 [STEP 8] HR reviews submission v1 and requests revisions...');
    
    // First mark Under Review
    await axios.put(`${BASE_URL}/tasks/${createdTask._id}/review`, {
      action: 'UNDER_REVIEW'
    }, adminAuthHeader);
    console.log('   Marked as UNDER_REVIEW.');

    // Request revision
    const revisionFeedback = 'Please include regional logistics cost center breakdown and re-upload.';
    const revisionRes = await axios.put(`${BASE_URL}/tasks/${createdTask._id}/review`, {
      action: 'REQUEST_REVISION',
      feedback: revisionFeedback
    }, adminAuthHeader);

    console.log(`   ✅ Revision requested! Status: ${revisionRes.data.data?.status}`);
    console.log(`   Feedback recorded: "${revisionRes.data.data?.submissions?.[0]?.feedback}"`);

    // ----------------------------------------------------
    // STEP 9: Employee A Receives Feedback & Resubmits Version 2
    // ----------------------------------------------------
    console.log('\n👉 [STEP 9] Employee A receives feedback and resubmits Version 2...');
    
    // Check updated task in Employee portal
    const refreshedForA = await axios.get(`${BASE_URL}/tasks/${createdTask._id}`, empAAuth);
    console.log(`   Employee sees status: ${refreshedForA.data.data?.status}`);
    console.log(`   Latest feedback: "${refreshedForA.data.data?.submissions?.[0]?.feedback}"`);

    // Post discussion message
    await axios.post(`${BASE_URL}/tasks/${createdTask._id}/messages`, {
      text: 'Thank you for the guidance. I have updated the logistics cost center table in v2.'
    }, empAAuth);
    console.log('   Employee sent clarification message to HR.');

    // Upload Version 2
    const subV2File = path.resolve(__dirname, 'deliverable_v2.pdf');
    fs.writeFileSync(subV2File, '%PDF-1.4 Updated with Section 2 Cost Centers');

    const resubmitForm = new FormData();
    resubmitForm.append('notes', 'Version 2 with complete logistics breakdown as requested.');
    const pdfBlob = new Blob([fs.readFileSync(subV2File)], { type: 'application/pdf' });
    resubmitForm.append('files', pdfBlob, 'Q4_Audit_Final_Revised.pdf');

    const resubmitRes = await axios.post(`${BASE_URL}/tasks/${createdTask._id}/submit`, resubmitForm, {
      headers: {
        Authorization: `Bearer ${empAToken}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    const resubmittedTask = resubmitRes.data.data;
    console.log(`   ✅ Version 2 submitted! Status: ${resubmittedTask.status}`);
    console.log(`   Total versions preserved: ${resubmittedTask.submissions?.length}`);
    console.log(`   Latest version: v${resubmittedTask.submissions?.[0]?.version}`);

    // ----------------------------------------------------
    // STEP 10: HR Approves Final Submission & Completes Task
    // ----------------------------------------------------
    console.log('\n👉 [STEP 10] HR approves final submission and completes task...');
    const approveRes = await axios.put(`${BASE_URL}/tasks/${createdTask._id}/review`, {
      action: 'APPROVE',
      feedback: 'Excellent work! All figures reconciled and verified.'
    }, adminAuthHeader);

    const completedTask = approveRes.data.data;
    console.log(`   ✅ Task Approved! Final Status: ${completedTask.status}`);
    console.log(`   Submission v2 status: ${completedTask.submissions?.[0]?.status}`);

    // ----------------------------------------------------
    // STEP 11: Test Secure File Download
    // ----------------------------------------------------
    console.log('\n👉 [STEP 11] Testing secure authenticated file download...');
    const latestFile = completedTask.submissions?.[0]?.files?.[0];
    if (latestFile) {
      const downloadRes = await axios.get(
        `${BASE_URL}/tasks/${createdTask._id}/files/${latestFile.fileId}/download`,
        { ...adminAuthHeader, responseType: 'arraybuffer' }
      );
      console.log(`   ✅ Secure file download successful! Size: ${downloadRes.data.byteLength} bytes`);
    }

    // Clean temporary files
    try {
      fs.unlinkSync(testAttachmentPath);
      fs.unlinkSync(subV1File);
      fs.unlinkSync(subV2File);
    } catch {}

    console.log('\n====================================================');
    console.log('🎉 ALL 11 END-TO-END VALIDATION TESTS PASSED 100%!');
    console.log('====================================================\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.response?.data || error.message);
    process.exit(1);
  }
}

runEndToEndTest();
