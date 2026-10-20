import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  employeeCode: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  workEmail: { type: String, lowercase: true, trim: true, index: true },
  officialEmail: { type: String, lowercase: true, trim: true, index: true },
  personalDetails: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    dob: { type: Date },
    phone: { type: String },
    contactAddress: { type: String }
  },
  jobDetails: {
    title: { type: String, required: true },
    department: { type: String, default: 'General Operations' },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    businessUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessUnit' },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    employmentType: { type: String, enum: ['FULL_TIME', 'PART_TIME', 'CONTRACTOR'], default: 'FULL_TIME' },
    joinDate: { type: Date, required: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE', 'PROBATION', 'DELETED'], default: 'ACTIVE' }
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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

