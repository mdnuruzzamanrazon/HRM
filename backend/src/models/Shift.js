import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  workingDays: { 
    type: [String], 
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] 
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Shift = mongoose.model('Shift', shiftSchema);
