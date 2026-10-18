import { AuditLog } from '../models/AuditLog.js';
import mongoose from 'mongoose';

/**
 * Helper to record an administrative audit log entry
 * @param {Object} params
 * @param {string} params.userId - The ID of the admin/user performing the action
 * @param {string} params.action - 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT'
 * @param {string} params.module - e.g. 'EMPLOYEE', 'ATTENDANCE', 'LEAVE', 'PAYROLL', 'EXPENSE', 'SECURITY'
 * @param {string} [params.resourceId] - The ID of the affected resource
 * @param {Object} [params.previousState] - Previous state before modification
 * @param {Object} [params.newState] - State after modification
 * @param {Object} [params.req] - Express request object for IP and UserAgent
 */
export const logAudit = async ({
  userId,
  action,
  module,
  resourceId,
  previousState,
  newState,
  req
}) => {
  try {
    if (mongoose.connection.readyState !== 1) return;

    const logEntry = new AuditLog({
      userId: userId || req?.user?._id,
      action: action || 'UPDATE',
      module: module || 'GENERAL',
      resourceId: resourceId ? (mongoose.Types.ObjectId.isValid(resourceId) ? resourceId : undefined) : undefined,
      previousState: previousState ? JSON.parse(JSON.stringify(previousState)) : undefined,
      newState: newState ? JSON.parse(JSON.stringify(newState)) : undefined,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1',
      userAgent: req?.headers?.['user-agent'] || 'HRM Platform'
    });

    await logEntry.save();
  } catch (err) {
    console.error('[AuditLog Error]:', err.message);
  }
};
