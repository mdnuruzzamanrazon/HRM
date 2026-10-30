import mongoose from 'mongoose';

const assetAssignmentSchema = new mongoose.Schema(
  {
    assetRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset master record reference is required'],
      index: true,
    },
    assetId: {
      type: String,
      required: [true, 'Asset tag identifier is required'],
      trim: true,
      index: true,
    },
    assignmentType: {
      type: String,
      enum: ['PROJECT', 'DEPARTMENT', 'HEAD_OFFICE', 'UNASSIGNED'],
      default: 'PROJECT',
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RiskProject',
      default: null,
      index: true,
    },
    projectCode: {
      type: String,
      trim: true,
      default: '',
    },
    projectName: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: 'Head Office',
    },
    custodianEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true,
    },
    custodianName: {
      type: String,
      trim: true,
      default: 'Unassigned',
    },
    assignedDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expectedReturnDate: {
      type: Date,
      default: null,
    },
    returnedDate: {
      type: Date,
      default: null,
    },
    conditionAtAssignment: {
      type: String,
      trim: true,
      default: 'Good',
    },
    conditionAtReturn: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'RETURNED', 'TRANSFERRED'],
      default: 'ACTIVE',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedByEmail: {
      type: String,
      default: '',
    },
    returnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

assetAssignmentSchema.index({ assetRef: 1, status: 1, assignedDate: -1 });
assetAssignmentSchema.index({ projectId: 1, status: 1, assignedDate: -1 });

export const AssetAssignment =
  mongoose.models.AssetAssignment ||
  mongoose.model('AssetAssignment', assetAssignmentSchema);

export default AssetAssignment;

