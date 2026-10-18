import mongoose from 'mongoose';

const attendanceCorrectionSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  checkInTime: {
    type: String, // HH:MM
    required: true,
  },
  checkOutTime: {
    type: String, // HH:MM
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewRemarks: {
    type: String,
  },
}, { timestamps: true });

export const AttendanceCorrection = mongoose.model('AttendanceCorrection', attendanceCorrectionSchema);
