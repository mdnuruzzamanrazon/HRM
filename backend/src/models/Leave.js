import mongoose from 'mongoose';

const leaveTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, enum: ['ANNUAL', 'SICK', 'CASUAL', 'MATERNITY', 'UNPAID'] },
  annualQuota: { type: Number, required: true },
  isPaid: { type: Boolean, default: true },
  carryForwardMax: { type: Number, default: 0 }
}, { timestamps: true });

const leaveApplicationSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType: { type: String, default: 'ANNUAL' },
  leaveTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, required: true },
  reason: { type: String },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'], default: 'PENDING' },
  approvalStepCurrent: { type: Number, default: 1 },
  auditTrail: [{
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: String,
    comment: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export const LeaveType = mongoose.model('LeaveType', leaveTypeSchema);
export const LeaveApplication = mongoose.model('LeaveApplication', leaveApplicationSchema);
