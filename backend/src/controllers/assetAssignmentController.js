import mongoose from 'mongoose';
import Asset from '../models/Asset.js';
import { AssetAssignment } from '../models/AssetAssignment.js';
import { RiskProject } from '../models/RiskProject.js';
import { Employee } from '../models/Employee.js';
import { AuditLog } from '../models/AuditLog.js';
import { isDemoMode } from '../config/db.js';
import { mockData, saveStoreToDisk, loadStoreFromDisk } from '../services/mockDataService.js';
import { getFallbackData, saveFallbackData } from './assetController.js';

const isDbActive = () => !isDemoMode() && mongoose.connection.readyState === 1;

/**
 * GET /api/v1/assets/:id/assignments
 * Retrieve current assignment and movement/allocation history for an asset.
 */
export const getAssetAssignmentHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isDbActive()) {
      loadStoreFromDisk();
      const fb = getFallbackData();
      const asset = (fb.assets || []).find(
        (a) => (String(a._id) === String(id) || a.assetId === id) && !a.isDeleted
      );
      if (!asset) {
        return res.status(404).json({ success: false, message: 'Asset master record not found.' });
      }
      const history = (mockData.assetAssignments || [])
        .filter((h) => h.assetId === asset.assetId || String(h.assetRef) === String(asset._id))
        .sort((a, b) => new Date(b.assignedDate || 0) - new Date(a.assignedDate || 0));

      return res.json({
        success: true,
        data: {
          assetId: asset.assetId,
          assetName: asset.name,
          currentAssignment: asset.currentAssignment || {
            assignmentType: 'HEAD_OFFICE',
            projectId: null,
            projectName: '',
            department: '',
            location: asset.location || 'Head Office',
            custodianName: asset.custodian || 'Unassigned',
          },
          history,
        },
      });
    }

    const asset = await Asset.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { assetId: id }],
      isDeleted: { $ne: true },
    }).lean();

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset master record not found.' });
    }

    const history = await AssetAssignment.find({ assetRef: asset._id })
      .populate('projectId', 'name code status')
      .populate('custodianEmployeeId', 'employeeCode personalDetails jobDetails')
      .sort({ assignedDate: -1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: {
        assetId: asset.assetId,
        assetName: asset.name,
        currentAssignment: asset.currentAssignment || {
          assignmentType: 'HEAD_OFFICE',
          projectId: null,
          projectName: '',
          department: '',
          location: asset.location || 'Head Office',
          custodianName: asset.custodian || 'Unassigned',
        },
        history,
      },
    });
  } catch (error) {
    console.error('[getAssetAssignmentHistory Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/assets/:id/assign
 * Assign or transfer an existing asset master record to a Project, Department, Location, or Custodian.
 * Never duplicates the Asset master record and never alters the active Project Context of the 4 modules.
 */
export const assignAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      assignmentType = 'PROJECT',
      projectId = null,
      department = '',
      location = '',
      custodianEmployeeId = null,
      custodianName = '',
      assignedDate,
      expectedReturnDate = null,
      conditionAtAssignment = '',
      notes = '',
    } = req.body;

    if (!['PROJECT', 'DEPARTMENT', 'HEAD_OFFICE', 'UNASSIGNED'].includes(assignmentType)) {
      return res.status(400).json({ success: false, message: 'Invalid assignmentType.' });
    }

    if (assignmentType === 'PROJECT' && !projectId) {
      return res.status(400).json({ success: false, message: 'Target Project ID is required for PROJECT allocation.' });
    }

    const effectiveAssignedDate = assignedDate ? new Date(assignedDate) : new Date();
    const effectiveExpectedReturn = expectedReturnDate ? new Date(expectedReturnDate) : null;
    const actorEmail = req.user?.email || 'hr.admin@cbdp.org';

    if (!isDbActive()) {
      loadStoreFromDisk();
      const fb = getFallbackData();
      const assetIdx = (fb.assets || []).findIndex(
        (a) => (String(a._id) === String(id) || a.assetId === id) && !a.isDeleted
      );
      if (assetIdx === -1) {
        return res.status(404).json({ success: false, message: 'Asset master record not found.' });
      }
      const asset = fb.assets[assetIdx];

      let resolvedProject = null;
      if (assignmentType === 'PROJECT') {
        resolvedProject = (mockData.riskProjects || []).find(
          (p) => String(p._id) === String(projectId) && !p.isDeleted
        );
        if (!resolvedProject) {
          return res.status(404).json({ success: false, message: 'Target project not found or archived.' });
        }
      }

      let resolvedCustodianName = custodianName?.trim() || '';
      if (custodianEmployeeId) {
        const emp = (mockData.employees || []).find((e) => String(e._id) === String(custodianEmployeeId));
        if (emp && !resolvedCustodianName) {
          resolvedCustodianName =
            `${emp.firstName || emp.personalDetails?.firstName || ''} ${emp.lastName || emp.personalDetails?.lastName || ''}`.trim() ||
            emp.employeeCode;
        }
      }
      if (!resolvedCustodianName) {
        resolvedCustodianName = asset.custodian || 'Unassigned';
      }

      mockData.assetAssignments = mockData.assetAssignments || [];
      mockData.assetAssignments.forEach((h) => {
        if ((h.assetId === asset.assetId || String(h.assetRef) === String(asset._id)) && h.status === 'ACTIVE') {
          h.status = 'TRANSFERRED';
          h.returnedDate = effectiveAssignedDate.toISOString();
        }
      });

      const resolvedLoc = location?.trim() || resolvedProject?.location || asset.location || 'Head Office';
      const newHist = {
        _id: `ast-asg-${Date.now()}`,
        assetRef: asset._id || asset.assetId,
        assetId: asset.assetId,
        assignmentType,
        projectId: resolvedProject ? String(resolvedProject._id) : null,
        projectCode: resolvedProject ? resolvedProject.code : '',
        projectName: resolvedProject ? resolvedProject.name : '',
        department: department.trim(),
        location: resolvedLoc,
        custodianEmployeeId: custodianEmployeeId || null,
        custodianName: resolvedCustodianName,
        assignedDate: effectiveAssignedDate.toISOString(),
        expectedReturnDate: effectiveExpectedReturn ? effectiveExpectedReturn.toISOString() : null,
        conditionAtAssignment: conditionAtAssignment || asset.condition || 'Good',
        status: 'ACTIVE',
        notes: notes.trim(),
        assignedByEmail: actorEmail,
        createdAt: new Date().toISOString(),
      };
      mockData.assetAssignments.unshift(newHist);

      asset.currentAssignment = {
        assignmentType,
        projectId: resolvedProject ? String(resolvedProject._id) : null,
        projectCode: resolvedProject ? resolvedProject.code : '',
        projectName: resolvedProject ? resolvedProject.name : '',
        department: department.trim(),
        location: resolvedLoc,
        custodianEmployeeId: custodianEmployeeId || null,
        custodianName: resolvedCustodianName,
        assignedDate: effectiveAssignedDate.toISOString(),
        expectedReturnDate: effectiveExpectedReturn ? effectiveExpectedReturn.toISOString() : null,
        notes: notes.trim(),
      };
      asset.location = resolvedLoc;
      asset.custodian = resolvedCustodianName;
      if (resolvedProject) {
        asset.projectDonor = resolvedProject.code || resolvedProject.name;
      } else if (assignmentType === 'HEAD_OFFICE') {
        asset.projectDonor = 'Core';
      }

      saveFallbackData();
      saveStoreToDisk();

      return res.json({
        success: true,
        message: resolvedProject
          ? `Asset ${asset.assetId} assigned to project "${resolvedProject.name}".`
          : `Asset ${asset.assetId} assignment updated.`,
        data: { asset, assignment: newHist },
      });
    }

    const asset = await Asset.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { assetId: id }],
      isDeleted: { $ne: true },
    });

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset master record not found.' });
    }

    let resolvedProject = null;
    if (assignmentType === 'PROJECT') {
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ success: false, message: 'Invalid Project ID format.' });
      }
      resolvedProject = await RiskProject.findById(projectId).lean();
      if (!resolvedProject || resolvedProject.isDeleted) {
        return res.status(404).json({ success: false, message: 'Target project not found or has been archived.' });
      }
    }

    let resolvedCustodianId = null;
    let resolvedCustodianName = (custodianName || '').trim();
    if (custodianEmployeeId && mongoose.Types.ObjectId.isValid(custodianEmployeeId)) {
      const emp = await Employee.findById(custodianEmployeeId).select('employeeCode personalDetails').lean();
      if (emp) {
        resolvedCustodianId = emp._id;
        if (!resolvedCustodianName) {
          resolvedCustodianName =
            `${emp.personalDetails?.firstName || ''} ${emp.personalDetails?.lastName || ''}`.trim() ||
            emp.employeeCode;
        }
      }
    }
    if (!resolvedCustodianName) {
      resolvedCustodianName = asset.custodian || 'Unassigned';
    }

    const resolvedLocation =
      (location || '').trim() || resolvedProject?.location || asset.location || 'Head Office';

    // Close any prior active assignment record as TRANSFERRED
    await AssetAssignment.updateMany(
      { assetRef: asset._id, status: 'ACTIVE' },
      { $set: { status: 'TRANSFERRED', returnedDate: effectiveAssignedDate } }
    );

    const assignmentDoc = await AssetAssignment.create({
      assetRef: asset._id,
      assetId: asset.assetId,
      assignmentType,
      projectId: resolvedProject ? resolvedProject._id : null,
      projectCode: resolvedProject ? resolvedProject.code || '' : '',
      projectName: resolvedProject ? resolvedProject.name : '',
      department: (department || '').trim(),
      location: resolvedLocation,
      custodianEmployeeId: resolvedCustodianId,
      custodianName: resolvedCustodianName,
      assignedDate: effectiveAssignedDate,
      expectedReturnDate: effectiveExpectedReturn,
      conditionAtAssignment: conditionAtAssignment || asset.condition || 'Good',
      status: 'ACTIVE',
      notes: (notes || '').trim(),
      assignedBy: req.user?._id || null,
      assignedByEmail: actorEmail,
    });

    asset.currentAssignment = {
      assignmentType,
      projectId: resolvedProject ? resolvedProject._id : null,
      projectCode: resolvedProject ? resolvedProject.code || '' : '',
      projectName: resolvedProject ? resolvedProject.name : '',
      department: (department || '').trim(),
      location: resolvedLocation,
      custodianEmployeeId: resolvedCustodianId,
      custodianName: resolvedCustodianName,
      assignedDate: effectiveAssignedDate,
      expectedReturnDate: effectiveExpectedReturn,
      notes: (notes || '').trim(),
    };

    asset.location = resolvedLocation;
    asset.custodian = resolvedCustodianName;
    if (resolvedProject) {
      asset.projectDonor = resolvedProject.code || resolvedProject.name;
    } else if (assignmentType === 'HEAD_OFFICE') {
      asset.projectDonor = 'Core';
    }
    asset.qrText = `${asset.assetId}|Name:${asset.name}|Location:${asset.location}|Custodian:${asset.custodian}`;

    asset.auditTrail.push({
      action: resolvedProject ? 'PROJECT_ASSIGNED' : 'TRANSFERRED',
      performedBy: actorEmail,
      userEmail: actorEmail,
      timestamp: new Date(),
      details: resolvedProject
        ? `Assigned to project "${resolvedProject.name}" (${resolvedLocation}, Custodian: ${resolvedCustodianName})`
        : `Assigned to ${assignmentType} (${resolvedLocation}, Custodian: ${resolvedCustodianName})`,
    });

    await asset.save();

    try {
      await AuditLog.create({
        userId: req.user?._id,
        action: 'ASSIGN',
        module: 'ASSET_ASSIGNMENT',
        projectId: resolvedProject ? resolvedProject._id : null,
        resourceId: asset._id,
        newState: {
          assetId: asset.assetId,
          assignmentType,
          projectId: resolvedProject?._id || null,
          projectName: resolvedProject?.name || null,
          custodianName: resolvedCustodianName,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (_) {}

    return res.json({
      success: true,
      message: resolvedProject
        ? `Asset ${asset.assetId} allocated to "${resolvedProject.name}" successfully.`
        : `Asset ${asset.assetId} allocation updated successfully.`,
      data: {
        asset,
        assignment: assignmentDoc,
      },
    });
  } catch (error) {
    console.error('[assignAsset Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/assets/:id/unassign
 * Safely release/return an asset from its current project/custodian allocation without deleting its master record.
 */
export const unassignAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { conditionAtReturn = '', returnLocation = 'Head Office', notes = '' } = req.body || {};
    const actorEmail = req.user?.email || 'hr.admin@cbdp.org';

    if (!isDbActive()) {
      loadStoreFromDisk();
      const fb = getFallbackData();
      const asset = (fb.assets || []).find(
        (a) => (String(a._id) === String(id) || a.assetId === id) && !a.isDeleted
      );
      if (!asset) {
        return res.status(404).json({ success: false, message: 'Asset master record not found.' });
      }
      (mockData.assetAssignments || []).forEach((h) => {
        if ((h.assetId === asset.assetId || String(h.assetRef) === String(asset._id)) && h.status === 'ACTIVE') {
          h.status = 'RETURNED';
          h.returnedDate = new Date().toISOString();
          if (conditionAtReturn) h.conditionAtReturn = conditionAtReturn;
        }
      });
      asset.currentAssignment = {
        assignmentType: 'HEAD_OFFICE',
        projectId: null,
        projectCode: '',
        projectName: '',
        department: '',
        location: returnLocation || 'Head Office',
        custodianEmployeeId: null,
        custodianName: 'Unassigned',
        assignedDate: null,
        expectedReturnDate: null,
        notes: notes || '',
      };
      asset.location = returnLocation || 'Head Office';
      asset.custodian = 'Unassigned';
      asset.projectDonor = 'Core';
      saveFallbackData();
      saveStoreToDisk();

      return res.json({
        success: true,
        message: `Asset ${asset.assetId} returned to Head Office inventory. Master record preserved.`,
        data: asset,
      });
    }

    const asset = await Asset.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { assetId: id }],
      isDeleted: { $ne: true },
    });

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset master record not found.' });
    }

    const prevProjectId = asset.currentAssignment?.projectId || null;

    await AssetAssignment.updateMany(
      { assetRef: asset._id, status: 'ACTIVE' },
      {
        $set: {
          status: 'RETURNED',
          returnedDate: new Date(),
          returnedBy: req.user?._id || null,
          ...(conditionAtReturn ? { conditionAtReturn } : {}),
        },
      }
    );

    asset.currentAssignment = {
      assignmentType: 'HEAD_OFFICE',
      projectId: null,
      projectCode: '',
      projectName: '',
      department: '',
      location: returnLocation || 'Head Office',
      custodianEmployeeId: null,
      custodianName: 'Unassigned',
      assignedDate: null,
      expectedReturnDate: null,
      notes: notes || '',
    };
    asset.location = returnLocation || 'Head Office';
    asset.custodian = 'Unassigned';
    asset.projectDonor = 'Core';
    if (conditionAtReturn) {
      asset.condition = conditionAtReturn;
    }
    asset.qrText = `${asset.assetId}|Name:${asset.name}|Location:${asset.location}|Custodian:${asset.custodian}`;

    asset.auditTrail.push({
      action: 'PROJECT_RETURNED',
      performedBy: actorEmail,
      userEmail: actorEmail,
      timestamp: new Date(),
      details: `Asset returned from project/custodian allocation to ${asset.location}. ${notes || ''}`.trim(),
    });

    await asset.save();

    try {
      await AuditLog.create({
        userId: req.user?._id,
        action: 'UNASSIGN',
        module: 'ASSET_ASSIGNMENT',
        projectId: prevProjectId,
        resourceId: asset._id,
        newState: { assetId: asset.assetId, assignmentType: 'HEAD_OFFICE' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (_) {}

    return res.json({
      success: true,
      message: `Asset ${asset.assetId} returned to Head Office inventory. Master record preserved.`,
      data: asset,
    });
  } catch (error) {
    console.error('[unassignAsset Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/projects/:id/assets
 * List assets currently allocated to a specific project.
 */
export const getProjectAssignedAssets = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isDbActive()) {
      loadStoreFromDisk();
      const project = (mockData.riskProjects || []).find((p) => String(p._id) === String(id) && !p.isDeleted);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found.' });
      }
      const fb = getFallbackData();
      const list = (fb.assets || []).filter(
        (a) => !a.isDeleted && String(a.currentAssignment?.projectId || '') === String(id)
      );
      return res.json({ success: true, count: list.length, data: list });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Project ID format.' });
    }

    const project = await RiskProject.findById(id).lean();
    if (!project || project.isDeleted) {
      return res.status(404).json({ success: false, message: 'Project not found or has been archived.' });
    }

    const assets = await Asset.find({
      isDeleted: { $ne: true },
      'currentAssignment.projectId': project._id,
    })
      .sort({ assetId: 1 })
      .lean();

    return res.json({
      success: true,
      count: assets.length,
      data: assets,
    });
  } catch (error) {
    console.error('[getProjectAssignedAssets Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

