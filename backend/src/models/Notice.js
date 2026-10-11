import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  content: { 
    type: String, 
    required: true 
  },
  priority: { 
    type: String, 
    enum: ['INFO', 'IMPORTANT', 'URGENT'],
    default: 'INFO'
  },
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

export const Notice = mongoose.model('Notice', noticeSchema);
