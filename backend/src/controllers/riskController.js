import mongoose from 'mongoose';
import { RiskProject } from '../models/RiskProject.js';
import { RiskRecord } from '../models/RiskRecord.js';
import { RiskCategory } from '../models/RiskCategory.js';
import { 
  calculateRiskScore, 
  getRiskRating, 
  calculateVariance, 
  LIKELIHOOD_LEVELS, 
  IMPACT_LEVELS 
} from '../utils/riskCalculations.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';

// Pre-defined CBDP Standard Categories and Subcategories
export const DEFAULT_RISK_CATEGORIES = [
  {
    name: 'Strategy & Governance',
    code: 'SG',
    description: 'Governance, strategic alignment, legal & regulatory risk',
    subCategories: [
      { name: 'Strategy relevance', code: 'SR', note: 'Strategy not adapted to changing societal needs' },
      { name: 'Registration', code: 'RE', note: 'Right to operate revoked or not renewed' },
      { name: 'Legal compliance', code: 'LC', note: 'National and international regulatory compliance' },
      { name: 'Tax compliance', code: 'TC', note: 'Statutory and fiscal tax compliance' },
      { name: 'Leadership capacity', code: 'MC', note: 'SMT capacity, stability, succession' },
      { name: 'Crisis management', code: 'CM', note: 'Inability to respond properly to crisis/PR' },
      { name: 'Other', code: 'OT', note: 'Other governance matters' }
    ]
  },
  {
    name: 'Finance & Services',
    code: 'FS',
    description: 'Financial stability, financial controls, IT, systems',
    subCategories: [
      { name: 'Financial Support', code: 'FS', note: 'Adequate financial support to field offices' },
      { name: 'Financial model', code: 'FM', note: 'Long-term financial model and cash flow commitments' },
      { name: 'Finance controls & Fraud', code: 'FF', note: 'Internal control failures or fraud' },
      { name: 'Data protection & cyber attack', code: 'IT', note: 'IT failure, data breach, cyber threat' },
      { name: 'Change projects', code: 'CP', note: 'Failure to manage organizational change' },
      { name: 'Other', code: 'OT', note: 'Other financial risks' }
    ]
  },
  {
    name: 'Funding & Income',
    code: 'FR',
    description: 'Donor pool, grant pipeline, fundraising and reputation',
    subCategories: [
      { name: 'Changing donor pool', code: 'CD', note: 'Fewer donors aligned with target sectors' },
      { name: 'Funding base', code: 'FB', note: 'Over-reliance on too few donors or funding sources' },
      { name: 'Results based', code: 'RB', note: 'Payment by results and financial recovery' },
      { name: 'Proposal quality', code: 'PQ', note: 'Capacity to identify and submit competitive proposals' },
      { name: 'Cost recovery', code: 'CR', note: 'Under-recovery of overheads and co-funding' },
      { name: 'Secured income', code: 'SI', note: 'Low secured income and weak future pipeline' },
      { name: 'Relationships & Profile', code: 'RP', note: 'Reputational risk from partnerships' },
      { name: 'Brand', code: 'BR', note: 'Brand visibility and internal uptake' },
      { name: 'Other', code: 'OT', note: 'Other income risks' }
    ]
  },
  {
    name: 'Programme Delivery',
    code: 'PD',
    description: 'Project design, implementation, partners and donor compliance',
    subCategories: [
      { name: 'Project design', code: 'PD', note: 'Deficiencies in intervention design' },
      { name: 'Partner capacity', code: 'PC', note: 'Insufficient partner skills or execution capacity' },
      { name: 'Partner management', code: 'PM', note: 'Weak partner monitoring or oversight' },
      { name: 'Documentation', code: 'DO', note: 'Failure to maintain proper audit trails and records' },
      { name: 'Project Implementation', code: 'PI', note: 'Operational bottlenecks in delivery' },
      { name: 'Project Impact', code: 'IP', note: 'Failure to achieve target development outcomes' },
      { name: 'Learning', code: 'LE', note: 'Failure to capture and implement lessons learned' },
      { name: 'Project specific', code: 'PS', note: 'Risks unique to specific local field projects' },
      { name: 'Donor compliance', code: 'DC', note: 'Breach of grant contract terms' },
      { name: 'Other', code: 'OT', note: 'Other operational delivery risks' }
    ]
  },
  {
    name: 'People',
    code: 'PE',
    description: 'Human resources, staff capacity, safety and safeguarding',
    subCategories: [
      { name: 'Staff capacity', code: 'SC', note: 'Inability to recruit & retain key talent' },
      { name: 'Staff development', code: 'SD', note: 'Workforce motivation, culture, and retention' },
      { name: 'Safeguarding', code: 'SG', note: 'Protection of beneficiaries, staff, and vulnerable groups' },
      { name: 'Other', code: 'OT', note: 'Other HR and people risks' }
    ]
  },
  {
    name: 'External',
    code: 'EX',
    description: 'Macro environment, security, climate, and public health',
    subCategories: [
      { name: 'Natural disasters', code: 'ND', note: 'Floods, cyclones, earthquakes, climate events' },
      { name: 'Public Health concerns', code: 'PH', note: 'Epidemics, health emergencies' },
      { name: 'Civil unrest & terrorism', code: 'CT', note: 'Security threats, riots, conflict' },
      { name: 'Political Unrest', code: 'PU', note: 'Electoral tension, policy shifts' },
      { name: 'Macroeconomic shocks', code: 'MS', note: 'Inflation, currency devaluation, bank instability' },
      { name: 'Security Other', code: 'SO', note: 'Field movement, local land/resource disputes' },
      { name: 'Other', code: 'OT', note: 'Other external threats' }
    ]
  }
];

// Helper to seed initial data in MongoDB if empty
export const seedRiskDataIfEmpty = async () => {
  if (isDemoMode() || mongoose.connection.readyState !== 1) {
    return;
  }

  try {
    // 1. Seed Categories if none exist
    const categoryCount = await RiskCategory.countDocuments();
    if (categoryCount === 0) {
      await RiskCategory.insertMany(DEFAULT_RISK_CATEGORIES);
      console.log('[RiskRegister] Pre-seeded 6 standard risk categories.');
    }

    // 2. Seed Default Project & Sample Risks if none exist
    const projectCount = await RiskProject.countDocuments();
    if (projectCount === 0) {
      const defaultProject = await RiskProject.create({
        name: 'CBDP Women & Girls Empowerment Initiative',
        officeResponsible: 'Country Office / Safeguarding & HR Unit',
        location: 'Dhaka & Regional Impact Zones',
        period: 'Jan 2025 - Dec 2027',
        reviewQuarter: 'Q1 2026',
        endQuarter: 'Q4 2027',
        description: 'Comprehensive multi-region human development and empowerment intervention.',
        status: 'ACTIVE',
        isDefault: true,
      });

      console.log(`[RiskRegister] Seeded initial project: ${defaultProject.name}`);

      // Seed Initial Risk Records from CBDP spreadsheet
      const sampleRisks = [
        {
          projectId: defaultProject._id,
          riskNo: 1,
          dateAdded: new Date('2025-12-01'),
          category: 'People',
          subCategory: 'Safeguarding',
          description: 'The project intervention for women and girls empowerment involves stakeholders of different genders and occupations. Project staff and beneficiaries are mixed gender with potential risks of harassment or safeguarding breaches.',
          riskOwner: 'Project Manager',
          likelihood: 3,
          impact: 5,
          currentScore: calculateRiskScore(3, 5), // 20
          targetScore: 6,
          variance: calculateVariance(20, 6), // 14
          riskRating: 'HIGH',
          mitigationAction: 'Organize mandatory safeguarding training for all staff and partner personnel. Establish community hotline mechanism and take immediate disciplinary action on reported incidents. Discuss safeguarding at every review workshop.',
          actionDueDate: new Date('2026-03-31'),
          personMonitoring: 'HR & Safeguarding Director',
          notes: 'Special attention to rural field delivery sites. Quarterly audit mandated.',
          assessmentResult: 'Action In Progress',
          reviewDate: new Date('2026-12-12'),
          assessedLikelihood: 1,
          assessedImpact: 4,
          assessmentScore: calculateRiskScore(1, 4), // 8
          assessmentRating: 'MEDIUM',
          status: 'UNDER_REVIEW',
        },
        {
          projectId: defaultProject._id,
          riskNo: 2,
          dateAdded: new Date('2024-12-15'),
          category: 'People',
          subCategory: 'Safeguarding',
          description: 'Community stakeholders may lack awareness of anonymous reporting hotlines, potentially silencing affected women and girls in remote operational areas.',
          riskOwner: 'Project Manager',
          likelihood: 3,
          impact: 4,
          currentScore: calculateRiskScore(3, 4), // 16
          targetScore: 7,
          variance: calculateVariance(16, 7), // 9
          riskRating: 'HIGH',
          mitigationAction: 'Deploy multi-language awareness posters and conduct field-level orientation sessions during community mobilization drives.',
          actionDueDate: new Date('2026-04-15'),
          personMonitoring: 'Field Operations Lead',
          notes: 'Include illustrated materials for low-literacy communities.',
          assessmentResult: 'Tolerable',
          reviewDate: new Date('2026-12-15'),
          assessedLikelihood: 1,
          assessedImpact: 3,
          assessmentScore: calculateRiskScore(1, 3), // 6
          assessmentRating: 'LOW',
          status: 'OPEN',
        },
        {
          projectId: defaultProject._id,
          riskNo: 3,
          dateAdded: new Date('2024-12-20'),
          category: 'Strategy & Governance',
          subCategory: 'Strategy relevance',
          description: 'Shifting statutory regulations on NGO local community operations could delay field implementation permits.',
          riskOwner: 'Project Manager',
          likelihood: 1,
          impact: 3,
          currentScore: calculateRiskScore(1, 3), // 6
          targetScore: 4,
          variance: calculateVariance(6, 4), // 2
          riskRating: 'LOW',
          mitigationAction: 'Maintain proactive liaison with NGO Affairs Bureau and submit quarterly compliance documentation ahead of deadlines.',
          actionDueDate: new Date('2026-06-30'),
          personMonitoring: 'Compliance Officer',
          notes: 'Annual NGO clearance renewal calendar created.',
          assessmentResult: 'On Track',
          reviewDate: new Date('2026-12-20'),
          assessedLikelihood: 1,
          assessedImpact: 3,
          assessmentScore: calculateRiskScore(1, 3), // 6
          assessmentRating: 'LOW',
          status: 'OPEN',
        },
        {
          projectId: defaultProject._id,
          riskNo: 4,
          dateAdded: new Date('2024-12-22'),
          category: 'People',
          subCategory: 'Safeguarding',
          description: 'Women and girl beneficiaries face potential exposure to sexual harassment or intimidation from third-party vendor representatives or external stakeholders.',
          riskOwner: 'Project Manager',
          likelihood: 4,
          impact: 5,
          currentScore: calculateRiskScore(4, 5), // 25
          targetScore: 7,
          variance: calculateVariance(25, 7), // 18
          riskRating: 'HIGH',
          mitigationAction: 'Enforce contractual safeguarding clauses with all supply chain vendors. Require signed code of conduct before site access. Immediate vendor blacklisting upon violation.',
          actionDueDate: new Date('2026-08-31'),
          personMonitoring: 'Procurement & HR Committee',
          notes: 'Vendor audit checklist updated with zero-tolerance clause.',
          assessmentResult: 'High Priority Action',
          reviewDate: new Date('2026-12-22'),
          assessedLikelihood: 2,
          assessedImpact: 4,
          assessmentScore: calculateRiskScore(2, 4), // 12
          assessmentRating: 'MEDIUM',
          status: 'UNDER_REVIEW',
        },
        {
          projectId: defaultProject._id,
          riskNo: 5,
          dateAdded: new Date('2025-01-10'),
          category: 'Finance & Services',
          subCategory: 'Data protection & cyber attack',
          description: 'Risk of unauthorized access or disclosure of sensitive beneficiary personal information stored in project field tablets.',
          riskOwner: 'IT Systems Manager',
          likelihood: 2,
          impact: 4,
          currentScore: calculateRiskScore(2, 4), // 12
          targetScore: 4,
          variance: calculateVariance(12, 4), // 8
          riskRating: 'MEDIUM',
          mitigationAction: 'Implement AES-256 database encryption, enforce two-factor authentication on field tablets, and institute automatic remote-wipe capabilities.',
          actionDueDate: new Date('2026-05-31'),
          personMonitoring: 'Information Security Officer',
          notes: 'Regular penetration test scheduled every six months.',
          assessmentResult: 'Mitigation Deployed',
          reviewDate: new Date('2026-07-15'),
          assessedLikelihood: 1,
          assessedImpact: 3,
          assessmentScore: calculateRiskScore(1, 3), // 6
          assessmentRating: 'LOW',
          status: 'OPEN',
        }
      ];

      await RiskRecord.insertMany(sampleRisks);
      console.log(`[RiskRegister] Seeded ${sampleRisks.length} initial risk records.`);
    }
  } catch (err) {
    console.error('[RiskRegister] Seeding error:', err.message);
  }
};

// -------------------------------------------------------------
// PROJECT CONTROLLERS
// -------------------------------------------------------------

/**
 * Get all Risk Projects with aggregated risk statistics
 */
export const getProjects = async (req, res) => {
  try {
    await seedRiskDataIfEmpty();

    // Query projects
    const projects = await RiskProject.find().sort({ isDefault: -1, createdAt: -1 });

    // Aggregate risk counts for each project
    const projectStats = await RiskRecord.aggregate([
      {
        $group: {
          _id: '$projectId',
          totalRisks: { $sum: 1 },
          highRisks: { $sum: { $cond: [{ $eq: ['$riskRating', 'HIGH'] }, 1, 0] } },
          mediumRisks: { $sum: { $cond: [{ $eq: ['$riskRating', 'MEDIUM'] }, 1, 0] } },
          lowRisks: { $sum: { $cond: [{ $eq: ['$riskRating', 'LOW'] }, 1, 0] } },
          avgScore: { $avg: '$currentScore' }
        }
      }
    ]);

    const statsMap = {};
    projectStats.forEach(stat => {
      statsMap[stat._id.toString()] = {
        totalRisks: stat.totalRisks,
        highRisks: stat.highRisks,
        mediumRisks: stat.mediumRisks,
        lowRisks: stat.lowRisks,
        avgScore: stat.avgScore ? Number(stat.avgScore.toFixed(1)) : 0
      };
    });

    const enrichedProjects = projects.map(p => {
      const stats = statsMap[p._id.toString()] || {
        totalRisks: 0,
        highRisks: 0,
        mediumRisks: 0,
        lowRisks: 0,
        avgScore: 0
      };
      return {
        ...p.toObject(),
        stats
      };
    });

    return res.status(200).json({
      success: true,
      data: enrichedProjects
    });
  } catch (error) {
    console.error('Error in getProjects:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve risk projects',
      error: error.message
    });
  }
};

/**
 * Get single project by ID with its summary stats
 */
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Project ID' });
    }

    const project = await RiskProject.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Stats
    const stats = await RiskRecord.aggregate([
      { $match: { projectId: project._id } },
      {
        $group: {
          _id: null,
          totalRisks: { $sum: 1 },
          highRisks: { $sum: { $cond: [{ $eq: ['$riskRating', 'HIGH'] }, 1, 0] } },
          mediumRisks: { $sum: { $cond: [{ $eq: ['$riskRating', 'MEDIUM'] }, 1, 0] } },
          lowRisks: { $sum: { $cond: [{ $eq: ['$riskRating', 'LOW'] }, 1, 0] } },
          avgScore: { $avg: '$currentScore' }
        }
      }
    ]);

    const projectData = project.toObject();
    projectData.stats = stats[0] ? {
      totalRisks: stats[0].totalRisks,
      highRisks: stats[0].highRisks,
      mediumRisks: stats[0].mediumRisks,
      lowRisks: stats[0].lowRisks,
      avgScore: Number((stats[0].avgScore || 0).toFixed(1))
    } : {
      totalRisks: 0,
      highRisks: 0,
      mediumRisks: 0,
      lowRisks: 0,
      avgScore: 0
    };

    return res.status(200).json({
      success: true,
      data: projectData
    });
  } catch (error) {
    console.error('Error in getProjectById:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch project details',
      error: error.message
    });
  }
};

/**
 * Create a new HR Risk Project
 */
export const createProject = async (req, res) => {
  try {
    const {
      name,
      officeResponsible,
      location,
      period,
      reviewQuarter,
      endQuarter,
      description,
      status
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Project Name is required' });
    }

    const newProject = await RiskProject.create({
      name: name.trim(),
      officeResponsible: (officeResponsible || '').trim(),
      location: (location || '').trim(),
      period: (period || '').trim(),
      reviewQuarter: (reviewQuarter || '').trim(),
      endQuarter: (endQuarter || '').trim(),
      description: (description || '').trim(),
      status: status || 'ACTIVE',
      createdBy: req.user?._id,
      updatedBy: req.user?._id
    });

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: newProject
    });
  } catch (error) {
    console.error('Error in createProject:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message
    });
  }
};

/**
 * Update project details (Project Information fields)
 */
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Project ID' });
    }

    const {
      name,
      officeResponsible,
      location,
      period,
      reviewQuarter,
      endQuarter,
      description,
      status
    } = req.body;

    const project = await RiskProject.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (name !== undefined) project.name = name.trim();
    if (officeResponsible !== undefined) project.officeResponsible = officeResponsible.trim();
    if (location !== undefined) project.location = location.trim();
    if (period !== undefined) project.period = period.trim();
    if (reviewQuarter !== undefined) project.reviewQuarter = reviewQuarter.trim();
    if (endQuarter !== undefined) project.endQuarter = endQuarter.trim();
    if (description !== undefined) project.description = description.trim();
    if (status !== undefined) project.status = status;
    project.updatedBy = req.user?._id;

    await project.save();

    return res.status(200).json({
      success: true,
      message: 'Project information updated successfully',
      data: project
    });
  } catch (error) {
    console.error('Error in updateProject:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update project information',
      error: error.message
    });
  }
};

/**
 * Delete project and optionally its risk records
 */
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Project ID' });
    }

    const project = await RiskProject.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Delete associated risk records
    const deleteRecordsResult = await RiskRecord.deleteMany({ projectId: id });
    await RiskProject.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Project and ${deleteRecordsResult.deletedCount} risk records removed successfully.`
    });
  } catch (error) {
    console.error('Error in deleteProject:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message
    });
  }
};

// -------------------------------------------------------------
// RISK RECORD CONTROLLERS
// -------------------------------------------------------------

/**
 * List risk records with dynamic filtering, search, sorting & pagination
 */
export const getRiskRecords = async (req, res) => {
  try {
    await seedRiskDataIfEmpty();

    const {
      projectId,
      category,
      subCategory,
      riskOwner,
      riskRating,
      assessmentResult,
      status,
      search,
      sortBy = 'riskNo',
      sortOrder = 'asc',
      page = 1,
      limit = 50
    } = req.query;

    const query = {};

    // Filter by project
    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
      query.projectId = new mongoose.Types.ObjectId(projectId);
    } else {
      // If no projectId provided, default to the first active/default project
      const defaultProj = await RiskProject.findOne().sort({ isDefault: -1, createdAt: 1 });
      if (defaultProj) {
        query.projectId = defaultProj._id;
      }
    }

    // Filter by Category
    if (category && category !== 'ALL') {
      query.category = category;
    }

    // Filter by SubCategory
    if (subCategory && subCategory !== 'ALL') {
      query.subCategory = subCategory;
    }

    // Filter by Risk Owner
    if (riskOwner && riskOwner !== 'ALL') {
      query.riskOwner = { $regex: new RegExp(riskOwner, 'i') };
    }

    // Filter by Rating (HIGH, MEDIUM, LOW)
    if (riskRating && riskRating !== 'ALL') {
      query.riskRating = riskRating.toUpperCase();
    }

    // Filter by Status
    if (status && status !== 'ALL') {
      query.status = status;
    }

    // Filter by Assessment Result
    if (assessmentResult && assessmentResult !== 'ALL') {
      query.assessmentResult = { $regex: new RegExp(assessmentResult, 'i') };
    }

    // Text Search
    if (search && search.trim()) {
      const s = search.trim();
      const numSearch = Number(s);
      const orConditions = [
        { description: { $regex: s, $options: 'i' } },
        { riskOwner: { $regex: s, $options: 'i' } },
        { mitigationAction: { $regex: s, $options: 'i' } },
        { notes: { $regex: s, $options: 'i' } },
        { category: { $regex: s, $options: 'i' } },
        { subCategory: { $regex: s, $options: 'i' } },
        { personMonitoring: { $regex: s, $options: 'i' } },
        { assessmentResult: { $regex: s, $options: 'i' } }
      ];
      if (!isNaN(numSearch)) {
        orConditions.push({ riskNo: numSearch });
      }
      query.$or = orConditions;
    }

    const sortDir = sortOrder === 'desc' ? -1 : 1;
    const sortObj = {};
    sortObj[sortBy] = sortDir;
    if (sortBy !== 'riskNo') {
      sortObj.riskNo = 1;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, records] = await Promise.all([
      RiskRecord.countDocuments(query),
      RiskRecord.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('projectId', 'name officeResponsible location period reviewQuarter endQuarter')
    ]);

    return res.status(200).json({
      success: true,
      data: records,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error in getRiskRecords:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve risk records',
      error: error.message
    });
  }
};

/**
 * Get single risk record by ID
 */
export const getRiskRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Risk Record ID' });
    }

    const record = await RiskRecord.findById(id).populate('projectId');
    if (!record) {
      return res.status(404).json({ success: false, message: 'Risk record not found' });
    }

    return res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Error in getRiskRecordById:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve risk record',
      error: error.message
    });
  }
};

/**
 * Create a new risk record under a project
 */
export const createRiskRecord = async (req, res) => {
  try {
    const {
      projectId,
      riskNo,
      dateAdded,
      category,
      subCategory,
      description,
      riskOwner,
      likelihood,
      impact,
      targetScore,
      mitigationAction,
      actionDueDate,
      personMonitoring,
      notes,
      assessmentResult,
      reviewDate,
      assessedLikelihood,
      assessedImpact,
      status
    } = req.body;

    // Validate required fields
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: 'Valid Project ID is required' });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description of Risk is required' });
    }

    const parsedLikelihood = Number(likelihood);
    const parsedImpact = Number(impact);

    if (isNaN(parsedLikelihood) || parsedLikelihood < 1 || parsedLikelihood > 5) {
      return res.status(400).json({ success: false, message: 'Likelihood must be a number between 1 and 5' });
    }

    if (isNaN(parsedImpact) || parsedImpact < 1 || parsedImpact > 5) {
      return res.status(400).json({ success: false, message: 'Impact must be a number between 1 and 5' });
    }

    // Auto-generate next riskNo if not provided
    let assignedRiskNo = Number(riskNo);
    if (!assignedRiskNo || isNaN(assignedRiskNo)) {
      const highestRecord = await RiskRecord.findOne({ projectId }).sort({ riskNo: -1 });
      assignedRiskNo = highestRecord ? (highestRecord.riskNo + 1) : 1;
    }

    // Calculations
    const currentScore = calculateRiskScore(parsedLikelihood, parsedImpact);
    const riskRating = getRiskRating(currentScore);
    const parsedTarget = (targetScore !== undefined && targetScore !== null && targetScore !== '') 
      ? Number(targetScore) 
      : null;
    const variance = calculateVariance(currentScore, parsedTarget);

    let parsedAssessedLikelihood = (assessedLikelihood !== undefined && assessedLikelihood !== null && assessedLikelihood !== '') 
      ? Number(assessedLikelihood) 
      : null;
    let parsedAssessedImpact = (assessedImpact !== undefined && assessedImpact !== null && assessedImpact !== '') 
      ? Number(assessedImpact) 
      : null;

    let assessmentScore = null;
    let assessmentRating = null;

    if (parsedAssessedLikelihood && parsedAssessedImpact) {
      assessmentScore = calculateRiskScore(parsedAssessedLikelihood, parsedAssessedImpact);
      assessmentRating = getRiskRating(assessmentScore);
    }

    const newRecord = await RiskRecord.create({
      projectId,
      riskNo: assignedRiskNo,
      dateAdded: dateAdded ? new Date(dateAdded) : new Date(),
      category: category.trim(),
      subCategory: (subCategory || '').trim(),
      description: description.trim(),
      riskOwner: (riskOwner || '').trim(),
      likelihood: parsedLikelihood,
      impact: parsedImpact,
      currentScore,
      targetScore: parsedTarget,
      variance,
      mitigationAction: (mitigationAction || '').trim(),
      actionDueDate: actionDueDate ? new Date(actionDueDate) : null,
      personMonitoring: (personMonitoring || '').trim(),
      notes: (notes || '').trim(),
      assessmentResult: (assessmentResult || '').trim(),
      reviewDate: reviewDate ? new Date(reviewDate) : null,
      assessedLikelihood: parsedAssessedLikelihood,
      assessedImpact: parsedAssessedImpact,
      assessmentScore,
      riskRating,
      assessmentRating,
      status: status || 'OPEN',
      createdBy: req.user?._id,
      updatedBy: req.user?._id
    });

    return res.status(201).json({
      success: true,
      message: 'Risk record created successfully',
      data: newRecord
    });
  } catch (error) {
    console.error('Error in createRiskRecord:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create risk record',
      error: error.message
    });
  }
};

/**
 * Update an existing risk record
 */
export const updateRiskRecord = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Risk Record ID' });
    }

    const record = await RiskRecord.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Risk record not found' });
    }

    const updates = req.body;

    if (updates.riskNo !== undefined) record.riskNo = Number(updates.riskNo);
    if (updates.dateAdded !== undefined) record.dateAdded = updates.dateAdded ? new Date(updates.dateAdded) : record.dateAdded;
    if (updates.category !== undefined) record.category = updates.category.trim();
    if (updates.subCategory !== undefined) record.subCategory = updates.subCategory.trim();
    if (updates.description !== undefined) record.description = updates.description.trim();
    if (updates.riskOwner !== undefined) record.riskOwner = updates.riskOwner.trim();
    if (updates.mitigationAction !== undefined) record.mitigationAction = updates.mitigationAction.trim();
    if (updates.actionDueDate !== undefined) record.actionDueDate = updates.actionDueDate ? new Date(updates.actionDueDate) : null;
    if (updates.personMonitoring !== undefined) record.personMonitoring = updates.personMonitoring.trim();
    if (updates.notes !== undefined) record.notes = updates.notes.trim();
    if (updates.assessmentResult !== undefined) record.assessmentResult = updates.assessmentResult.trim();
    if (updates.reviewDate !== undefined) record.reviewDate = updates.reviewDate ? new Date(updates.reviewDate) : null;
    if (updates.status !== undefined) record.status = updates.status;

    // Recalculate Current Score & Variance
    if (updates.likelihood !== undefined) record.likelihood = Number(updates.likelihood);
    if (updates.impact !== undefined) record.impact = Number(updates.impact);
    if (updates.targetScore !== undefined) {
      record.targetScore = (updates.targetScore !== null && updates.targetScore !== '') 
        ? Number(updates.targetScore) 
        : null;
    }

    record.currentScore = calculateRiskScore(record.likelihood, record.impact);
    record.riskRating = getRiskRating(record.currentScore);
    record.variance = calculateVariance(record.currentScore, record.targetScore);

    // Recalculate Assessment Score
    if (updates.assessedLikelihood !== undefined) {
      record.assessedLikelihood = (updates.assessedLikelihood !== null && updates.assessedLikelihood !== '') 
        ? Number(updates.assessedLikelihood) 
        : null;
    }
    if (updates.assessedImpact !== undefined) {
      record.assessedImpact = (updates.assessedImpact !== null && updates.assessedImpact !== '') 
        ? Number(updates.assessedImpact) 
        : null;
    }

    if (record.assessedLikelihood && record.assessedImpact) {
      record.assessmentScore = calculateRiskScore(record.assessedLikelihood, record.assessedImpact);
      record.assessmentRating = getRiskRating(record.assessmentScore);
    } else {
      record.assessmentScore = null;
      record.assessmentRating = null;
    }

    record.updatedBy = req.user?._id;

    await record.save();

    return res.status(200).json({
      success: true,
      message: 'Risk record updated successfully',
      data: record
    });
  } catch (error) {
    console.error('Error in updateRiskRecord:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update risk record',
      error: error.message
    });
  }
};

/**
 * Delete a risk record
 */
export const deleteRiskRecord = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Risk Record ID' });
    }

    const record = await RiskRecord.findByIdAndDelete(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Risk record not found' });
    }

    return res.status(200).json({
      success: true,
      message: `Risk #${record.riskNo} deleted successfully`
    });
  } catch (error) {
    console.error('Error in deleteRiskRecord:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete risk record',
      error: error.message
    });
  }
};

// -------------------------------------------------------------
// CATEGORIES & CONFIG CONTROLLERS
// -------------------------------------------------------------

/**
 * Get all available categories and subcategories
 */
export const getCategories = async (req, res) => {
  try {
    await seedRiskDataIfEmpty();

    const dbCategories = await RiskCategory.find().sort({ name: 1 });
    
    // Return db categories or default fallback
    const list = dbCategories.length > 0 ? dbCategories : DEFAULT_RISK_CATEGORIES;

    return res.status(200).json({
      success: true,
      data: list,
      scoringMeta: {
        formula: 'Score = (Likelihood x Impact) + Impact',
        varianceFormula: 'Variance = Current Score - Target Score',
        ragLegend: {
          high: { min: 15, max: 30, color: 'Red', label: 'High Risk (Scores >= 15)' },
          medium: { min: 8, max: 14, color: 'Amber', label: 'Medium Risk (Scores 8 to 14)' },
          low: { min: 0, max: 7, color: 'Green', label: 'Low Risk (Scores < 8)' }
        },
        likelihoodLevels: LIKELIHOOD_LEVELS,
        impactLevels: IMPACT_LEVELS
      }
    });
  } catch (error) {
    console.error('Error in getCategories:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

/**
 * Add a new custom category or add a subcategory to an existing category
 */
export const createCategoryOrSub = async (req, res) => {
  try {
    const { categoryName, code, description, subCategoryName, subCategoryCode, note } = req.body;

    if (!categoryName || !categoryName.trim()) {
      return res.status(400).json({ success: false, message: 'Category Name is required' });
    }

    const trimmedCat = categoryName.trim();
    let existingCat = await RiskCategory.findOne({ name: { $regex: new RegExp(`^${trimmedCat}$`, 'i') } });

    if (existingCat) {
      // Add subcategory to existing category
      if (subCategoryName && subCategoryName.trim()) {
        const trimmedSub = subCategoryName.trim();
        const subExists = existingCat.subCategories.some(
          s => s.name.toLowerCase() === trimmedSub.toLowerCase()
        );

        if (subExists) {
          return res.status(400).json({ success: false, message: 'Subcategory already exists under this category' });
        }

        existingCat.subCategories.push({
          name: trimmedSub,
          code: (subCategoryCode || '').trim(),
          note: (note || '').trim()
        });

        await existingCat.save();
        return res.status(200).json({
          success: true,
          message: 'Subcategory added successfully',
          data: existingCat
        });
      }

      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    // Create new Category
    const newCategory = await RiskCategory.create({
      name: trimmedCat,
      code: (code || '').trim(),
      description: (description || '').trim(),
      subCategories: subCategoryName ? [{
        name: subCategoryName.trim(),
        code: (subCategoryCode || '').trim(),
        note: (note || '').trim()
      }] : [],
      isCustom: true
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
    });
  } catch (error) {
    console.error('Error in createCategoryOrSub:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create category or subcategory',
      error: error.message
    });
  }
};

// -------------------------------------------------------------
// STATS & HEAT MAP CONTROLLERS
// -------------------------------------------------------------

/**
 * Global or Project-specific Risk Statistics & Heatmap Matrix
 */
export const getRiskStats = async (req, res) => {
  try {
    await seedRiskDataIfEmpty();

    const { projectId } = req.query;
    const match = {};

    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
      match.projectId = new mongoose.Types.ObjectId(projectId);
    }

    const records = await RiskRecord.find(match);

    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let totalScore = 0;
    const categoryCounts = {};
    const ownerCounts = {};

    // 5x5 Heatmap Matrix: likelihood (1..5) vs impact (1..5)
    // heatmap[likelihood][impact] = count
    const heatmap = {};
    for (let l = 1; l <= 5; l++) {
      heatmap[l] = {};
      for (let i = 1; i <= 5; i++) {
        heatmap[l][i] = 0;
      }
    }

    records.forEach(r => {
      if (r.riskRating === 'HIGH') highCount++;
      else if (r.riskRating === 'MEDIUM') mediumCount++;
      else lowCount++;

      totalScore += (r.currentScore || 0);

      // Category breakdown
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;

      // Owner breakdown
      if (r.riskOwner) {
        ownerCounts[r.riskOwner] = (ownerCounts[r.riskOwner] || 0) + 1;
      }

      // Heatmap matrix
      if (r.likelihood >= 1 && r.likelihood <= 5 && r.impact >= 1 && r.impact <= 5) {
        heatmap[r.likelihood][r.impact] += 1;
      }
    });

    const totalRisks = records.length;
    const avgScore = totalRisks > 0 ? Number((totalScore / totalRisks).toFixed(1)) : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalRisks,
        highCount,
        mediumCount,
        lowCount,
        avgScore,
        categoryCounts,
        ownerCounts,
        heatmap
      }
    });
  } catch (error) {
    console.error('Error in getRiskStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve risk statistics',
      error: error.message
    });
  }
};
