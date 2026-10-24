import mongoose from 'mongoose';

const assetWorkflowSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: [true, 'Request ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    assetName: {
      type: String,
      required: [true, 'Asset Name is required'],
      trim: true,
    },
    requestingDept: {
      type: String,
      trim: true,
      default: 'Program',
      index: true,
    },
    budgetLine: {
      type: String,
      trim: true,
      default: 'IT Equipment',
    },
    requisitionDate: {
      type: String,
      default: '',
    },
    approvalDate: {
      type: String,
      default: '',
    },
    rfqDate: {
      type: String,
      default: '',
    },
    poDate: {
      type: String,
      default: '',
    },
    receivedDate: {
      type: String,
      default: '',
    },
    taggedDate: {
      type: String,
      default: '',
    },
    assignedTo: {
      type: String,
      default: '',
    },
    maintenanceDate: {
      type: String,
      default: '',
    },
    disposalRequestDate: {
      type: String,
      default: '',
    },
    disposalApprovalDate: {
      type: String,
      default: '',
    },
    disposalDate: {
      type: String,
      default: '',
    },
    currentStage: {
      type: String,
      default: 'Requisition',
      index: true,
    },
    workflowStatus: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'Delayed', 'On Hold'],
      default: 'In Progress',
      index: true,
    },
    leadTimeDays: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const AssetWorkflow = mongoose.models.AssetWorkflow || mongoose.model('AssetWorkflow', assetWorkflowSchema);

export default AssetWorkflow;
