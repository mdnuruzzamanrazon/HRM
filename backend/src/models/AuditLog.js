import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT'], required: true },
  module: { type: String, required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  previousState: { type: mongoose.Schema.Types.Mixed },
  newState: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now, expires: '365d' } // TTL index for 365 days
}, { timestamps: false });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
