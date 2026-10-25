import mongoose from 'mongoose';

const auditTrailItemSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ['CREATED', 'UPDATED', 'STATUS_CHANGE', 'USER_ASSIGNED', 'USER_REMOVED', 'ARCHIVED', 'DELETED', 'RESTORED'],
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

const assignedUserSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userEmail: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['VIEWER', 'EDITOR', 'MANAGER', 'ADMIN'],
      default: 'EDITOR',
    },
    modules: {
      type: [String],
      enum: ['RISK', 'COMPLAINTS', 'EVENTS', 'BENEFICIARIES'],
      default: ['RISK', 'COMPLAINTS', 'EVENTS', 'BENEFICIARIES'],
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const riskProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project Name is required'],
      trim: true,
      index: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
      index: true,
    },
    officeResponsible: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    period: {
      type: String,
      trim: true,
      default: '',
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    projectManager: {
      type: String,
      trim: true,
      default: '',
    },
    responsiblePerson: {
      type: String,
      trim: true,
      default: '',
    },
    reviewQuarter: {
      type: String,
      trim: true,
      default: '',
    },
    endQuarter: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    assignedUsers: [assignedUserSchema],
    auditTrail: [auditTrailItemSchema],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const RiskProject = mongoose.models.RiskProject || mongoose.model('RiskProject', riskProjectSchema);
export const Project = RiskProject;
export default RiskProject;
