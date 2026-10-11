import mongoose from 'mongoose';

const policySchema = new mongoose.Schema({
  title: { type: String, required: true },
  version: { type: String, required: true },
  category: { type: String },
  fileUrl: { type: String, required: true },
  effectiveDate: { type: Date, required: true },
  acknowledgments: [{
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    acknowledgedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export const Policy = mongoose.model('Policy', policySchema);
