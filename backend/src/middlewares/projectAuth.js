import mongoose from 'mongoose';
import { RiskProject } from '../models/RiskProject.js';
import { AuditLog } from '../models/AuditLog.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';

const ROLE_WEIGHTS = { VIEWER: 1, EDITOR: 2, MANAGER: 3, ADMIN: 4 };

/**
 * Resolve a project by ID from either MongoDB or Demo store.
 */
export const resolveProjectById = async (projectId) => {
  if (!projectId || projectId === 'ALL' || projectId === 'null' || projectId === 'undefined') {
    return { project: null, invalidFormat: false };
  }

  if (isDemoMode() || mongoose.connection.readyState !== 1) {
    const project = (mockData.riskProjects || []).find(
      (p) => String(p._id) === String(projectId) && !p.isDeleted
    );
    return { project: project || null, invalidFormat: false };
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return { project: null, invalidFormat: true };
  }

  const project = await RiskProject.findById(projectId).lean();
  if (!project || project.isDeleted) {
    return { project: null, invalidFormat: false };
  }
  return { project, invalidFormat: false };
};

/**
 * Evaluate whether an authenticated user has permission for a project, module, and minimum project role.
 */
export const evaluateUserProjectPermission = (project, user, requiredModule = null, requiredRole = 'VIEWER') => {
  if (!user) {
    return { allowed: false, status: 401, message: 'Authentication required.' };
  }
  if (!project || project.isDeleted) {
    return { allowed: false, status: 404, message: 'Project not found or has been archived.' };
  }

  // SUPER_ADMIN and HR_ADMIN hold organization-wide project governance authority
  if (['SUPER_ADMIN', 'HR_ADMIN'].includes(user.role)) {
    return { allowed: true, projectRole: 'ADMIN' };
  }

  const assignedList = Array.isArray(project.assignedUsers) ? project.assignedUsers : [];
  const userIdStr = String(user._id);
  const userEmail = String(user.email || '').toLowerCase().trim();

  const assignment = assignedList.find(
    (a) =>
      (a.user && String(a.user._id || a.user) === userIdStr) ||
      (a.userEmail && String(a.userEmail).toLowerCase().trim() === userEmail)
  );

  // Standard employees always require explicit project assignment.
  // Operational managers require explicit assignment when the project has assignedUsers or restrictAccess enabled.
  const requiresExplicitAssignment =
    user.role === 'EMPLOYEE' ||
    Boolean(project.restrictAccess) ||
    assignedList.length > 0;

  if (!assignment) {
    if (requiresExplicitAssignment) {
      return {
        allowed: false,
        status: 403,
        message: 'Access denied: you are not authorized to access this project.',
      };
    }
    // Open managerial access on unrestricted projects with no explicit roster yet
    return { allowed: true, projectRole: 'MANAGER' };
  }

  if (requiredModule && Array.isArray(assignment.modules)) {
    if (!assignment.modules.includes(requiredModule)) {
      return {
        allowed: false,
        status: 403,
        message: `Access denied: you do not have permission for the ${requiredModule} module in project "${project.name}".`,
      };
    }
  }

  const requiredWeight = ROLE_WEIGHTS[requiredRole] || 1;
  const userWeight = ROLE_WEIGHTS[assignment.role] || 1;
  if (userWeight < requiredWeight) {
    return {
      allowed: false,
      status: 403,
      message: `Insufficient project permissions. Requires ${requiredRole} access on project "${project.name}".`,
    };
  }

  return { allowed: true, projectRole: assignment.role };
};

const logAccessDenied = async (req, moduleName, projectId, reason) => {
  try {
    if (!isDemoMode() && mongoose.connection.readyState === 1) {
      await AuditLog.create({
        userId: req.user?._id && mongoose.Types.ObjectId.isValid(req.user._id) ? req.user._id : undefined,
        action: 'ACCESS_DENIED',
        module: moduleName || 'PROJECT_CONTEXT',
        projectId: projectId && mongoose.Types.ObjectId.isValid(projectId) ? projectId : null,
        newState: { path: req.originalUrl, method: req.method, reason },
        ipAddress: req.ip,
        userAgent: req.headers?.['user-agent'] || '',
      });
    }
  } catch (_) {
    // Non-blocking audit log
  }
};

/**
 * Extract requested projectId from request without confusing resource `:id` params for project IDs.
 */
export const extractRequestedProjectId = (req, { fromParamId = false } = {}) => {
  const candidates = [
    req.params?.projectId,
    fromParamId ? req.params?.id : undefined,
    req.query?.projectId,
    req.body?.projectId,
    req.headers?.['x-project-id'],
  ];

  for (const raw of candidates) {
    if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
      return String(raw).trim();
    }
  }
  return null;
};

/**
 * Middleware to verify user has permission to access a requested project.
 * @param {string|null} requiredModule ('RISK', 'COMPLAINTS', 'EVENTS', 'BENEFICIARIES')
 * @param {string} requiredRole ('VIEWER', 'EDITOR', 'MANAGER', 'ADMIN')
 * @param {object} options { requireProject: boolean, fromParamId: boolean }
 */
export const checkProjectAccess = (
  requiredModule = null,
  requiredRole = 'VIEWER',
  options = { requireProject: false, fromParamId: false }
) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      const projectId = extractRequestedProjectId(req, options);

      if (!projectId || projectId.toUpperCase() === 'ALL' || projectId === 'null' || projectId === 'undefined') {
        if (options?.requireProject) {
          return res.status(400).json({
            success: false,
            message: 'An active Project ID is required for this project-linked module.',
          });
        }
        return next();
      }

      const { project, invalidFormat } = await resolveProjectById(projectId);
      if (invalidFormat) {
        return res.status(400).json({ success: false, message: 'Invalid Project ID format.' });
      }
      if (!project) {
        return res.status(404).json({ success: false, message: 'Selected project not found or has been archived.' });
      }

      const perm = evaluateUserProjectPermission(project, user, requiredModule, requiredRole);
      if (!perm.allowed) {
        await logAccessDenied(req, requiredModule, project._id, perm.message);
        return res.status(perm.status).json({
          success: false,
          message: perm.message,
        });
      }

      req.project = project;
      req.activeProjectId = String(project._id);
      next();
    } catch (error) {
      console.error('[checkProjectAccess Error]:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying project access permissions',
        error: error.message,
      });
    }
  };
};

/**
 * Verify single-record ownership & user authorization for a record in one of the 4 project-linked modules.
 * Rejects cross-project access or tampering if a different projectId was supplied in query, header, or body.
 */
export const authorizeRecordProjectAccess = async (
  req,
  recordProjectId,
  requiredModule,
  requiredRole = 'VIEWER'
) => {
  const user = req.user;
  if (!user) {
    return { allowed: false, status: 401, message: 'Authentication required.' };
  }

  // Unlinked legacy record flagged for admin review
  if (!recordProjectId) {
    if (['SUPER_ADMIN', 'HR_ADMIN'].includes(user.role)) {
      return { allowed: true, project: null };
    }
    return {
      allowed: false,
      status: 403,
      message: 'This record is pending administrative project review.',
    };
  }

  const requestedProjectId =
    req.query?.projectId ||
    req.body?.projectId ||
    req.headers?.['x-project-id'] ||
    null;

  if (
    requestedProjectId &&
    requestedProjectId !== 'ALL' &&
    requestedProjectId !== 'null' &&
    requestedProjectId !== 'undefined' &&
    String(requestedProjectId) !== String(recordProjectId)
  ) {
    await logAccessDenied(
      req,
      requiredModule,
      requestedProjectId,
      `Cross-project access attempt on record owned by project ${recordProjectId}`
    );
    return {
      allowed: false,
      status: 403,
      message: 'Cross-project access denied: this record belongs to a different project.',
    };
  }

  const { project, invalidFormat } = await resolveProjectById(recordProjectId);
  if (invalidFormat || !project) {
    return {
      allowed: false,
      status: 404,
      message: 'Associated project not found or has been archived.',
    };
  }

  const perm = evaluateUserProjectPermission(project, user, requiredModule, requiredRole);
  if (!perm.allowed) {
    await logAccessDenied(req, requiredModule, project._id, perm.message);
    return {
      allowed: false,
      status: perm.status,
      message: perm.message,
    };
  }

  req.project = project;
  req.activeProjectId = String(project._id);
  return { allowed: true, project };
};

/**
 * Helper to verify that a resource belongs to the requested project.
 */
export const verifyRecordProjectBelonging = async (Model, recordId, projectId) => {
  if (isDemoMode() || mongoose.connection.readyState !== 1) {
    return true;
  }
  const record = await Model.findById(recordId);
  if (!record) return null;
  if (String(record.projectId) !== String(projectId)) {
    return false;
  }
  return record;
};
