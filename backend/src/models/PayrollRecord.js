import mongoose from 'mongoose';

const payrollRecordSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  payPeriod: {
    month: { type: Number, required: true },
    year: { type: Number, required: true }
  },
  baseSalary: { type: Number, required: true },
  allowances: [{
    title: String,
    amount: Number
  }],
  deductions: [{
    title: String,
    amount: Number
  }],
  taxDeduction: { type: Number, default: 0 },
  netSalary: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['DRAFT', 'APPROVED', 'PAID'], default: 'DRAFT' },
  disbursementDate: { type: Date }
}, { timestamps: true });

export const PayrollRecord = mongoose.model('PayrollRecord', payrollRecordSchema);
