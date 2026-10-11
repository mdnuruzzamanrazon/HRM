import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  headOfDepartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  budgetCode: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Department = mongoose.model('Department', departmentSchema);
