import mongoose from 'mongoose';

const assetReferenceSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'default_references',
      unique: true,
    },
    categories: {
      type: [String],
      default: ['IT Equipment', 'Office Furniture', 'Field Equipment', 'Vehicle', 'Safety Equipment', 'Communication', 'Other'],
    },
    statuses: {
      type: [String],
      default: ['Active', 'In Use', 'Under Maintenance', 'Transferred', 'Disposed', 'Lost'],
    },
    conditions: {
      type: [String],
      default: ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'],
    },
    auditResults: {
      type: [String],
      default: ['Verified', 'Mismatch', 'Missing', 'Damaged', 'Not Audited'],
    },
    riskLevels: {
      type: [String],
      default: ['Low', 'Medium', 'High', 'Critical'],
    },
    locations: {
      type: [String],
      default: ['Head Office', 'Amtoli Field Office', 'Warehouse', 'Taltali Program Office', 'Hatchery Office', "Cox's Bazar Field", 'Barguna Field'],
    },
    vehicles: {
      type: [String],
      default: ['CBDP-TVS-001', 'CBDP-Apache-002', 'CBDP-Honda-003', 'CBDP-Auto-004'],
    },
    workflowStatuses: {
      type: [String],
      default: ['Not Started', 'In Progress', 'Completed', 'Delayed', 'On Hold', 'Approved', 'Rejected'],
    },
    projectDonors: {
      type: [String],
      default: ['Core', 'LLDRR', 'FISHNET', 'NAGORIC', 'Plan International', 'Other'],
    },
  },
  {
    timestamps: true,
  }
);

const AssetReference = mongoose.models.AssetReference || mongoose.model('AssetReference', assetReferenceSchema);

export default AssetReference;
