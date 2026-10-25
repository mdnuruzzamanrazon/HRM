import mongoose from 'mongoose';
import { RiskProject } from '../models/RiskProject.js';
import { RiskRecord } from '../models/RiskRecord.js';
import { ComplaintRecord } from '../models/ComplaintRecord.js';
import EventRecord from '../models/EventRecord.js';
import Beneficiary from '../models/Beneficiary.js';
import { User } from '../models/User.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';

// Helper to calculate project stats across all 4 modules
export const calculateProjectStats = async (projectId) => {
  if (isDemoMode() || mongoose.connection.readyState !== 1) {
    const pIdStr = String(projectId);
    const risks = (mockData.riskRecords || []).filter(r => String(r.projectId) === pIdStr);
    const complaints = (mockData.complaintRecords || []).filter(c => String(c.projectId) === pIdStr && !c.isDeleted);
    const events = (mockData.eventRecords || []).filter(e => String(e.projectId) === pIdStr && !e.isDeleted);
    const beneficiaries = (mockData.beneficiaries || []).filter(b => String(b.projectId) === pIdStr);

    return {
      risks: {
        total: risks.length,
        high: risks.filter(r => r.riskRating === 'HIGH').length,
        medium: risks.filter(r => r.riskRating === 'MEDIUM').length,
        low: risks.filter(r => r.riskRating === 'LOW').length,
      },
      complaints: {
        total: complaints.length,
        open: complaints.filter(c => c.status === 'Open').length,
        closed: complaints.filter(c => c.status === 'Closed').length,
        overdue: complaints.filter(c => c.status === 'Open' && c.dateReceived && (Date.now() - new Date(c.dateReceived).getTime() > 30 * 24 * 60 * 60 * 1000)).length,
      },
      events: {
        total: events.length,
        participants: events.reduce((sum, e) => sum + (e.participantCountCommunity || 0), 0),
      },
      beneficiaries: {
        total: beneficiaries.length,
        female: beneficiaries.filter(b => b.sex === 'Female').length,
        male: beneficiaries.filter(b => b.sex === 'Male').length,
      }
    };
  }

  const pObjectId = new mongoose.Types.ObjectId(projectId);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [riskAgg, complaintAgg, eventAgg, benAgg] = await Promise.all([
    RiskRecord.aggregate([
      { $match: { projectId: pObjectId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          high: { $sum: { $cond: [{ $eq: ['$riskRating', 'HIGH'] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ['$riskRating', 'MEDIUM'] }, 1, 0] } },
          low: { $sum: { $cond: [{ $eq: ['$riskRating', 'LOW'] }, 1, 0] } },
          avgScore: { $avg: '$currentScore' }
        }
      }
    ]),
    ComplaintRecord.aggregate([
      { $match: { projectId: pObjectId, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', 'Open'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', 'Open'] }, { $lt: ['$dateReceived', thirtyDaysAgo] }] },
                1,
                0
              ]
            }
          },
          appeals: { $sum: { $cond: [{ $eq: ['$hasAppeal', true] }, 1, 0] } }
        }
      }
    ]),
    EventRecord.aggregate([
      { $match: { projectId: pObjectId, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          participants: { $sum: '$participantCountCommunity' },
          reach: { $sum: '$estimatedAudienceReach' }
        }
      }
    ]),
    Beneficiary.aggregate([
      { $match: { projectId: pObjectId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          female: { $sum: { $cond: [{ $eq: ['$sex', 'Female'] }, 1, 0] } },
          male: { $sum: { $cond: [{ $eq: ['$sex', 'Male'] }, 1, 0] } },
          disability: { $sum: { $cond: [{ $eq: ['$disability', 'Yes'] }, 1, 0] } },
          adibashi: { $sum: { $cond: [{ $eq: ['$adibashi', 'Yes'] }, 1, 0] } },
          dalit: { $sum: { $cond: [{ $eq: ['$dalit', 'Yes'] }, 1, 0] } }
        }
      }
    ])
  ]);

  return {
    risks: riskAgg[0] || { total: 0, high: 0, medium: 0, low: 0, avgScore: 0 },
    complaints: complaintAgg[0] || { total: 0, open: 0, closed: 0, overdue: 0, appeals: 0 },
    events: eventAgg[0] || { total: 0, participants: 0, reach: 0 },
    beneficiaries: benAgg[0] || { total: 0, female: 0, male: 0, disability: 0, adibashi: 0, dalit: 0 }
  };
};

/**
 * Generate a consistent, human-friendly Project Code if not supplied
 */
const generateProjectCode = (name) => {
  const words = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
  if (words.length === 1) {
    return `PRJ-${words[0].substring(0, 4).toUpperCase()}`;
  }
  const initials = words.slice(0, 4).map(w => w[0].toUpperCase()).join('');
  return `PRJ-${initials}`;
};

/**
 * GET /api/v1/projects
 * List all projects with search, status filtering, and multi-module metrics
 */
export const getProjects = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      let list = (mockData.riskProjects || []).filter(p => !p.isDeleted);
      if (status && status !== 'ALL') {
        list = list.filter(p => p.status === status);
      }
      if (search && search.trim()) {
        const s = search.toLowerCase().trim();
        list = list.filter(p => 
          (p.name || '').toLowerCase().includes(s) ||
          (p.code || '').toLowerCase().includes(s) ||
          (p.description || '').toLowerCase().includes(s) ||
          (p.location || '').toLowerCase().includes(s) ||
          (p.projectManager || '').toLowerCase().includes(s)
        );
      }

      const enriched = await Promise.all(list.map(async p => {
        const stats = await calculateProjectStats(p._id);
        return { ...p, stats };
      }));

      return res.status(200).json({
        success: true,
        data: enriched,
        pagination: { total: enriched.length, page: 1, limit: 50, totalPages: 1 },
        isDemoMode: true
      });
    }

    const query = { isDeleted: { $ne: true } };

    // Role-based filtering: If user is not Admin/SuperAdmin and has restricted assignments
    if (req.user && !['SUPER_ADMIN', 'HR_ADMIN'].includes(req.user.role)) {
      query.$or = [
        { 'assignedUsers.user': req.user._id },
        { assignedUsers: { $size: 0 } },
        { assignedUsers: { $exists: false } }
      ];
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { name: regex },
            { code: regex },
            { description: regex },
            { location: regex },
            { officeResponsible: regex },
            { projectManager: regex },
            { responsiblePerson: regex }
          ]
        }
      ];
    }

    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortDir };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, rawProjects] = await Promise.all([
      RiskProject.countDocuments(query),
      RiskProject.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('assignedUsers.user', 'email role')
        .lean()
    ]);

    // Enrich each project with live statistics across all 4 modules
    const enrichedProjects = await Promise.all(
      rawProjects.map(async (project) => {
        const stats = await calculateProjectStats(project._id);
        return {
          ...project,
          stats
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: enrichedProjects,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (error) {
    console.error('Error in getProjects:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve projects',
      error: error.message
    });
  }
};

/**
 * GET /api/v1/projects/:id
 * Retrieve a single project by ID with its complete stats and audit trail
 */
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const project = (mockData.riskProjects || []).find(p => String(p._id) === String(id));
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      const stats = await calculateProjectStats(project._id);
      return res.status(200).json({ success: true, data: { ...project, stats } });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Project ID format' });
    }

    const project = await RiskProject.findById(id)
      .populate('assignedUsers.user', 'email role')
      .lean();

    if (!project || project.isDeleted) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const stats = await calculateProjectStats(project._id);

    return res.status(200).json({
      success: true,
      data: {
        ...project,
        stats
      }
    });
  } catch (error) {
    console.error('Error in getProjectById:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve project details',
      error: error.message
    });
  }
};

/**
 * GET /api/v1/projects/:id/dashboard
 * Detailed project-specific dashboard metrics for visualization and reporting
 */
export const getProjectDashboard = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Project ID' });
    }

    const pObjectId = new mongoose.Types.ObjectId(id);
    const project = await RiskProject.findById(pObjectId).lean();

    if (!project || project.isDeleted) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Multi-module deep aggregations
    const [
      riskStats,
      risksByCategory,
      complaintStats,
      complaintsByCategory,
      complaintsByChannel,
      eventStats,
      eventsByType,
      eventsByDivision,
      benStats,
      benByDivision,
      recentRisks,
      recentComplaints,
      recentEvents,
      recentBeneficiaries
    ] = await Promise.all([
      // 1. Risks Summary
      RiskRecord.aggregate([
        { $match: { projectId: pObjectId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            high: { $sum: { $cond: [{ $eq: ['$riskRating', 'HIGH'] }, 1, 0] } },
            medium: { $sum: { $cond: [{ $eq: ['$riskRating', 'MEDIUM'] }, 1, 0] } },
            low: { $sum: { $cond: [{ $eq: ['$riskRating', 'LOW'] }, 1, 0] } },
            open: { $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] } },
            underReview: { $sum: { $cond: [{ $eq: ['$status', 'UNDER_REVIEW'] }, 1, 0] } },
            mitigated: { $sum: { $cond: [{ $eq: ['$status', 'MITIGATED'] }, 1, 0] } },
            avgScore: { $avg: '$currentScore' },
            avgTarget: { $avg: '$targetScore' }
          }
        }
      ]),
      // Risks by Category
      RiskRecord.aggregate([
        { $match: { projectId: pObjectId } },
        { $group: { _id: '$category', count: { $sum: 1 }, highCount: { $sum: { $cond: [{ $eq: ['$riskRating', 'HIGH'] }, 1, 0] } } } },
        { $sort: { count: -1 } }
      ]),

      // 2. Complaints Summary
      ComplaintRecord.aggregate([
        { $match: { projectId: pObjectId, isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            open: { $sum: { $cond: [{ $eq: ['$status', 'Open'] }, 1, 0] } },
            closed: { $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] } },
            overdue: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$status', 'Open'] }, { $lt: ['$dateReceived', thirtyDaysAgo] }] },
                  1,
                  0
                ]
              }
            },
            appeals: { $sum: { $cond: [{ $eq: ['$hasAppeal', true] }, 1, 0] } },
            anonymous: { $sum: { $cond: [{ $eq: ['$isAnonymous', true] }, 1, 0] } }
          }
        }
      ]),
      // Complaints by Category
      ComplaintRecord.aggregate([
        { $match: { projectId: pObjectId, isDeleted: { $ne: true } } },
        { $group: { _id: '$complaintCategory', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ]),
      // Complaints by Channel
      ComplaintRecord.aggregate([
        { $match: { projectId: pObjectId, isDeleted: { $ne: true } } },
        { $group: { _id: '$receivingChannel', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // 3. Events Summary
      EventRecord.aggregate([
        { $match: { projectId: pObjectId, isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            participants: { $sum: '$participantCountCommunity' },
            reach: { $sum: '$estimatedAudienceReach' },
            govRepPresent: { $sum: { $cond: [{ $eq: ['$govRepresentativePresent', 'Yes'] }, 1, 0] } },
            conflictPrevention: { $sum: { $cond: [{ $eq: ['$conflictPrevention', 'Yes'] }, 1, 0] } }
          }
        }
      ]),
      // Events by Type
      EventRecord.aggregate([
        { $match: { projectId: pObjectId, isDeleted: { $ne: true } } },
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ]),
      // Events by Division
      EventRecord.aggregate([
        { $match: { projectId: pObjectId, isDeleted: { $ne: true } } },
        { $group: { _id: '$division', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // 4. Beneficiaries Summary
      Beneficiary.aggregate([
        { $match: { projectId: pObjectId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            female: { $sum: { $cond: [{ $eq: ['$sex', 'Female'] }, 1, 0] } },
            male: { $sum: { $cond: [{ $eq: ['$sex', 'Male'] }, 1, 0] } },
            disability: { $sum: { $cond: [{ $eq: ['$disability', 'Yes'] }, 1, 0] } },
            adibashi: { $sum: { $cond: [{ $eq: ['$adibashi', 'Yes'] }, 1, 0] } },
            dalit: { $sum: { $cond: [{ $eq: ['$dalit', 'Yes'] }, 1, 0] } },
            crossForum: { $sum: { $cond: [{ $eq: ['$crossForumMember', true] }, 1, 0] } }
          }
        }
      ]),
      // Beneficiaries by Division
      Beneficiary.aggregate([
        { $match: { projectId: pObjectId } },
        { $group: { _id: '$division', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Recent Records for activity feed
      RiskRecord.find({ projectId: pObjectId }).sort({ createdAt: -1 }).limit(3).select('riskNo category description currentScore riskRating createdAt').lean(),
      ComplaintRecord.find({ projectId: pObjectId, isDeleted: { $ne: true } }).sort({ dateReceived: -1 }).limit(3).select('sNo complaintCategory status dateReceived complainantName').lean(),
      EventRecord.find({ projectId: pObjectId, isDeleted: { $ne: true } }).sort({ dateFrom: -1 }).limit(3).select('eventId eventTitle eventType dateFrom division').lean(),
      Beneficiary.find({ projectId: pObjectId }).sort({ createdAt: -1 }).limit(3).select('beneficiaryId name sex division district forumName').lean()
    ]);

    return res.status(200).json({
      success: true,
      data: {
        project,
        summary: {
          risks: riskStats[0] || { total: 0, high: 0, medium: 0, low: 0, open: 0, underReview: 0, mitigated: 0, avgScore: 0, avgTarget: 0 },
          complaints: complaintStats[0] || { total: 0, open: 0, closed: 0, overdue: 0, appeals: 0, anonymous: 0 },
          events: eventStats[0] || { total: 0, participants: 0, reach: 0, govRepPresent: 0, conflictPrevention: 0 },
          beneficiaries: benStats[0] || { total: 0, female: 0, male: 0, disability: 0, adibashi: 0, dalit: 0, crossForum: 0 }
        },
        distributions: {
          risksByCategory,
          complaintsByCategory,
          complaintsByChannel,
          eventsByType,
          eventsByDivision,
          beneficiariesByDivision: benByDivision
        },
        recentActivities: {
          risks: recentRisks,
          complaints: recentComplaints,
          events: recentEvents,
          beneficiaries: recentBeneficiaries
        }
      }
    });
  } catch (error) {
    console.error('Error in getProjectDashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve project dashboard metrics',
      error: error.message
    });
  }
};

/**
 * POST /api/v1/projects
 * Create a new Project
 */
export const createProject = async (req, res) => {
  try {
    const {
      name,
      code,
      officeResponsible,
      location,
      period,
      startDate,
      endDate,
      projectManager,
      responsiblePerson,
      reviewQuarter,
      endQuarter,
      description,
      status = 'ACTIVE',
      assignedUsers = []
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Project Name is required.' });
    }

    const trimmedName = name.trim();
    const finalCode = (code && code.trim()) ? code.trim().toUpperCase() : generateProjectCode(trimmedName);

    // Check code uniqueness
    const existingCode = await RiskProject.findOne({ code: finalCode, isDeleted: { $ne: true } });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: `Project Code "${finalCode}" is already in use by another project.`
      });
    }

    const auditEntry = {
      action: 'CREATED',
      performedBy: req.user?.email || 'HR Administrator',
      userEmail: req.user?.email || '',
      role: req.user?.role || 'HR_ADMIN',
      timestamp: new Date(),
      details: `Project "${trimmedName}" (${finalCode}) created.`
    };

    const newProject = await RiskProject.create({
      name: trimmedName,
      code: finalCode,
      officeResponsible: (officeResponsible || '').trim(),
      location: (location || '').trim(),
      period: (period || '').trim(),
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      projectManager: (projectManager || '').trim(),
      responsiblePerson: (responsiblePerson || '').trim(),
      reviewQuarter: (reviewQuarter || '').trim(),
      endQuarter: (endQuarter || '').trim(),
      description: (description || '').trim(),
      status: status || 'ACTIVE',
      assignedUsers: Array.isArray(assignedUsers) ? assignedUsers : [],
      auditTrail: [auditEntry],
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
 * PUT /api/v1/projects/:id
 * Update project details
 */
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      officeResponsible,
      location,
      period,
      startDate,
      endDate,
      projectManager,
      responsiblePerson,
      reviewQuarter,
      endQuarter,
      description,
      status
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Project ID' });
    }

    const project = await RiskProject.findById(id);
    if (!project || project.isDeleted) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Code uniqueness check if changed
    if (code && code.trim().toUpperCase() !== project.code) {
      const codeCheck = await RiskProject.findOne({
        code: code.trim().toUpperCase(),
        _id: { $ne: project._id },
        isDeleted: { $ne: true }
      });
      if (codeCheck) {
        return res.status(400).json({
          success: false,
          message: `Project Code "${code.trim().toUpperCase()}" is already in use.`
        });
      }
      project.code = code.trim().toUpperCase();
    }

    const previousName = project.name;
    if (name !== undefined) project.name = name.trim();
    if (officeResponsible !== undefined) project.officeResponsible = officeResponsible.trim();
    if (location !== undefined) project.location = location.trim();
    if (period !== undefined) project.period = period.trim();
    if (startDate !== undefined) project.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) project.endDate = endDate ? new Date(endDate) : null;
    if (projectManager !== undefined) project.projectManager = projectManager.trim();
    if (responsiblePerson !== undefined) project.responsiblePerson = responsiblePerson.trim();
    if (reviewQuarter !== undefined) project.reviewQuarter = reviewQuarter.trim();
    if (endQuarter !== undefined) project.endQuarter = endQuarter.trim();
    if (description !== undefined) project.description = description.trim();
    if (status !== undefined) project.status = status;

    project.updatedBy = req.user?._id;

    // Log update in audit trail
    project.auditTrail.push({
      action: 'UPDATED',
      performedBy: req.user?.email || 'HR Administrator',
      userEmail: req.user?.email || '',
      role: req.user?.role || 'HR_ADMIN',
      timestamp: new Date(),
      details: `Project information updated by ${req.user?.email || 'Admin'}.`
    });

    await project.save();

    // If project name changed, sync projectName across records in background
    if (name && name.trim() !== previousName) {
      ComplaintRecord.updateMany({ projectId: project._id }, { projectName: project.name }).exec();
      EventRecord.updateMany({ projectId: project._id }, { projectName: project.name }).exec();
      Beneficiary.updateMany({ projectId: project._id }, { projectName: project.name }).exec();
    }

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    console.error('Error in updateProject:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message
    });
  }
};

/**
 * PATCH /api/v1/projects/:id/status
 * Activate, deactivate, hold, complete, or archive project
 */
export const updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason = '' } = req.body;

    const validStatuses = ['ACTIVE', 'INACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Project ID' });
    }

    const project = await RiskProject.findById(id);
    if (!project || project.isDeleted) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const oldStatus = project.status;
    project.status = status;
    project.updatedBy = req.user?._id;

    project.auditTrail.push({
      action: 'STATUS_CHANGE',
      performedBy: req.user?.email || 'HR Administrator',
      userEmail: req.user?.email || '',
      role: req.user?.role || 'HR_ADMIN',
      timestamp: new Date(),
      details: `Status transitioned from ${oldStatus} to ${status}.${reason ? ` Reason: ${reason}` : ''}`
    });

    await project.save();

    return res.status(200).json({
      success: true,
      message: `Project status successfully updated to ${status}`,
      data: project
    });
  } catch (error) {
    console.error('Error in updateProjectStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update project status',
      error: error.message
    });
  }
};

/**
 * POST /api/v1/projects/:id/assign
 * Manage project-level access permissions & assign users
 */
export const assignProjectUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedUsers } = req.body;

    if (!Array.isArray(assignedUsers)) {
      return res.status(400).json({
        success: false,
        message: 'assignedUsers must be an array of user assignment configurations'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Project ID' });
    }

    const project = await RiskProject.findById(id);
    if (!project || project.isDeleted) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Populate user emails for easy lookup
    const userIds = assignedUsers.map(u => u.user).filter(Boolean);
    const usersInDb = await User.find({ _id: { $in: userIds } }).select('email role').lean();
    const userMap = {};
    usersInDb.forEach(u => {
      userMap[String(u._id)] = u.email;
    });

    const validatedAssignments = assignedUsers.map(assignment => ({
      user: assignment.user,
      userEmail: userMap[String(assignment.user)] || assignment.userEmail || '',
      role: assignment.role || 'EDITOR',
      modules: assignment.modules || ['RISK', 'COMPLAINTS', 'EVENTS', 'BENEFICIARIES'],
      assignedAt: new Date()
    }));

    project.assignedUsers = validatedAssignments;
    project.updatedBy = req.user?._id;

    project.auditTrail.push({
      action: 'USER_ASSIGNED',
      performedBy: req.user?.email || 'HR Administrator',
      userEmail: req.user?.email || '',
      role: req.user?.role || 'HR_ADMIN',
      timestamp: new Date(),
      details: `Project team updated with ${validatedAssignments.length} member assignments.`
    });

    await project.save();

    return res.status(200).json({
      success: true,
      message: 'Project permissions and user assignments updated successfully',
      data: project
    });
  } catch (error) {
    console.error('Error in assignProjectUsers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user assignments',
      error: error.message
    });
  }
};

/**
 * DELETE /api/v1/projects/:id
 * Archive / soft-delete a project (Super Admin or HR Admin only)
 */
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Project ID' });
    }

    const project = await RiskProject.findById(id);
    if (!project || project.isDeleted) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Soft delete / archive to ensure historical integrity
    project.isDeleted = true;
    project.status = 'ARCHIVED';
    project.deletedAt = new Date();
    project.deletedBy = req.user?._id;

    project.auditTrail.push({
      action: 'ARCHIVED',
      performedBy: req.user?.email || 'HR Administrator',
      userEmail: req.user?.email || '',
      role: req.user?.role || 'HR_ADMIN',
      timestamp: new Date(),
      details: `Project archived by ${req.user?.email || 'Admin'}.`
    });

    await project.save();

    return res.status(200).json({
      success: true,
      message: `Project "${project.name}" archived successfully.`
    });
  } catch (error) {
    console.error('Error in deleteProject:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to archive project',
      error: error.message
    });
  }
};
