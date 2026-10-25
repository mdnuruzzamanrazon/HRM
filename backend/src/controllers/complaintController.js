import mongoose from 'mongoose';
import { ComplaintRecord } from '../models/ComplaintRecord.js';
import { RiskProject } from '../models/RiskProject.js';
import { AuditLog } from '../models/AuditLog.js';
import { isDemoMode } from '../config/db.js';
import { mockData, saveStoreToDisk } from '../services/mockDataService.js';

// Pre-configured channels matching project guidelines & standard humanitarian/NGO reporting channels
export const DEFAULT_RECEIVING_CHANNELS = [
  'Phone',
  'Email',
  'In-Person',
  'Suggestion Box',
  'Website / Online Form',
  'Community Helpdesk',
  'SMS / WhatsApp',
  'Other'
];

// Pre-configured categories matching official project safeguarding and operational register
export const DEFAULT_COMPLAINT_CATEGORIES = [
  'Staff Conduct & Safeguarding',
  'Programme Quality & Delivery',
  'Procurement & Financial Management',
  'Aid Diversion & Corruption',
  'Harassment & Discrimination',
  'Information Request & Inquiry',
  'Community Relations & Respect',
  'Service Delivery & Assistance',
  'Other'
];

// Sample seed data to ensure instant operational utility
export const SAMPLE_COMPLAINT_RECORDS = [
  {
    sNo: 'CFR-2026-0001',
    seqNumber: 1,
    projectName: 'CBDP Women & Girls Empowerment Initiative',
    dateReceived: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000), // 42 days ago -> Overdue >30 days
    receivingChannel: 'Phone',
    receivingChannelOther: '',
    isAnonymous: false,
    complainantName: 'Fatema Begum',
    complainantAddress: 'Ward 4, Ukhiya Community Zone, Cox\'s Bazar',
    complainantPhone: '+880 1712-345678',
    numberCalledFrom: '+880 1819-876543',
    complaintCategory: 'Programme Quality & Delivery',
    complaintCategoryOther: '',
    description: 'Beneficiaries reported a 2-week delay in the distribution of family hygiene kits and lack of clear distribution schedules at the field station.',
    complainantGender: 'Female',
    complainantAge: '32',
    complainantDisability: 'No',
    partnerOrgName: 'Oxfam',
    assignedFocalPerson: 'Program Officer (WASH / Safeguarding)',
    actionsTaken: 'Field officer verified the supply chain consignment delay at local depot. Rescheduled distribution calendar communicated to local committee.',
    delayReason: 'Supply consignment delayed at port customs inspection; local partner awaiting replenishment delivery before final distribution.',
    isComplainantNotifiedOfDelay: 'Yes',
    delayNotificationDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    delayNotificationNotes: 'Complainant called via field phone on 13th Oct and confirmed understanding of the revised distribution schedule.',
    status: 'Open',
    dateClosed: null,
    hasAppeal: false,
    appealDate: null,
    appealOutcome: '',
    appealStatus: 'None',
    finalClosingDateAfterAppeal: null,
    priority: 'High',
    confidentialityLevel: 'Confidential',
    auditTrail: [
      {
        action: 'CREATED',
        performedBy: 'HR Lead Officer',
        userEmail: 'mdnuruzzamanrazon@gmail.com',
        role: 'SUPER_ADMIN',
        timestamp: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
        details: 'Initial record logged from hotline telephone intake.'
      },
      {
        action: 'DELAY_LOGGED',
        performedBy: 'HR Lead Officer',
        userEmail: 'mdnuruzzamanrazon@gmail.com',
        role: 'SUPER_ADMIN',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        details: '30-day delay reason logged and complainant notified.'
      }
    ]
  },
  {
    sNo: 'CFR-2026-0002',
    seqNumber: 2,
    projectName: 'CBDP Women & Girls Empowerment Initiative',
    dateReceived: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    receivingChannel: 'Phone',
    receivingChannelOther: '',
    isAnonymous: true,
    complainantName: 'Anonymous Complainant',
    complainantAddress: 'Community Center Cluster 2',
    complainantPhone: 'PROTECTED (Anonymous)',
    numberCalledFrom: '+880 1600-000111',
    complaintCategory: 'Staff Conduct & Safeguarding',
    complaintCategoryOther: '',
    description: 'Anonymous report regarding disrespectful communication and favoritism exhibited by a casual field enumerator during community registration.',
    complainantGender: 'Female',
    complainantAge: '24',
    complainantDisability: 'Prefer not to say',
    partnerOrgName: 'CBDP Foundation',
    assignedFocalPerson: 'Executive Director (Partner ED)',
    actionsTaken: 'Investigated by HR Safeguarding Committee. Enumerator issued formal reprimand and reassigned away from direct community intake.',
    delayReason: '',
    isComplainantNotifiedOfDelay: 'Not applicable',
    delayNotificationDate: null,
    delayNotificationNotes: '',
    status: 'Closed',
    dateClosed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    hasAppeal: false,
    appealDate: null,
    appealOutcome: '',
    appealStatus: 'None',
    finalClosingDateAfterAppeal: null,
    priority: 'Urgent',
    confidentialityLevel: 'Strictly Confidential',
    auditTrail: [
      {
        action: 'CREATED',
        performedBy: 'Safeguarding Specialist',
        userEmail: 'mdnuruzzamanrazon@gmail.com',
        role: 'SUPER_ADMIN',
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        details: 'Anonymous safeguarding telephone report registered.'
      },
      {
        action: 'CLOSED',
        performedBy: 'Safeguarding Specialist',
        userEmail: 'mdnuruzzamanrazon@gmail.com',
        role: 'SUPER_ADMIN',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        details: 'Investigation concluded. Disciplinary measure applied and case marked Closed.'
      }
    ]
  },
  {
    sNo: 'CFR-2026-0003',
    seqNumber: 3,
    projectName: 'CBDP Women & Girls Empowerment Initiative',
    dateReceived: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    receivingChannel: 'Email',
    receivingChannelOther: '',
    isAnonymous: false,
    complainantName: 'Kabir Hossain',
    complainantAddress: 'Bazaar Road, Teknaf Sub-district',
    complainantPhone: '+880 1911-223344',
    numberCalledFrom: '',
    complaintCategory: 'Procurement & Financial Management',
    complaintCategoryOther: '',
    description: 'Vendor claimed delayed processing of transport logistics invoices submitted for community outreach vehicles.',
    complainantGender: 'Male',
    complainantAge: '45',
    complainantDisability: 'No',
    partnerOrgName: 'Oxfam',
    assignedFocalPerson: 'Finance & Compliance Focal',
    actionsTaken: 'Finance unit reconciled supporting log sheets and released the outstanding settlement voucher.',
    delayReason: 'Initial dispute over fuel receipts mileage logs.',
    isComplainantNotifiedOfDelay: 'Yes',
    delayNotificationDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    delayNotificationNotes: 'Email confirmation sent with payment batch date.',
    status: 'Closed',
    dateClosed: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    hasAppeal: true,
    appealDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    appealOutcome: 'Vendor appealed calculation of overtime demurrage charges. Appeal reviewed by Procurement Review Committee; supplementary demurrage approved in full.',
    appealStatus: 'Upheld',
    finalClosingDateAfterAppeal: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    priority: 'Medium',
    confidentialityLevel: 'Standard',
    auditTrail: [
      {
        action: 'CREATED',
        performedBy: 'Finance Officer',
        userEmail: 'mdnuruzzamanrazon@gmail.com',
        role: 'SUPER_ADMIN',
        timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        details: 'Vendor complaint logged.'
      },
      {
        action: 'CLOSED',
        performedBy: 'Finance Officer',
        userEmail: 'mdnuruzzamanrazon@gmail.com',
        role: 'SUPER_ADMIN',
        timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        details: 'Initial closure upon payment.'
      },
      {
        action: 'APPEAL_RECORDED',
        performedBy: 'Executive Director',
        userEmail: 'mdnuruzzamanrazon@gmail.com',
        role: 'SUPER_ADMIN',
        timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        details: 'Vendor formal appeal logged for committee review.'
      },
      {
        action: 'CLOSED',
        performedBy: 'Executive Director',
        userEmail: 'mdnuruzzamanrazon@gmail.com',
        role: 'SUPER_ADMIN',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        details: 'Final closing date after appeal approval.'
      }
    ]
  },
  {
    sNo: 'CFR-2026-0004',
    seqNumber: 4,
    projectName: 'CBDP Women & Girls Empowerment Initiative',
    dateReceived: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    receivingChannel: 'Suggestion Box',
    receivingChannelOther: '',
    isAnonymous: false,
    complainantName: 'Rahima Khatun',
    complainantAddress: 'Community Center 3, Block C',
    complainantPhone: '+880 1822-334455',
    numberCalledFrom: '',
    complaintCategory: 'Service Delivery & Assistance',
    complaintCategoryOther: '',
    description: 'Requested wheelchair accessibility ramp at the primary counseling shed and clean drinking water dispenser in the waiting room.',
    complainantGender: 'Female',
    complainantAge: '38',
    complainantDisability: 'Yes',
    partnerOrgName: 'CBDP Foundation',
    assignedFocalPerson: 'Facilities & Logistics Lead',
    actionsTaken: 'Site inspection conducted. Ramp construction approved and work order issued to local artisan.',
    delayReason: '',
    isComplainantNotifiedOfDelay: 'Not applicable',
    delayNotificationDate: null,
    delayNotificationNotes: '',
    status: 'Open',
    dateClosed: null,
    hasAppeal: false,
    appealDate: null,
    appealOutcome: '',
    appealStatus: 'None',
    finalClosingDateAfterAppeal: null,
    priority: 'Medium',
    confidentialityLevel: 'Confidential',
    auditTrail: [
      {
        action: 'CREATED',
        performedBy: 'Field Coordinator',
        userEmail: 'mdnuruzzamanrazon@gmail.com',
        role: 'SUPER_ADMIN',
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        details: 'Extracted from monthly suggestion box clearance.'
      }
    ]
  },
  {
    sNo: 'CFR-2026-0005',
    seqNumber: 5,
    projectName: 'CBDP Women & Girls Empowerment Initiative',
    dateReceived: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago -> Overdue >30 days
    receivingChannel: 'In-Person',
    receivingChannelOther: '',
    isAnonymous: false,
    complainantName: 'Anowar Ali',
    complainantAddress: 'Palongkhali Union, Camp Peripheral Area',
    complainantPhone: '+880 1733-445566',
    numberCalledFrom: '',
    complaintCategory: 'Information Request & Inquiry',
    complaintCategoryOther: '',
    description: 'Beneficiary requested transparent criteria for selection into the next vocational sewing training cohort.',
    complainantGender: 'Male',
    complainantAge: '29',
    complainantDisability: 'No',
    partnerOrgName: 'Oxfam',
    assignedFocalPerson: 'Livelihoods Officer',
    actionsTaken: 'Public selection criteria leaflet prepared for community noticeboard posting.',
    delayReason: 'Curriculum revision delayed finalizing exact cohort slot counts.',
    isComplainantNotifiedOfDelay: 'Pending',
    delayNotificationDate: null,
    delayNotificationNotes: 'Scheduled to be notified at upcoming weekly community consultation.',
    status: 'Open',
    dateClosed: null,
    hasAppeal: true,
    appealDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    appealOutcome: 'Appeal pending formal ED & Oxfam monthly review session.',
    appealStatus: 'Pending Review',
    finalClosingDateAfterAppeal: null,
    priority: 'Medium',
    confidentialityLevel: 'Standard',
    auditTrail: [
      {
        action: 'CREATED',
        performedBy: 'Field Coordinator',
        userEmail: 'mdnuruzzamanrazon@gmail.com',
        role: 'SUPER_ADMIN',
        timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        details: 'Walk-in consultation recorded at desk.'
      },
      {
        action: 'APPEAL_RECORDED',
        performedBy: 'Field Coordinator',
        userEmail: 'mdnuruzzamanrazon@gmail.com',
        role: 'SUPER_ADMIN',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        details: 'Complainant submitted formal appeal for inclusion in upcoming intake.'
      }
    ]
  }
];

// Seed sample data into MongoDB if empty
export const seedComplaintDataIfEmpty = async () => {
  if (isDemoMode() || mongoose.connection.readyState !== 1) {
    if (!mockData.complaintRecords || mockData.complaintRecords.length === 0) {
      mockData.complaintRecords = JSON.parse(JSON.stringify(SAMPLE_COMPLAINT_RECORDS));
      saveStoreToDisk();
    }
    return;
  }

  try {
    const count = await ComplaintRecord.countDocuments({ isDeleted: { $ne: true } });
    if (count === 0) {
      console.log('[Seed] Seeding initial Complaints & Feedback records into MongoDB...');
      // Look up default project if exists
      const defaultProject = await RiskProject.findOne({ isDefault: true }) || await RiskProject.findOne({});
      const recordsToInsert = SAMPLE_COMPLAINT_RECORDS.map(r => ({
        ...r,
        projectId: defaultProject?._id || null,
        projectName: defaultProject?.name || r.projectName,
      }));
      await ComplaintRecord.insertMany(recordsToInsert);
      console.log(`[Seed] Successfully seeded ${recordsToInsert.length} Complaints & Feedback records.`);
    }
  } catch (err) {
    console.error('[Seed Error] Failed to seed complaint records:', err.message);
  }
};

// Helper to generate the next unique S.No: CFR-YYYY-0001
export const generateNextSNo = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `CFR-${currentYear}-`;

  if (isDemoMode() || mongoose.connection.readyState !== 1) {
    const list = mockData.complaintRecords || [];
    const maxSeq = list.reduce((max, r) => {
      const match = r.sNo?.match(/CFR-\d{4}-(\d+)/);
      const val = match ? parseInt(match[1], 10) : 0;
      return val > max ? val : max;
    }, 0);
    const nextSeq = maxSeq + 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  // Find all existing sNo for this year to compute the true max sequence number
  const existingDocs = await ComplaintRecord.find({
    sNo: new RegExp(`^${prefix}`)
  }).select('sNo seqNumber').lean();

  let maxSeq = 0;
  for (const doc of existingDocs) {
    if (typeof doc.seqNumber === 'number' && doc.seqNumber > maxSeq) {
      maxSeq = doc.seqNumber;
    }
    const match = doc.sNo?.match(/CFR-\d{4}-(\d+)/);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val > maxSeq) maxSeq = val;
    }
  }

  let nextSeq = maxSeq + 1;
  let candidateSNo = `${prefix}${String(nextSeq).padStart(4, '0')}`;

  // Ensure collision-free
  while (await ComplaintRecord.findOne({ sNo: candidateSNo })) {
    nextSeq++;
    candidateSNo = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  return candidateSNo;
};

// -------------------------------------------------------------
// CONTROLLER HANDLERS
// -------------------------------------------------------------

/**
 * @desc Get dynamic summary statistics for the Complaints & Feedback register
 * @route GET /api/v1/complaints/stats
 * @access Authorized HR Roles
 */
export const getComplaintStats = async (req, res) => {
  try {
    await seedComplaintDataIfEmpty();

    const { projectId } = req.query;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // If demo mode or disconnected DB
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      let records = mockData.complaintRecords || [];
      records = records.filter(r => !r.isDeleted);
      if (projectId && projectId !== 'ALL') {
        records = records.filter(r => r.projectId === projectId || r.projectName === projectId);
      }

      const totalRecords = records.length;
      const openComplaints = records.filter(r => r.status === 'Open').length;
      const closedComplaints = records.filter(r => r.status === 'Closed').length;
      const pendingAppeals = records.filter(r => r.hasAppeal && (!r.finalClosingDateAfterAppeal || r.appealStatus === 'Pending Review')).length;
      const overdueComplaints = records.filter(r => r.status === 'Open' && new Date(r.dateReceived) < thirtyDaysAgo).length;

      // Group by channel
      const byChannel = {};
      // Group by category
      const byCategory = {};
      // Group by partner
      const byPartner = {};

      records.forEach(r => {
        const ch = r.receivingChannel || 'Other';
        byChannel[ch] = (byChannel[ch] || 0) + 1;

        const cat = r.complaintCategory || 'Other';
        byCategory[cat] = (byCategory[cat] || 0) + 1;

        const p = r.partnerOrgName || 'Unknown';
        byPartner[p] = (byPartner[p] || 0) + 1;
      });

      return res.json({
        success: true,
        data: {
          totalRecords,
          openComplaints,
          closedComplaints,
          pendingAppeals,
          overdueComplaints,
          byChannel,
          byCategory,
          byPartner,
          asOf: new Date().toISOString()
        }
      });
    }

    // Live MongoDB aggregation
    const filter = { isDeleted: { $ne: true } };
    if (projectId && projectId !== 'ALL') {
      if (mongoose.Types.ObjectId.isValid(projectId)) {
        filter.projectId = new mongoose.Types.ObjectId(projectId);
      } else {
        filter.projectName = projectId;
      }
    }

    const [
      totalRecords,
      openComplaints,
      closedComplaints,
      pendingAppeals,
      overdueComplaints,
      channelStats,
      categoryStats,
      partnerStats
    ] = await Promise.all([
      ComplaintRecord.countDocuments(filter),
      ComplaintRecord.countDocuments({ ...filter, status: 'Open' }),
      ComplaintRecord.countDocuments({ ...filter, status: 'Closed' }),
      ComplaintRecord.countDocuments({
        ...filter,
        hasAppeal: true,
        $or: [
          { finalClosingDateAfterAppeal: null },
          { appealStatus: 'Pending Review' }
        ]
      }),
      ComplaintRecord.countDocuments({
        ...filter,
        status: 'Open',
        dateReceived: { $lt: thirtyDaysAgo }
      }),
      ComplaintRecord.aggregate([
        { $match: filter },
        { $group: { _id: '$receivingChannel', count: { $sum: 1 } } }
      ]),
      ComplaintRecord.aggregate([
        { $match: filter },
        { $group: { _id: '$complaintCategory', count: { $sum: 1 } } }
      ]),
      ComplaintRecord.aggregate([
        { $match: filter },
        { $group: { _id: '$partnerOrgName', count: { $sum: 1 } } }
      ])
    ]);

    const byChannel = {};
    channelStats.forEach(item => { byChannel[item._id || 'Other'] = item.count; });

    const byCategory = {};
    categoryStats.forEach(item => { byCategory[item._id || 'Other'] = item.count; });

    const byPartner = {};
    partnerStats.forEach(item => { byPartner[item._id || 'Unknown'] = item.count; });

    return res.json({
      success: true,
      data: {
        totalRecords,
        openComplaints,
        closedComplaints,
        pendingAppeals,
        overdueComplaints,
        byChannel,
        byCategory,
        byPartner,
        asOf: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('getComplaintStats error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get all complaints with filtering, search, sorting and pagination
 * @route GET /api/v1/complaints
 * @access Authorized HR Roles
 */
export const getComplaints = async (req, res) => {
  try {
    await seedComplaintDataIfEmpty();

    const {
      projectId,
      search,
      status, // 'ALL' | 'Open' | 'Closed'
      receivingChannel,
      complaintCategory,
      partnerOrgName,
      startDate,
      endDate,
      isOverdue, // 'true' | 'false'
      hasAppeal, // 'true' | 'false'
      sortBy = 'dateReceived',
      sortOrder = 'desc',
      page = 1,
      limit = 25
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 25));
    const skipNum = (pageNum - 1) * limitNum;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // DEMO / MOCK DATA MODE
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      let list = (mockData.complaintRecords || []).filter(r => !r.isDeleted);

      if (projectId && projectId !== 'ALL') {
        list = list.filter(r => r.projectId === projectId || r.projectName === projectId);
      }

      if (status && status !== 'ALL') {
        list = list.filter(r => r.status?.toLowerCase() === status.toLowerCase());
      }

      if (receivingChannel && receivingChannel !== 'ALL') {
        list = list.filter(r => r.receivingChannel === receivingChannel);
      }

      if (complaintCategory && complaintCategory !== 'ALL') {
        list = list.filter(r => r.complaintCategory === complaintCategory);
      }

      if (partnerOrgName && partnerOrgName !== 'ALL') {
        list = list.filter(r => r.partnerOrgName === partnerOrgName);
      }

      if (startDate) {
        list = list.filter(r => new Date(r.dateReceived) >= new Date(startDate));
      }

      if (endDate) {
        list = list.filter(r => new Date(r.dateReceived) <= new Date(endDate));
      }

      if (isOverdue === 'true') {
        list = list.filter(r => r.status === 'Open' && new Date(r.dateReceived) < thirtyDaysAgo);
      }

      if (hasAppeal === 'true') {
        list = list.filter(r => r.hasAppeal);
      }

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(r =>
          r.sNo?.toLowerCase().includes(q) ||
          r.complainantName?.toLowerCase().includes(q) ||
          r.complainantAddress?.toLowerCase().includes(q) ||
          r.partnerOrgName?.toLowerCase().includes(q) ||
          r.complaintCategory?.toLowerCase().includes(q) ||
          r.receivingChannel?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.actionsTaken?.toLowerCase().includes(q)
        );
      }

      // Sort
      list.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortBy === 'dateReceived' || sortBy === 'dateClosed') {
          valA = valA ? new Date(valA).getTime() : 0;
          valB = valB ? new Date(valB).getTime() : 0;
        } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = (valB || '').toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      const total = list.length;
      const paginated = list.slice(skipNum, skipNum + limitNum);

      return res.json({
        success: true,
        data: paginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1
        }
      });
    }

    // MONGODB MODE
    const query = { isDeleted: { $ne: true } };

    if (projectId && projectId !== 'ALL') {
      if (mongoose.Types.ObjectId.isValid(projectId)) {
        query.projectId = new mongoose.Types.ObjectId(projectId);
      } else {
        query.projectName = projectId;
      }
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (receivingChannel && receivingChannel !== 'ALL') {
      query.receivingChannel = receivingChannel;
    }

    if (complaintCategory && complaintCategory !== 'ALL') {
      query.complaintCategory = complaintCategory;
    }

    if (partnerOrgName && partnerOrgName !== 'ALL') {
      query.partnerOrgName = partnerOrgName;
    }

    if (startDate || endDate) {
      query.dateReceived = {};
      if (startDate) query.dateReceived.$gte = new Date(startDate);
      if (endDate) query.dateReceived.$lte = new Date(endDate);
    }

    if (isOverdue === 'true') {
      query.status = 'Open';
      query.dateReceived = { ...(query.dateReceived || {}), $lt: thirtyDaysAgo };
    }

    if (hasAppeal === 'true') {
      query.hasAppeal = true;
    }

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { sNo: { $regex: q, $options: 'i' } },
        { complainantName: { $regex: q, $options: 'i' } },
        { complainantAddress: { $regex: q, $options: 'i' } },
        { partnerOrgName: { $regex: q, $options: 'i' } },
        { complaintCategory: { $regex: q, $options: 'i' } },
        { receivingChannel: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { actionsTaken: { $regex: q, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    // Tie breaker
    if (sortBy !== '_id') {
      sortObj._id = -1;
    }

    const [total, records] = await Promise.all([
      ComplaintRecord.countDocuments(query),
      ComplaintRecord.find(query)
        .sort(sortObj)
        .skip(skipNum)
        .limit(limitNum)
        .lean()
    ]);

    return res.json({
      success: true,
      data: records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (error) {
    console.error('getComplaints error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get a single complaint record by ID
 * @route GET /api/v1/complaints/:id
 * @access Authorized HR Roles
 */
export const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const record = (mockData.complaintRecords || []).find(r => (r._id === id || r.sNo === id) && !r.isDeleted);
      if (!record) {
        return res.status(404).json({ success: false, message: 'Complaint record not found.' });
      }
      return res.json({ success: true, data: record });
    }

    let query = { isDeleted: { $ne: true } };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.sNo = id;
    }

    const record = await ComplaintRecord.findOne(query).populate('createdBy updatedBy', 'email role').lean();
    if (!record) {
      return res.status(404).json({ success: false, message: 'Complaint record not found.' });
    }

    return res.json({ success: true, data: record });
  } catch (error) {
    console.error('getComplaintById error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Create a new complaint / feedback record
 * @route POST /api/v1/complaints
 * @access Authorized HR Roles
 */
export const createComplaint = async (req, res) => {
  try {
    const {
      projectId,
      projectName,
      sNo: userProvidedSNo,
      dateReceived,
      receivingChannel,
      receivingChannelOther,
      isAnonymous,
      complainantName,
      complainantAddress,
      complainantPhone,
      numberCalledFrom,
      complaintCategory,
      complaintCategoryOther,
      description,
      complainantGender,
      complainantAge,
      complainantDisability,
      partnerOrgName,
      assignedFocalPerson,
      actionsTaken,
      delayReason,
      isComplainantNotifiedOfDelay,
      delayNotificationDate,
      delayNotificationNotes,
      status = 'Open',
      dateClosed,
      hasAppeal,
      appealDate,
      appealOutcome,
      appealStatus,
      finalClosingDateAfterAppeal,
      priority,
      confidentialityLevel
    } = req.body;

    // Minimum validation
    if (!dateReceived) {
      return res.status(400).json({ success: false, message: 'Date Complaint or Feedback Received is required.' });
    }
    if (!receivingChannel) {
      return res.status(400).json({ success: false, message: 'Receiving Channel is required.' });
    }
    if (receivingChannel === 'Other' && (!receivingChannelOther || !receivingChannelOther.trim())) {
      return res.status(400).json({ success: false, message: 'Please specify the receiving channel when "Other" is selected.' });
    }
    if (!complaintCategory) {
      return res.status(400).json({ success: false, message: 'Complaint Type / Category is required.' });
    }
    if (complaintCategory === 'Other' && (!complaintCategoryOther || !complaintCategoryOther.trim())) {
      return res.status(400).json({ success: false, message: 'Please specify the complaint category when "Other" is selected.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description of feedback or complaint is required.' });
    }
    if (!partnerOrgName || !partnerOrgName.trim()) {
      return res.status(400).json({ success: false, message: 'Concerned Partner / Organization Name is required.' });
    }

    // Timeline validations
    const parsedReceived = new Date(dateReceived);
    if (isNaN(parsedReceived.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid Date Received format.' });
    }

    let parsedClosed = null;
    if (status === 'Closed') {
      if (!dateClosed) {
        return res.status(400).json({ success: false, message: 'Date Complaint Closed is required when status is Closed.' });
      }
      parsedClosed = new Date(dateClosed);
      if (isNaN(parsedClosed.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid Date Closed format.' });
      }
      if (parsedClosed < parsedReceived) {
        return res.status(400).json({ success: false, message: 'Date Complaint Closed cannot precede the Date Received.' });
      }
    }

    let parsedAppealDate = null;
    if (appealDate) {
      parsedAppealDate = new Date(appealDate);
      if (isNaN(parsedAppealDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid Appeal Date format.' });
      }
      if (parsedAppealDate < parsedReceived) {
        return res.status(400).json({ success: false, message: 'Appeal Date cannot precede the Date Received.' });
      }
    }

    let parsedFinalClose = null;
    if (finalClosingDateAfterAppeal) {
      parsedFinalClose = new Date(finalClosingDateAfterAppeal);
      if (isNaN(parsedFinalClose.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid Final Closing Date format.' });
      }
      if (parsedAppealDate && parsedFinalClose < parsedAppealDate) {
        return res.status(400).json({ success: false, message: 'Final Closing Date After Appeal cannot precede the Appeal Date.' });
      }
      if (parsedFinalClose < parsedReceived) {
        return res.status(400).json({ success: false, message: 'Final Closing Date After Appeal cannot precede the Date Received.' });
      }
    }

    // Overdue check (> 30 days open)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const isOverdue = status === 'Open' && parsedReceived < thirtyDaysAgo;
    if (isOverdue) {
      if (!delayReason || !delayReason.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Because this complaint was received more than 30 days ago and remains unresolved, the Reason for Delay is mandatory.'
        });
      }
      if (!isComplainantNotifiedOfDelay || isComplainantNotifiedOfDelay === 'Not applicable') {
        return res.status(400).json({
          success: false,
          message: 'Please confirm whether the complainant has been notified of the delay (Yes / No / Pending).'
        });
      }
    }

    // Determine S.No
    let sNo = userProvidedSNo?.trim();
    if (!sNo) {
      sNo = await generateNextSNo();
    }

    // Audit event
    const creatorEmail = req.user?.email || 'hr.admin@cbdp.org';
    const creatorRole = req.user?.role || 'HR_ADMIN';
    const initialAuditEvent = {
      action: 'CREATED',
      performedBy: creatorEmail,
      userEmail: creatorEmail,
      role: creatorRole,
      timestamp: new Date(),
      details: `Record ${sNo} created with status ${status} via ${receivingChannel}.`
    };

    // Anonymous handling
    const resolvedComplainantName = isAnonymous 
      ? (complainantName?.trim() || 'Anonymous Complainant') 
      : (complainantName?.trim() || 'Not provided');

    // DEMO MODE
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      mockData.complaintRecords = mockData.complaintRecords || [];

      // Check unique
      const existing = mockData.complaintRecords.find(r => r.sNo === sNo && !r.isDeleted);
      if (existing) {
        return res.status(400).json({ success: false, message: `Serial Number ${sNo} already exists. Please provide a unique S.No.` });
      }

      const newRecord = {
        _id: 'cfr-' + Date.now(),
        sNo,
        seqNumber: mockData.complaintRecords.length + 1,
        projectId: projectId || 'risk-proj-001',
        projectName: projectName || 'CBDP Women & Girls Empowerment Initiative',
        dateReceived: parsedReceived,
        receivingChannel,
        receivingChannelOther: receivingChannelOther || '',
        isAnonymous: !!isAnonymous,
        complainantName: resolvedComplainantName,
        complainantAddress: isAnonymous ? 'CONFIDENTIAL (Anonymous)' : (complainantAddress || ''),
        complainantPhone: isAnonymous ? 'PROTECTED' : (complainantPhone || ''),
        numberCalledFrom: isAnonymous ? 'PROTECTED' : (numberCalledFrom || ''),
        complaintCategory,
        complaintCategoryOther: complaintCategoryOther || '',
        description: description.trim(),
        complainantGender: complainantGender || 'Prefer not to say',
        complainantAge: complainantAge || '',
        complainantDisability: complainantDisability || 'Not recorded',
        partnerOrgName: partnerOrgName.trim(),
        assignedFocalPerson: assignedFocalPerson || '',
        actionsTaken: actionsTaken || '',
        delayReason: delayReason || '',
        isComplainantNotifiedOfDelay: isComplainantNotifiedOfDelay || 'Not applicable',
        delayNotificationDate: delayNotificationDate ? new Date(delayNotificationDate) : null,
        delayNotificationNotes: delayNotificationNotes || '',
        status,
        dateClosed: parsedClosed,
        hasAppeal: !!(hasAppeal || parsedAppealDate || appealOutcome),
        appealDate: parsedAppealDate,
        appealOutcome: appealOutcome || '',
        appealStatus: appealStatus || (parsedAppealDate ? 'Pending Review' : 'None'),
        finalClosingDateAfterAppeal: parsedFinalClose,
        priority: priority || 'Medium',
        confidentialityLevel: confidentialityLevel || 'Confidential',
        auditTrail: [initialAuditEvent],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockData.complaintRecords.unshift(newRecord);
      saveStoreToDisk();

      return res.status(201).json({
        success: true,
        message: 'Complaint record created successfully.',
        data: newRecord
      });
    }

    // MONGODB MODE
    // Check uniqueness
    const existing = await ComplaintRecord.findOne({ sNo, isDeleted: { $ne: true } });
    if (existing) {
      return res.status(400).json({ success: false, message: `Serial Number ${sNo} already exists. Please choose or generate another S.No.` });
    }

    const complaint = new ComplaintRecord({
      sNo,
      projectId: (projectId && mongoose.Types.ObjectId.isValid(projectId)) ? projectId : null,
      projectName: projectName || 'CBDP Women & Girls Empowerment Initiative',
      dateReceived: parsedReceived,
      receivingChannel,
      receivingChannelOther: receivingChannelOther || '',
      isAnonymous: !!isAnonymous,
      complainantName: resolvedComplainantName,
      complainantAddress: isAnonymous ? 'CONFIDENTIAL (Anonymous)' : (complainantAddress || ''),
      complainantPhone: isAnonymous ? 'PROTECTED' : (complainantPhone || ''),
      numberCalledFrom: isAnonymous ? 'PROTECTED' : (numberCalledFrom || ''),
      complaintCategory,
      complaintCategoryOther: complaintCategoryOther || '',
      description: description.trim(),
      complainantGender: complainantGender || 'Prefer not to say',
      complainantAge: complainantAge || '',
      complainantDisability: complainantDisability || 'Not recorded',
      partnerOrgName: partnerOrgName.trim(),
      assignedFocalPerson: assignedFocalPerson || '',
      actionsTaken: actionsTaken || '',
      delayReason: delayReason || '',
      isComplainantNotifiedOfDelay: isComplainantNotifiedOfDelay || 'Not applicable',
      delayNotificationDate: delayNotificationDate ? new Date(delayNotificationDate) : null,
      delayNotificationNotes: delayNotificationNotes || '',
      status,
      dateClosed: parsedClosed,
      hasAppeal: !!(hasAppeal || parsedAppealDate || appealOutcome),
      appealDate: parsedAppealDate,
      appealOutcome: appealOutcome || '',
      appealStatus: appealStatus || (parsedAppealDate ? 'Pending Review' : 'None'),
      finalClosingDateAfterAppeal: parsedFinalClose,
      priority: priority || 'Medium',
      confidentialityLevel: confidentialityLevel || 'Confidential',
      auditTrail: [initialAuditEvent],
      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null
    });

    await complaint.save();

    // Central Audit Log
    try {
      await AuditLog.create({
        userId: req.user?._id,
        action: 'CREATE',
        module: 'COMPLAINTS_REGISTER',
        resourceId: complaint._id,
        newState: { sNo: complaint.sNo, status: complaint.status, category: complaint.complaintCategory },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (auditErr) {
      console.warn('Central AuditLog recording skipped:', auditErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Complaint record registered successfully.',
      data: complaint
    });
  } catch (error) {
    console.error('createComplaint error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update an existing complaint / feedback record
 * @route PUT /api/v1/complaints/:id
 * @access Authorized HR Roles
 */
export const updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const updaterEmail = req.user?.email || 'hr.admin@cbdp.org';
    const updaterRole = req.user?.role || 'HR_ADMIN';

    // DEMO MODE
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const list = mockData.complaintRecords || [];
      const index = list.findIndex(r => (r._id === id || r.sNo === id) && !r.isDeleted);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Complaint record not found.' });
      }

      const existing = list[index];

      // Validate dates
      const received = updateData.dateReceived ? new Date(updateData.dateReceived) : new Date(existing.dateReceived);
      const newStatus = updateData.status || existing.status;

      let closedDate = updateData.dateClosed ? new Date(updateData.dateClosed) : (existing.dateClosed ? new Date(existing.dateClosed) : null);
      if (newStatus === 'Closed') {
        if (!closedDate) closedDate = new Date();
        if (closedDate < received) {
          return res.status(400).json({ success: false, message: 'Date Complaint Closed cannot precede Date Received.' });
        }
      } else {
        closedDate = null;
      }

      // Check overdue validation
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (newStatus === 'Open' && received < thirtyDaysAgo) {
        const dReason = updateData.delayReason !== undefined ? updateData.delayReason : existing.delayReason;
        if (!dReason || !dReason.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Record is over 30 days old and still Open. Please provide the Reason for Delay.'
          });
        }
      }

      // Appeal validations
      const appDate = updateData.appealDate ? new Date(updateData.appealDate) : (existing.appealDate ? new Date(existing.appealDate) : null);
      if (appDate && appDate < received) {
        return res.status(400).json({ success: false, message: 'Appeal Date cannot precede Date Received.' });
      }

      const finalClose = updateData.finalClosingDateAfterAppeal ? new Date(updateData.finalClosingDateAfterAppeal) : (existing.finalClosingDateAfterAppeal ? new Date(existing.finalClosingDateAfterAppeal) : null);
      if (finalClose) {
        if (appDate && finalClose < appDate) {
          return res.status(400).json({ success: false, message: 'Final Closing Date cannot precede Appeal Date.' });
        }
        if (finalClose < received) {
          return res.status(400).json({ success: false, message: 'Final Closing Date cannot precede Date Received.' });
        }
      }

      const auditEvent = {
        action: newStatus !== existing.status ? 'STATUS_CHANGE' : 'UPDATED',
        performedBy: updaterEmail,
        userEmail: updaterEmail,
        role: updaterRole,
        timestamp: new Date(),
        details: `Updated by ${updaterEmail}. Status: ${newStatus}.`
      };

      const updated = {
        ...existing,
        ...updateData,
        dateReceived: received,
        status: newStatus,
        dateClosed: closedDate,
        appealDate: appDate,
        finalClosingDateAfterAppeal: finalClose,
        hasAppeal: !!(appDate || updateData.appealOutcome || existing.appealOutcome),
        auditTrail: [...(existing.auditTrail || []), auditEvent],
        updatedAt: new Date().toISOString()
      };

      list[index] = updated;
      persistStoreToDisk();

      return res.json({
        success: true,
        message: 'Complaint record updated successfully.',
        data: updated
      });
    }

    // MONGODB MODE
    let query = { isDeleted: { $ne: true } };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.sNo = id;
    }

    const complaint = await ComplaintRecord.findOne(query);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint record not found.' });
    }

    const previousState = {
      status: complaint.status,
      actionsTaken: complaint.actionsTaken,
      dateClosed: complaint.dateClosed,
      delayReason: complaint.delayReason
    };

    // Date Received
    if (updateData.dateReceived) {
      complaint.dateReceived = new Date(updateData.dateReceived);
    }

    // Status & Closure
    if (updateData.status) {
      complaint.status = updateData.status;
    }

    if (complaint.status === 'Closed') {
      if (updateData.dateClosed) {
        complaint.dateClosed = new Date(updateData.dateClosed);
      } else if (!complaint.dateClosed) {
        complaint.dateClosed = new Date();
      }
      if (complaint.dateClosed < complaint.dateReceived) {
        return res.status(400).json({ success: false, message: 'Date Complaint Closed cannot precede the Date Received.' });
      }
    } else {
      complaint.dateClosed = null;
    }

    // 30-day Overdue Check
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (complaint.status === 'Open' && complaint.dateReceived < thirtyDaysAgo) {
      const delayReason = updateData.delayReason !== undefined ? updateData.delayReason : complaint.delayReason;
      if (!delayReason || !delayReason.trim()) {
        return res.status(400).json({
          success: false,
          message: 'This complaint is open for more than 30 days. Please supply the Reason for Delay and notification details.'
        });
      }
    }

    // Appeal fields
    if (updateData.appealDate !== undefined) {
      complaint.appealDate = updateData.appealDate ? new Date(updateData.appealDate) : null;
      if (complaint.appealDate && complaint.appealDate < complaint.dateReceived) {
        return res.status(400).json({ success: false, message: 'Appeal Date cannot precede the Date Received.' });
      }
    }

    if (updateData.appealOutcome !== undefined) {
      complaint.appealOutcome = updateData.appealOutcome;
    }

    if (updateData.appealStatus !== undefined) {
      complaint.appealStatus = updateData.appealStatus;
    }

    if (updateData.finalClosingDateAfterAppeal !== undefined) {
      complaint.finalClosingDateAfterAppeal = updateData.finalClosingDateAfterAppeal ? new Date(updateData.finalClosingDateAfterAppeal) : null;
      if (complaint.finalClosingDateAfterAppeal) {
        if (complaint.appealDate && complaint.finalClosingDateAfterAppeal < complaint.appealDate) {
          return res.status(400).json({ success: false, message: 'Final Closing Date cannot precede the Appeal Date.' });
        }
        if (complaint.finalClosingDateAfterAppeal < complaint.dateReceived) {
          return res.status(400).json({ success: false, message: 'Final Closing Date cannot precede the Date Received.' });
        }
      }
    }

    // Update general fields
    if (updateData.receivingChannel) complaint.receivingChannel = updateData.receivingChannel;
    if (updateData.receivingChannelOther !== undefined) complaint.receivingChannelOther = updateData.receivingChannelOther;
    if (updateData.isAnonymous !== undefined) complaint.isAnonymous = updateData.isAnonymous;
    if (updateData.complainantName !== undefined) complaint.complainantName = updateData.complainantName;
    if (updateData.complainantAddress !== undefined) complaint.complainantAddress = updateData.complainantAddress;
    if (updateData.complainantPhone !== undefined) complaint.complainantPhone = updateData.complainantPhone;
    if (updateData.numberCalledFrom !== undefined) complaint.numberCalledFrom = updateData.numberCalledFrom;
    if (updateData.complaintCategory) complaint.complaintCategory = updateData.complaintCategory;
    if (updateData.complaintCategoryOther !== undefined) complaint.complaintCategoryOther = updateData.complaintCategoryOther;
    if (updateData.description) complaint.description = updateData.description.trim();
    if (updateData.complainantGender) complaint.complainantGender = updateData.complainantGender;
    if (updateData.complainantAge !== undefined) complaint.complainantAge = updateData.complainantAge;
    if (updateData.complainantDisability) complaint.complainantDisability = updateData.complainantDisability;
    if (updateData.partnerOrgName) complaint.partnerOrgName = updateData.partnerOrgName.trim();
    if (updateData.assignedFocalPerson !== undefined) complaint.assignedFocalPerson = updateData.assignedFocalPerson;
    if (updateData.actionsTaken !== undefined) complaint.actionsTaken = updateData.actionsTaken;
    if (updateData.delayReason !== undefined) complaint.delayReason = updateData.delayReason;
    if (updateData.isComplainantNotifiedOfDelay !== undefined) complaint.isComplainantNotifiedOfDelay = updateData.isComplainantNotifiedOfDelay;
    if (updateData.delayNotificationDate !== undefined) complaint.delayNotificationDate = updateData.delayNotificationDate ? new Date(updateData.delayNotificationDate) : null;
    if (updateData.delayNotificationNotes !== undefined) complaint.delayNotificationNotes = updateData.delayNotificationNotes;
    if (updateData.priority) complaint.priority = updateData.priority;
    if (updateData.confidentialityLevel) complaint.confidentialityLevel = updateData.confidentialityLevel;
    if (updateData.projectName) complaint.projectName = updateData.projectName;
    if (updateData.projectId && mongoose.Types.ObjectId.isValid(updateData.projectId)) complaint.projectId = updateData.projectId;

    complaint.updatedBy = req.user?._id || null;

    // Determine audit action
    let auditAction = 'UPDATED';
    let auditNote = `Updated by ${updaterEmail}`;
    if (updateData.status && updateData.status !== previousState.status) {
      auditAction = 'STATUS_CHANGE';
      auditNote = `Status changed from ${previousState.status} to ${updateData.status} by ${updaterEmail}`;
    }

    complaint.auditTrail.push({
      action: auditAction,
      performedBy: updaterEmail,
      userEmail: updaterEmail,
      role: updaterRole,
      timestamp: new Date(),
      details: auditNote
    });

    await complaint.save();

    // Central Audit Log
    try {
      await AuditLog.create({
        userId: req.user?._id,
        action: 'UPDATE',
        module: 'COMPLAINTS_REGISTER',
        resourceId: complaint._id,
        previousState,
        newState: { status: complaint.status, dateClosed: complaint.dateClosed },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (auditErr) {
      console.warn('Central AuditLog recording skipped:', auditErr.message);
    }

    return res.json({
      success: true,
      message: 'Complaint record updated successfully.',
      data: complaint
    });
  } catch (error) {
    console.error('updateComplaint error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Quick status toggle & resolution recorder
 * @route PATCH /api/v1/complaints/:id/status
 * @access Authorized HR Roles
 */
export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, dateClosed, actionsTaken, closureNotes } = req.body;

    if (!['Open', 'Closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be either "Open" or "Closed".' });
    }

    const updaterEmail = req.user?.email || 'hr.admin@cbdp.org';
    const updaterRole = req.user?.role || 'HR_ADMIN';

    // DEMO MODE
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const list = mockData.complaintRecords || [];
      const item = list.find(r => (r._id === id || r.sNo === id) && !r.isDeleted);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Complaint record not found.' });
      }

      item.status = status;
      if (status === 'Closed') {
        item.dateClosed = dateClosed ? new Date(dateClosed) : new Date();
      } else {
        item.dateClosed = null;
      }
      if (actionsTaken !== undefined) item.actionsTaken = actionsTaken;

      item.auditTrail = item.auditTrail || [];
      item.auditTrail.push({
        action: status === 'Closed' ? 'CLOSED' : 'STATUS_CHANGE',
        performedBy: updaterEmail,
        userEmail: updaterEmail,
        role: updaterRole,
        timestamp: new Date(),
        details: `Status set to ${status}. ${closureNotes || ''}`
      });
      persistStoreToDisk();

      return res.json({ success: true, message: `Status updated to ${status}.`, data: item });
    }

    // MONGODB MODE
    let query = { isDeleted: { $ne: true } };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.sNo = id;
    }

    const complaint = await ComplaintRecord.findOne(query);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint record not found.' });
    }

    complaint.status = status;
    if (status === 'Closed') {
      complaint.dateClosed = dateClosed ? new Date(dateClosed) : new Date();
      if (complaint.dateClosed < complaint.dateReceived) {
        return res.status(400).json({ success: false, message: 'Date Complaint Closed cannot precede the Date Received.' });
      }
    } else {
      complaint.dateClosed = null;
    }

    if (actionsTaken !== undefined && actionsTaken.trim().length > 0) {
      complaint.actionsTaken = actionsTaken.trim();
    }

    complaint.auditTrail.push({
      action: status === 'Closed' ? 'CLOSED' : 'STATUS_CHANGE',
      performedBy: updaterEmail,
      userEmail: updaterEmail,
      role: updaterRole,
      timestamp: new Date(),
      details: `Status set to ${status}. ${closureNotes || ''}`
    });

    await complaint.save();

    return res.json({
      success: true,
      message: `Complaint record status marked as ${status}.`,
      data: complaint
    });
  } catch (error) {
    console.error('updateComplaintStatus error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Manage Appeal workflow (submit, review outcome, final closing date)
 * @route POST /api/v1/complaints/:id/appeal
 * @access Authorized HR Roles
 */
export const manageComplaintAppeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { appealDate, appealOutcome, appealStatus, finalClosingDateAfterAppeal } = req.body;

    const updaterEmail = req.user?.email || 'hr.admin@cbdp.org';
    const updaterRole = req.user?.role || 'HR_ADMIN';

    // DEMO MODE
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const list = mockData.complaintRecords || [];
      const item = list.find(r => (r._id === id || r.sNo === id) && !r.isDeleted);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Complaint record not found.' });
      }

      item.hasAppeal = true;
      item.appealDate = appealDate ? new Date(appealDate) : new Date();
      if (appealOutcome !== undefined) item.appealOutcome = appealOutcome;
      if (appealStatus) item.appealStatus = appealStatus;
      if (finalClosingDateAfterAppeal) item.finalClosingDateAfterAppeal = new Date(finalClosingDateAfterAppeal);

      item.auditTrail = item.auditTrail || [];
      item.auditTrail.push({
        action: 'APPEAL_RECORDED',
        performedBy: updaterEmail,
        userEmail: updaterEmail,
        role: updaterRole,
        timestamp: new Date(),
        details: `Appeal recorded. Status: ${item.appealStatus}.`
      });
      persistStoreToDisk();

      return res.json({ success: true, message: 'Appeal details recorded successfully.', data: item });
    }

    // MONGODB MODE
    let query = { isDeleted: { $ne: true } };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.sNo = id;
    }

    const complaint = await ComplaintRecord.findOne(query);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint record not found.' });
    }

    complaint.hasAppeal = true;
    if (appealDate) {
      const pAppeal = new Date(appealDate);
      if (pAppeal < complaint.dateReceived) {
        return res.status(400).json({ success: false, message: 'Appeal Date cannot precede Date Received.' });
      }
      complaint.appealDate = pAppeal;
    } else if (!complaint.appealDate) {
      complaint.appealDate = new Date();
    }

    if (appealOutcome !== undefined) {
      complaint.appealOutcome = appealOutcome;
    }

    if (appealStatus) {
      complaint.appealStatus = appealStatus;
    }

    if (finalClosingDateAfterAppeal) {
      const pFinal = new Date(finalClosingDateAfterAppeal);
      if (complaint.appealDate && pFinal < complaint.appealDate) {
        return res.status(400).json({ success: false, message: 'Final Closing Date cannot precede the Appeal Date.' });
      }
      complaint.finalClosingDateAfterAppeal = pFinal;
    }

    complaint.auditTrail.push({
      action: 'APPEAL_RECORDED',
      performedBy: updaterEmail,
      userEmail: updaterEmail,
      role: updaterRole,
      timestamp: new Date(),
      details: `Appeal details updated. Status: ${complaint.appealStatus}.`
    });

    await complaint.save();

    return res.json({
      success: true,
      message: 'Appeal managed successfully.',
      data: complaint
    });
  } catch (error) {
    console.error('manageComplaintAppeal error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Soft delete a complaint record (Restricted to Super Admin & HR Admin)
 * @route DELETE /api/v1/complaints/:id
 * @access SUPER_ADMIN, HR_ADMIN
 */
export const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Administrative record deletion' } = req.body;

    const deleterEmail = req.user?.email || 'hr.admin@cbdp.org';

    // DEMO MODE
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const list = mockData.complaintRecords || [];
      const item = list.find(r => (r._id === id || r.sNo === id) && !r.isDeleted);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Complaint record not found.' });
      }

      item.isDeleted = true;
      item.deletedAt = new Date().toISOString();
      item.deletedBy = deleterEmail;
      persistStoreToDisk();

      return res.json({ success: true, message: `Record ${item.sNo} deleted successfully.` });
    }

    // MONGODB MODE
    let query = { isDeleted: { $ne: true } };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.sNo = id;
    }

    const complaint = await ComplaintRecord.findOne(query);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint record not found.' });
    }

    complaint.isDeleted = true;
    complaint.deletedAt = new Date();
    complaint.deletedBy = req.user?._id;
    complaint.auditTrail.push({
      action: 'DELETED',
      performedBy: deleterEmail,
      userEmail: deleterEmail,
      role: req.user?.role,
      timestamp: new Date(),
      details: `Record deleted by ${deleterEmail}. Reason: ${reason}`
    });

    await complaint.save();

    // Central Audit Log
    try {
      await AuditLog.create({
        userId: req.user?._id,
        action: 'DELETE',
        module: 'COMPLAINTS_REGISTER',
        resourceId: complaint._id,
        previousState: { sNo: complaint.sNo, status: complaint.status },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (auditErr) {
      console.warn('Central AuditLog recording skipped:', auditErr.message);
    }

    return res.json({
      success: true,
      message: `Complaint record ${complaint.sNo} has been deleted from active register.`
    });
  } catch (error) {
    console.error('deleteComplaint error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Export / Print Complaints Register dataset
 * @route GET /api/v1/complaints/export
 * @access Authorized HR Roles
 */
export const exportComplaints = async (req, res) => {
  try {
    const { projectId, status, format = 'json' } = req.query;

    const query = { isDeleted: { $ne: true } };
    if (projectId && projectId !== 'ALL') {
      if (mongoose.Types.ObjectId.isValid(projectId)) {
        query.projectId = new mongoose.Types.ObjectId(projectId);
      } else {
        query.projectName = projectId;
      }
    }
    if (status && status !== 'ALL') {
      query.status = status;
    }

    let records = [];
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      records = (mockData.complaintRecords || []).filter(r => !r.isDeleted);
      if (projectId && projectId !== 'ALL') {
        records = records.filter(r => r.projectId === projectId || r.projectName === projectId);
      }
      if (status && status !== 'ALL') {
        records = records.filter(r => r.status === status);
      }
    } else {
      records = await ComplaintRecord.find(query).sort({ sNo: 1 }).lean();
    }

    // Log export action
    try {
      await AuditLog.create({
        userId: req.user?._id,
        action: 'EXPORT',
        module: 'COMPLAINTS_REGISTER',
        newState: { count: records.length, format },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (e) {
      // ignore
    }

    return res.json({
      success: true,
      count: records.length,
      data: records,
      exportedAt: new Date().toISOString(),
      confidentialityNotice: 'RESTRICTED AND CONFIDENTIAL — FOR AUTHORIZED OXFAM AND PARTNER PERSONNEL ONLY'
    });
  } catch (error) {
    console.error('exportComplaints error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
