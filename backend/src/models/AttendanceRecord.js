import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: String, required: true }, // Format YYYY-MM-DD
  checkIn: {
    timestamp: { type: Date },
    ip: { type: String },
    geo: { lat: Number, lng: Number },
    accuracy: { type: Number },
    distanceMeters: { type: Number },
    workplaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkplaceLocation' },
    workplaceName: { type: String },
    verificationStatus: { 
      type: String, 
      enum: ['VERIFIED', 'OUTSIDE_GEOFENCE', 'ACCURACY_POOR', 'BYPASS_ADMIN', 'UNVERIFIED'],
      default: 'UNVERIFIED'
    },
    verificationMethod: { type: String, default: 'GPS_GEOFENCE' }
  },
  checkOut: {
    timestamp: { type: Date },
    ip: { type: String },
    geo: { lat: Number, lng: Number },
    accuracy: { type: Number },
    distanceMeters: { type: Number },
    workplaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkplaceLocation' },
    workplaceName: { type: String },
    verificationStatus: { 
      type: String, 
      enum: ['VERIFIED', 'OUTSIDE_GEOFENCE', 'ACCURACY_POOR', 'BYPASS_ADMIN', 'UNVERIFIED'],
      default: 'UNVERIFIED'
    },
    verificationMethod: { type: String, default: 'GPS_GEOFENCE' }
  },
  totalWorkMinutes: { type: Number, default: 0 },
  breakMinutes: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE'],
    required: true
  },
  isRemote: { type: Boolean, default: false }
}, { timestamps: true });

// Compound index on { employeeId: 1, date: 1 } (unique)
attendanceRecordSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
