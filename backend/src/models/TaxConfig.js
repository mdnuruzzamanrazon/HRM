import mongoose from 'mongoose';

const taxConfigSchema = new mongoose.Schema({
  taxName: { 
    type: String, 
    required: true,
    unique: true
  },
  taxRate: { 
    type: Number, 
    required: true,
    min: 0 
  },
  type: { 
    type: String, 
    enum: ['FIXED', 'PERCENTAGE'], 
    default: 'PERCENTAGE' 
  },
  description: { 
    type: String 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

export const TaxConfig = mongoose.model('TaxConfig', taxConfigSchema);
