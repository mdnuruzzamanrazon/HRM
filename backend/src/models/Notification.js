import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['SYSTEM', 'LEAVE', 'PAYROLL', 'TASK', 'EXPENSE', 'GENERAL'],
    default: 'GENERAL'
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  link: { 
    type: String 
  }
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);
