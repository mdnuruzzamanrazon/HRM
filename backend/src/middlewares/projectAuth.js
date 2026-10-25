import mongoose from 'mongoose';
import { RiskProject } from '../models/RiskProject.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';

/**
 * Middleware to verify user has permission to access a requested project.
 * @param {string} requiredModule Optional module name ('RISK', 'COMPLAINTS', 'EVENTS', 'BENEFICIARIES')
 * @param {string} requiredRole Optional minimum role ('VIEWER', 'EDITOR', 'MANAGER', 'ADMIN')
 */
export const checkProjectAccess = (requiredModule = null, requiredRole = 'VIEWER') => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      // SUPER_ADMIN and HR_ADMIN have unconditional system-wide access to all projects
      if (['SUPER_ADMIN', 'HR_ADMIN'].includes(user.role)) {
        return next();
      }

      // Extract projectId from params, query, body, or header
      const projectId = 
        req.params.projectId || 
        req.params.id || 
        req.query.projectId || 
        req.body.projectId || 
        req.headers['x-project-id'];

      // If no specific project ID is being accessed (e.g. general list), proceed
      if (!projectId || projectId === 'ALL') {
        return next();
      }

      // Demo mode fallback
      if (isDemoMode() || mongoose.connection.readyState !== 1) {
        const project = (mockData.riskProjects || []).find(p => String(p._id) === String(projectId));
        if (!project) {
          return res.status(404).json({ success: false, message: 'Project not found' });
        }
        return next();
      }

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ success: false, message: 'Invalid Project ID format' });
      }

      const project = await RiskProject.findById(projectId);
      if (!project || project.isDeleted) {
        return res.status(404).json({ success: false, message: 'Project not found or has been archived' });
      }

      // Check assignedUsers if present
      if (project.assignedUsers && project.assignedUsers.length > 0) {
        const userIdStr = String(user._id);
        const userEmail = (user.email || '').toLowerCase();

        const assignment = project.assignedUsers.find(
          a => (a.user && String(a.user) === userIdStr) || (a.userEmail && a.userEmail.toLowerCase() === userEmail)
        );

        if (!assignment) {
          return res.status(403).json({
            success: false,
            message: 'You are not assigned to this project. Contact your HR Administrator.'
          });
        }

        // Check module permission if specified
        if (requiredModule && assignment.modules && assignment.modules.length > 0) {
          if (!assignment.modules.includes(requiredModule)) {
            return res.status(403).json({
              success: false,
              message: `You do not have access to the ${requiredModule} module for this project.`
            });
          }
        }

        // Check role hierarchy if required
        const roleWeights = { VIEWER: 1, EDITOR: 2, MANAGER: 3, ADMIN: 4 };
        const requiredWeight = roleWeights[requiredRole] || 1;
        const userWeight = roleWeights[assignment.role] || 1;

        if (userWeight < requiredWeight) {
          return res.status(403).json({
            success: false,
            message: `Insufficient project permissions. Requires ${requiredRole} access.`
          });
        }
      }

      // Attach project to request
      req.project = project;
      next();
    } catch (error) {
      console.error('[checkProjectAccess Error]:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying project access permissions',
        error: error.message
      });
    }
  };
};

/**
 * Helper to verify that a resource belongs to the requested project.
 */
export const verifyRecordProjectBelonging = async (Model, recordId, projectId) => {
  if (isDemoMode() || mongoose.connection.readyState !== 1) {
    return true;
  }
  const record = await Model.findById(recordId);
  if (!record) return null; // Record not found
  if (String(record.projectId) !== String(projectId)) {
    return false; // Mismatched project
  }
  return record;
};
