import mongoose from 'mongoose';
import { Employee } from '../models/Employee.js';
import { RiskProject } from '../models/RiskProject.js';
import { EmployeeProjectAssignment } from '../models/EmployeeProjectAssignment.js';
import { AuditLog } from '../models/AuditLog.js';
import { isDemoMode } from '../config/db.js';
import { mockData, saveStoreToDisk, loadStoreFromDisk } from '../services/mockDataService.js';

/**
 * Helper to fetch enriched active project assignments map by employeeId string
 */
export const buildEmployeeAssignmentsMap = async (employeeIds = [], includeHistory = false) => {
  const map = {};
  if (isDemoMode() || mongoose.connection.readyState !== 1) {
    const projectsMap = {};
    (mockData.riskProjects || []).forEach((p) => {
      projectsMap[String(p._id)] = p;
    });
    (mockData.employeeProjectAssignments || []).forEach((a) => {
      if (!includeHistory && a.status !== 'ACTIVE') return;
      const empKey = String(a.employeeId);
      if (employeeIds.length > 0 && !employeeIds.some((id) => String(id) === empKey)) return;
      const prj = projectsMap[String(a.projectId)];
      if (!map[empKey]) map[empKey] = [];
      map[empKey].push({
        ...a,
        projectName: prj?.name || a.projectName || 'Unknown Project',
        projectCode: prj?.code || a.projectCode || '',
        projectStatus: prj?.status || 'ACTIVE',
      });
    });
    return map;
  }

  const filter = {};
  if (employeeIds.length > 0) {
    filter.employeeId = { $in: employeeIds };
  }
  if (!includeHistory) {
    filter.status = 'ACTIVE';
  }

  const assignments = await EmployeeProjectAssignment.find(filter)
    .populate('projectId', 'name code status location period isDeleted')
    .sort({ status: 1, startDate: -1 })
    .lean();

  assignments.forEach((a) => {
    const prj = a.projectId;
    if (prj && prj.isDeleted && !includeHistory) return;
    const empKey = String(a.employeeId);
    if (!map[empKey]) map[empKey] = [];
    map[empKey].push({
      ...a,
      projectId: prj?._id || a.projectId,
      projectName: prj?.name || 'Archived Project',
      projectCode: prj?.code || '',
      projectStatus: prj?.status || 'ARCHIVED',
    });
  });

  return map;
};

/**
 * GET /api/v1/employees/:id/projects
 * List active and historical project assignments for an employee.
 */
export const getEmployeeProjectAssignments = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      loadStoreFromDisk();
      const emp = (mockData.employees || []).find((e) => String(e._id) === String(id) && !e.isDeleted);
      if (!emp) {
        return res.status(404).json({ success: false, message: 'Employee master record not found.' });
      }
      const map = await buildEmployeeAssignmentsMap([id], true);
      const all = map[String(id)] || [];
      return res.json({
        success: true,
        data: {
          activeAssignments: all.filter((a) => a.status === 'ACTIVE'),
          history: all,
        },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Employee ID format.' });
    }

    const emp = await Employee.findById(id).select('_id employeeCode personalDetails jobDetails isDeleted').lean();
    if (!emp || emp.isDeleted) {
      return res.status(404).json({ success: false, message: 'Employee master record not found.' });
    }

    const map = await buildEmployeeAssignmentsMap([emp._id], true);
    const all = map[String(emp._id)] || [];

    return res.json({
      success: true,
      data: {
        activeAssignments: all.filter((a) => a.status === 'ACTIVE'),
        history: all,
      },
    });
  } catch (error) {
    console.error('[getEmployeeProjectAssignments Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/employees/:id/projects
 * Assign an existing Core HR employee to a project (or reassign from an existing active assignment).
 */
export const assignEmployeeToProject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      projectId,
      roleInProject = 'Project Staff',
      allocationPercentage = 100,
      startDate,
      endDate = null,
      isPrimary = false,
      notes = '',
      reassignFromAssignmentId = null,
    } = req.body;

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Target Project ID is required.' });
    }

    const parsedAlloc = Number(allocationPercentage);
    if (isNaN(parsedAlloc) || parsedAlloc < 1 || parsedAlloc > 100) {
      return res.status(400).json({ success: false, message: 'Allocation percentage must be between 1 and 100.' });
    }

    const effectiveStart = startDate ? new Date(startDate) : new Date();
    const effectiveEnd = endDate ? new Date(endDate) : null;
    if (effectiveEnd && effectiveEnd < effectiveStart) {
      return res.status(400).json({ success: false, message: 'Assignment end date cannot precede start date.' });
    }

    const actorEmail = req.user?.email || 'hr.admin@cbdp.org';
    const actorRole = req.user?.role || 'HR_ADMIN';

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      loadStoreFromDisk();
      const emp = (mockData.employees || []).find((e) => String(e._id) === String(id) && !e.isDeleted);
      if (!emp) {
        return res.status(404).json({ success: false, message: 'Employee master record not found.' });
      }
      const project = (mockData.riskProjects || []).find((p) => String(p._id) === String(projectId) && !p.isDeleted);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Target project not found or archived.' });
      }

      mockData.employeeProjectAssignments = mockData.employeeProjectAssignments || [];

      const duplicate = mockData.employeeProjectAssignments.find(
        (a) =>
          String(a.employeeId) === String(id) &&
          String(a.projectId) === String(projectId) &&
          a.status === 'ACTIVE' &&
          String(a._id) !== String(reassignFromAssignmentId || '')
      );
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Employee is already actively assigned to project "${project.name}".`,
        });
      }

      let previousProjectId = null;
      if (reassignFromAssignmentId) {
        const oldAsg = mockData.employeeProjectAssignments.find(
          (a) => String(a._id) === String(reassignFromAssignmentId) && String(a.employeeId) === String(id)
        );
        if (oldAsg && oldAsg.status === 'ACTIVE') {
          previousProjectId = oldAsg.projectId;
          oldAsg.status = 'REASSIGNED';
          oldAsg.endDate = effectiveStart.toISOString();
          oldAsg.reassignedToProjectId = String(project._id);
          oldAsg.updatedAt = new Date().toISOString();
        }
      }

      const newAsg = {
        _id: `emp-prj-${Date.now()}`,
        employeeId: String(id),
        projectId: String(project._id),
        projectName: project.name,
        projectCode: project.code,
        roleInProject: roleInProject.trim() || 'Project Staff',
        allocationPercentage: parsedAlloc,
        startDate: effectiveStart.toISOString(),
        endDate: effectiveEnd ? effectiveEnd.toISOString() : null,
        status: 'ACTIVE',
        isPrimary: Boolean(isPrimary),
        notes: notes.trim(),
        reassignedFromProjectId: previousProjectId,
        auditTrail: [
          {
            action: previousProjectId ? 'REASSIGNED' : 'ASSIGNED',
            performedBy: actorEmail,
            userEmail: actorEmail,
            role: actorRole,
            timestamp: new Date().toISOString(),
            details: `Assigned to project "${project.name}" as ${roleInProject}`,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockData.employeeProjectAssignments.unshift(newAsg);
      saveStoreToDisk();

      return res.status(201).json({
        success: true,
        message: `Employee assigned to "${project.name}" successfully.`,
        data: newAsg,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid Employee ID or Project ID format.' });
    }

    const [employee, project] = await Promise.all([
      Employee.findById(id).lean(),
      RiskProject.findById(projectId).lean(),
    ]);

    if (!employee || employee.isDeleted) {
      return res.status(404).json({ success: false, message: 'Employee master record not found.' });
    }
    if (!project || project.isDeleted) {
      return res.status(404).json({ success: false, message: 'Target project not found or has been archived.' });
    }

    // Prevent duplicate ACTIVE assignment on the same project
    const dupQuery = {
      employeeId: employee._id,
      projectId: project._id,
      status: 'ACTIVE',
    };
    if (reassignFromAssignmentId && mongoose.Types.ObjectId.isValid(reassignFromAssignmentId)) {
      dupQuery._id = { $ne: new mongoose.Types.ObjectId(reassignFromAssignmentId) };
    }
    const existingActive = await EmployeeProjectAssignment.findOne(dupQuery).lean();
    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: `Employee already has an active assignment to "${project.name}".`,
      });
    }

    let previousProjectId = null;
    if (reassignFromAssignmentId && mongoose.Types.ObjectId.isValid(reassignFromAssignmentId)) {
      const prior = await EmployeeProjectAssignment.findOne({
        _id: reassignFromAssignmentId,
        employeeId: employee._id,
      });
      if (prior && prior.status === 'ACTIVE') {
        previousProjectId = prior.projectId;
        prior.status = 'REASSIGNED';
        prior.endDate = effectiveStart;
        prior.reassignedToProjectId = project._id;
        prior.auditTrail.push({
          action: 'REASSIGNED',
          performedBy: actorEmail,
          userEmail: actorEmail,
          role: actorRole,
          timestamp: new Date(),
          details: `Reassigned to project "${project.name}"`,
        });
        await prior.save();
      }
    }

    if (isPrimary) {
      await EmployeeProjectAssignment.updateMany(
        { employeeId: employee._id, status: 'ACTIVE', isPrimary: true },
        { $set: { isPrimary: false } }
      );
    }

    const created = await EmployeeProjectAssignment.create({
      employeeId: employee._id,
      projectId: project._id,
      roleInProject: (roleInProject || 'Project Staff').trim(),
      allocationPercentage: parsedAlloc,
      startDate: effectiveStart,
      endDate: effectiveEnd,
      status: 'ACTIVE',
      isPrimary: Boolean(isPrimary),
      notes: (notes || '').trim(),
      reassignedFromProjectId: previousProjectId,
      assignedBy: req.user?._id || null,
      auditTrail: [
        {
          action: previousProjectId ? 'REASSIGNED' : 'ASSIGNED',
          performedBy: actorEmail,
          userEmail: actorEmail,
          role: actorRole,
          timestamp: new Date(),
          details: previousProjectId
            ? `Reassigned to "${project.name}" as ${roleInProject} (${parsedAlloc}%)`
            : `Assigned to "${project.name}" as ${roleInProject} (${parsedAlloc}%)`,
        },
      ],
    });

    try {
      await AuditLog.create({
        userId: req.user?._id,
        action: previousProjectId ? 'REASSIGN' : 'ASSIGN',
        module: 'EMPLOYEE_PROJECT_ASSIGNMENT',
        projectId: project._id,
        resourceId: created._id,
        newState: {
          employeeId: employee._id,
          employeeCode: employee.employeeCode,
          projectId: project._id,
          projectName: project.name,
          roleInProject: created.roleInProject,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (_) {}

    return res.status(201).json({
      success: true,
      message: previousProjectId
        ? `Employee reassigned to "${project.name}" successfully.`
        : `Employee assigned to "${project.name}" successfully.`,
      data: {
        ...created.toObject(),
        projectName: project.name,
        projectCode: project.code,
        projectStatus: project.status,
      },
    });
  } catch (error) {
    console.error('[assignEmployeeToProject Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/v1/employees/:id/projects/:assignmentId
 * Update assignment metadata or status without altering the Core HR employee record.
 */
export const updateEmployeeProjectAssignment = async (req, res) => {
  try {
    const { id, assignmentId } = req.params;
    const { roleInProject, allocationPercentage, startDate, endDate, status, isPrimary, notes } = req.body;
    const actorEmail = req.user?.email || 'hr.admin@cbdp.org';
    const actorRole = req.user?.role || 'HR_ADMIN';

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      loadStoreFromDisk();
      const asg = (mockData.employeeProjectAssignments || []).find(
        (a) => String(a._id) === String(assignmentId) && String(a.employeeId) === String(id)
      );
      if (!asg) {
        return res.status(404).json({ success: false, message: 'Project assignment not found.' });
      }
      if (roleInProject !== undefined) asg.roleInProject = roleInProject.trim();
      if (allocationPercentage !== undefined) asg.allocationPercentage = Number(allocationPercentage);
      if (startDate !== undefined) asg.startDate = new Date(startDate).toISOString();
      if (endDate !== undefined) asg.endDate = endDate ? new Date(endDate).toISOString() : null;
      if (status !== undefined) asg.status = status;
      if (isPrimary !== undefined) asg.isPrimary = Boolean(isPrimary);
      if (notes !== undefined) asg.notes = notes;
      asg.updatedAt = new Date().toISOString();
      saveStoreToDisk();
      return res.json({ success: true, message: 'Project assignment updated.', data: asg });
    }

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid Assignment ID.' });
    }

    const assignment = await EmployeeProjectAssignment.findOne({ _id: assignmentId, employeeId: id });
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Project assignment not found.' });
    }

    if (roleInProject !== undefined) assignment.roleInProject = roleInProject.trim();
    if (allocationPercentage !== undefined) {
      const alloc = Number(allocationPercentage);
      if (isNaN(alloc) || alloc < 1 || alloc > 100) {
        return res.status(400).json({ success: false, message: 'Allocation percentage must be 1–100.' });
      }
      assignment.allocationPercentage = alloc;
    }
    if (startDate !== undefined && startDate) assignment.startDate = new Date(startDate);
    if (endDate !== undefined) assignment.endDate = endDate ? new Date(endDate) : null;
    if (status !== undefined) assignment.status = status;
    if (isPrimary !== undefined) assignment.isPrimary = Boolean(isPrimary);
    if (notes !== undefined) assignment.notes = notes;

    assignment.auditTrail.push({
      action: status === 'COMPLETED' ? 'COMPLETED' : 'UPDATED',
      performedBy: actorEmail,
      userEmail: actorEmail,
      role: actorRole,
      timestamp: new Date(),
      details: `Assignment updated (role: ${assignment.roleInProject}, status: ${assignment.status})`,
    });

    await assignment.save();
    const populated = await EmployeeProjectAssignment.findById(assignment._id)
      .populate('projectId', 'name code status')
      .lean();

    return res.json({
      success: true,
      message: 'Project assignment updated successfully.',
      data: {
        ...populated,
        projectId: populated.projectId?._id || populated.projectId,
        projectName: populated.projectId?.name || '',
        projectCode: populated.projectId?.code || '',
      },
    });
  } catch (error) {
    console.error('[updateEmployeeProjectAssignment Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/v1/employees/:id/projects/:assignmentId
 * Safely remove an employee from a project assignment WITHOUT deleting the Employee master HR record.
 */
export const removeEmployeeProjectAssignment = async (req, res) => {
  try {
    const { id, assignmentId } = req.params;
    const actorEmail = req.user?.email || 'hr.admin@cbdp.org';
    const actorRole = req.user?.role || 'HR_ADMIN';

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      loadStoreFromDisk();
      const asg = (mockData.employeeProjectAssignments || []).find(
        (a) => String(a._id) === String(assignmentId) && String(a.employeeId) === String(id)
      );
      if (!asg) {
        return res.status(404).json({ success: false, message: 'Project assignment not found.' });
      }
      asg.status = 'REMOVED';
      asg.endDate = asg.endDate || new Date().toISOString();
      asg.removedAt = new Date().toISOString();
      asg.updatedAt = new Date().toISOString();
      saveStoreToDisk();
      return res.json({
        success: true,
        message: 'Employee removed from project assignment. Core HR employee record preserved.',
        data: asg,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid Assignment ID.' });
    }

    const assignment = await EmployeeProjectAssignment.findOne({ _id: assignmentId, employeeId: id });
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Project assignment not found.' });
    }

    assignment.status = 'REMOVED';
    assignment.endDate = assignment.endDate || new Date();
    assignment.removedAt = new Date();
    assignment.removedBy = req.user?._id || null;
    assignment.auditTrail.push({
      action: 'REMOVED',
      performedBy: actorEmail,
      userEmail: actorEmail,
      role: actorRole,
      timestamp: new Date(),
      details: 'Removed from project assignment; Core HR record retained intact.',
    });

    await assignment.save();

    try {
      await AuditLog.create({
        userId: req.user?._id,
        action: 'UNASSIGN',
        module: 'EMPLOYEE_PROJECT_ASSIGNMENT',
        projectId: assignment.projectId,
        resourceId: assignment._id,
        previousState: { status: 'ACTIVE' },
        newState: { status: 'REMOVED', employeeId: assignment.employeeId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (_) {}

    return res.json({
      success: true,
      message: 'Employee removed from project assignment. Core HR employee record preserved.',
      data: assignment,
    });
  } catch (error) {
    console.error('[removeEmployeeProjectAssignment Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/projects/:id/employees
 * List employees assigned to a specific project.
 */
export const getProjectAssignedEmployees = async (req, res) => {
  try {
    const { id } = req.params;
    const includeHistory = req.query.includeHistory === 'true';

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      loadStoreFromDisk();
      const project = (mockData.riskProjects || []).find((p) => String(p._id) === String(id) && !p.isDeleted);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found.' });
      }
      const empMap = {};
      (mockData.employees || []).forEach((e) => {
        if (!e.isDeleted) empMap[String(e._id)] = e;
      });
      const list = (mockData.employeeProjectAssignments || [])
        .filter((a) => String(a.projectId) === String(id) && (includeHistory || a.status === 'ACTIVE'))
        .map((a) => {
          const emp = empMap[String(a.employeeId)];
          if (!emp) return null;
          return {
            ...a,
            employee: {
              _id: emp._id,
              employeeCode: emp.employeeCode,
              firstName: emp.firstName || emp.personalDetails?.firstName || '',
              lastName: emp.lastName || emp.personalDetails?.lastName || '',
              email: emp.email || emp.personalDetails?.email || '',
              title: emp.title || emp.jobDetails?.title || '',
              department: emp.department || emp.jobDetails?.department || '',
              status: emp.status || emp.jobDetails?.status || 'ACTIVE',
            },
          };
        })
        .filter(Boolean);

      return res.json({ success: true, count: list.length, data: list });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Project ID format.' });
    }

    const project = await RiskProject.findById(id).lean();
    if (!project || project.isDeleted) {
      return res.status(404).json({ success: false, message: 'Project not found or has been archived.' });
    }

    const filter = { projectId: project._id };
    if (!includeHistory) {
      filter.status = 'ACTIVE';
    }

    const assignments = await EmployeeProjectAssignment.find(filter)
      .populate('employeeId', 'employeeCode personalDetails jobDetails email workEmail isDeleted')
      .sort({ status: 1, startDate: -1 })
      .lean();

    const formatted = assignments
      .filter((a) => a.employeeId && !a.employeeId.isDeleted)
      .map((a) => {
        const emp = a.employeeId;
        return {
          _id: a._id,
          employeeId: emp._id,
          projectId: a.projectId,
          roleInProject: a.roleInProject,
          allocationPercentage: a.allocationPercentage,
          startDate: a.startDate,
          endDate: a.endDate,
          status: a.status,
          isPrimary: a.isPrimary,
          notes: a.notes,
          createdAt: a.createdAt,
          employee: {
            _id: emp._id,
            employeeCode: emp.employeeCode,
            firstName: emp.personalDetails?.firstName || '',
            lastName: emp.personalDetails?.lastName || '',
            email: emp.email || emp.workEmail || emp.personalDetails?.email || '',
            title: emp.jobDetails?.title || '',
            department: emp.jobDetails?.department || '',
            status: emp.jobDetails?.status || 'ACTIVE',
          },
        };
      });

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error('[getProjectAssignedEmployees Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

