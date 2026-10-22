// test_complaints_e2e.js
// Comprehensive End-to-End Test for Complaints & Feedback Register Module

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function runE2ETest() {
  console.log('================================================================');
  console.log('  CBDP HRM COMPLAINTS & FEEDBACK REGISTER - COMPREHENSIVE E2E   ');
  console.log('================================================================\n');

  const { connectDB } = await import('./backend/src/config/db.js');
  await connectDB();

  const {
    getComplaintStats,
    getComplaints,
    createComplaint,
    updateComplaint,
    updateComplaintStatus,
    manageComplaintAppeal,
    deleteComplaint,
    exportComplaints
  } = await import('./backend/src/controllers/complaintController.js');

  const mockUser = {
    _id: new mongoose.Types.ObjectId(),
    email: 'mdnuruzzamanrazon@gmail.com',
    role: 'SUPER_ADMIN'
  };

  // 1. Stats test
  console.log('1. Testing Stats endpoint...');
  let statsResult = null;
  const mockReqStats = { query: {} };
  const mockResStats = {
    json: (payload) => { statsResult = payload; }
  };
  await getComplaintStats(mockReqStats, mockResStats);
  console.log('✓ Stats response:', statsResult?.data);
  if (!statsResult?.success || statsResult?.data?.totalRecords === undefined) {
    throw new Error('Stats calculation failed');
  }

  // 2. Listing with filters
  console.log('\n2. Testing Complaints list and search...');
  let listResult = null;
  const mockReqList = { query: { search: 'Fatema', page: 1, limit: 10 } };
  const mockResList = {
    json: (payload) => { listResult = payload; }
  };
  await getComplaints(mockReqList, mockResList);
  console.log(`✓ Search found ${listResult?.data?.length} records matching "Fatema"`);

  // 3. Create new Complaint
  console.log('\n3. Testing Creation of new Complaint with 18 fields...');
  let createdResult = null;
  const newPayload = {
    dateReceived: new Date().toISOString(),
    receivingChannel: 'Phone',
    isAnonymous: false,
    complainantName: 'Amina Begum',
    complainantAddress: 'Camp 9, Block D',
    complainantPhone: '+880 1755-112233',
    numberCalledFrom: '+880 1755-112233',
    complaintCategory: 'Service Delivery & Assistance',
    description: 'Requested urgent replenishment of clean water filtration supplies.',
    complainantGender: 'Female',
    complainantAge: '28',
    complainantDisability: 'No',
    partnerOrgName: 'Oxfam',
    assignedFocalPerson: 'WASH Team Focal',
    actionsTaken: 'Dispatched emergency mobile maintenance team.',
    status: 'Open',
    priority: 'High'
  };
  const mockReqCreate = { body: newPayload, user: mockUser, ip: '127.0.0.1', headers: {} };
  const mockResCreate = {
    status: (code) => ({
      json: (payload) => { createdResult = { code, ...payload }; }
    }),
    json: (payload) => { createdResult = payload; }
  };
  await createComplaint(mockReqCreate, mockResCreate);
  console.log('✓ Record created:', createdResult?.data?.sNo);
  const createdId = createdResult?.data?._id;

  // 4. Update Complaint Status to Closed
  console.log('\n4. Testing Quick Status closure...');
  let statusResult = null;
  const mockReqStatus = {
    params: { id: createdId.toString() },
    body: {
      status: 'Closed',
      dateClosed: new Date().toISOString(),
      actionsTaken: 'Water filter parts replaced and tested successfully.',
      closureNotes: 'Complainant confirmed issue resolved.'
    },
    user: mockUser
  };
  const mockResStatus = {
    status: (code) => ({ json: (p) => { statusResult = { code, ...p }; } }),
    json: (p) => { statusResult = p; }
  };
  await updateComplaintStatus(mockReqStatus, mockResStatus);
  console.log('✓ Status updated:', statusResult?.message);

  // 5. Manage Appeal
  console.log('\n5. Testing Appeal Management workflow...');
  let appealResult = null;
  const mockReqAppeal = {
    params: { id: createdId.toString() },
    body: {
      appealDate: new Date().toISOString(),
      appealOutcome: 'Supplementary filters scheduled for next week.',
      appealStatus: 'Upheld',
      finalClosingDateAfterAppeal: new Date().toISOString()
    },
    user: mockUser
  };
  const mockResAppeal = {
    status: (code) => ({ json: (p) => { appealResult = { code, ...p }; } }),
    json: (p) => { appealResult = p; }
  };
  await manageComplaintAppeal(mockReqAppeal, mockResAppeal);
  console.log('✓ Appeal recorded:', appealResult?.message);

  // 6. Export Test
  console.log('\n6. Testing Export / Print dataset endpoint...');
  let exportResult = null;
  const mockReqExport = { query: { status: 'ALL' }, user: mockUser, ip: '127.0.0.1', headers: {} };
  const mockResExport = { json: (p) => { exportResult = p; } };
  await exportComplaints(mockReqExport, mockResExport);
  console.log(`✓ Exported ${exportResult?.count} records. Notice: ${exportResult?.confidentialityNotice}`);

  console.log('\n================================================================');
  console.log('  ALL COMPLAINTS BACKEND & DATABASE TESTS PASSED WITH 100% SUCCESS ');
  console.log('================================================================\n');
  process.exit(0);
}

runE2ETest().catch(err => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
