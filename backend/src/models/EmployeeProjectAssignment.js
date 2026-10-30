import mongoose from 'mongoose';

const assignmentAuditItemSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ['ASSIGNED', 'UPDATED', 'REASSIGNED', 'REMOVED', 'COMPLETED'],
    },
    performedBy: {
      type: String,
      default: 'System',
    },
    userEmail: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    details: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const employeeProjectAssignmentSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee master record reference is required'],
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RiskProject',
      required: [true, 'Project reference is required'],
      index: true,
    },
    roleInProject: {
      type: String,
      trim: true,
      default: 'Project Staff',
    },
    allocationPercentage: {
      type: Number,
      min: 1,
      max: 100,
      default: 100,
    },
    startDate: {
      type: Date,
      required: [true, 'Assignment start date is required'],
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'REMOVED', 'REASSIGNED'],
      default: 'ACTIVE',
      index: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    reassignedToProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RiskProject',
      default: null,
    },
    reassignedFromProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RiskProject',
      default: null,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    removedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    removedAt: {
      type: Date,
      default: null,
    },
    auditTrail: [assignmentAuditItemSchema],
  },
  {
    timestamps: true,
  }
);

employeeProjectAssignmentSchema.index({ employeeId: 1, projectId: 1, status: 1 });
employeeProjectAssignmentSchema.index({ projectId: 1, status: 1, startDate: -1 });
employeeProjectAssignmentSchema.index({ employeeId: 1, status: 1, startDate: -1 });

export const EmployeeProjectAssignment =
  mongoose.models.EmployeeProjectAssignment ||
  mongoose.model('EmployeeProjectAssignment', employeeProjectAssignmentSchema);

export default EmployeeProjectAssignment;

