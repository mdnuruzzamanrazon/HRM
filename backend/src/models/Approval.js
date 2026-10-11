import mongoose from 'mongoose';

const approvalWorkflowSchema = new mongoose.Schema({
  workflowType: { 
    type: String, 
    enum: ['LEAVE', 'EXPENSE', 'ATTENDANCE_CORRECTION', 'PROFILE_UPDATE'],
    required: true,
    unique: true
  },
  steps: [{
    stepOrder: { type: Number, required: true },
    approverRole: { type: String, required: true },
    timeoutHours: { type: Number, default: 48 }
  }]
}, { timestamps: true });

const approvalRequestSchema = new mongoose.Schema({
  entityType: { type: String, required: true }, // e.g., 'LeaveApplication'
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'entityType' },
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currentApproverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  history: [{
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['CREATED', 'APPROVED', 'REJECTED', 'ESCALATED'] },
    comment: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export const ApprovalWorkflow = mongoose.model('ApprovalWorkflow', approvalWorkflowSchema);
export const ApprovalRequest = mongoose.model('ApprovalRequest', approvalRequestSchema);
