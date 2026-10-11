import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  employeeCode: { type: String, required: true, unique: true, index: true },
  personalDetails: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dob: { type: Date },
    phone: { type: String },
    contactAddress: { type: String }
  },
  jobDetails: {
    title: { type: String, required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    businessUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessUnit' },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    employmentType: { type: String, enum: ['FULL_TIME', 'PART_TIME', 'CONTRACTOR'], default: 'FULL_TIME' },
    joinDate: { type: Date, required: true },
    status: { type: String, enum: ['ACTIVE', 'TERMINATED', 'ON_LEAVE', 'PROBATION'], default: 'ACTIVE' }
  },
  bankDetails: {
    accountNumber: { type: String },
    routingNumber: { type: String },
    taxId: { type: String }
  },
  documents: [{
    title: String,
    fileUrl: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export const Employee = mongoose.model('Employee', employeeSchema);
