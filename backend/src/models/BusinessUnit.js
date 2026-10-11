import mongoose from 'mongoose';

const businessUnitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  headOfBusinessUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  budgetCode: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const BusinessUnit = mongoose.model('BusinessUnit', businessUnitSchema);
