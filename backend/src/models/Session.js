import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  ipAddress: { 
    type: String 
  },
  deviceInfo: { 
    type: String 
  },
  lastActive: { 
    type: Date, 
    default: Date.now 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

export const Session = mongoose.model('Session', sessionSchema);
