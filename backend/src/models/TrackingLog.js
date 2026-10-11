import mongoose from 'mongoose';

const trackingSchema = new mongoose.Schema({
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  activityType: { 
    type: String, 
    enum: ['SYSTEM_LOGIN', 'LOCATION_CHECKIN', 'MODULE_ACCESS', 'DATA_UPDATE', 'OTHER'],
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  ipAddress: { 
    type: String 
  },
  deviceInfo: { 
    type: String 
  }
}, { timestamps: true });

export const TrackingLog = mongoose.model('TrackingLog', trackingSchema);
