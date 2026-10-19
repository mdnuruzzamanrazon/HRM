import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER', 'FINANCE_OFFICER', 'EMPLOYEE'],
    required: true,
  },
  employeeProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  isActive: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: false },
  tokenVersion: { type: Number, default: 0 },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  lastLoginAt: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordCode: { type: String },
  resetPasswordExpires: { type: Date },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date },
  twoFactorSecret: { type: String },
  isTwoFactorEnabled: { type: Boolean, default: false },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
