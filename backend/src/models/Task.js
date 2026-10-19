import mongoose from 'mongoose';

const fileAttachmentSchema = new mongoose.Schema({
  fileId: { type: String, required: true },
  name: { type: String, required: true },
  originalName: { type: String, required: true },
  path: { type: String, default: '' },
  mimeType: { type: String, default: 'application/octet-stream' },
  size: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  version: { type: Number, required: true, default: 1 },
  submittedAt: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  files: [fileAttachmentSchema],
  status: {
    type: String,
    enum: ['SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED', 'APPROVED', 'REJECTED'],
    default: 'SUBMITTED'
  },
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  feedback: { type: String, default: '' }
}, { _id: true });

const messageSchema = new mongoose.Schema({
  messageId: { type: String, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const timelineSchema = new mongoose.Schema({
  action: { type: String, required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  actorName: { type: String, required: true },
  actorRole: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: String, default: '' }
}, { _id: false });

const taskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    default: ''
  },
  instructions: {
    type: String,
    default: ''
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  assignedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  dueDate: { 
    type: Date,
    required: true
  },
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  status: { 
    type: String, 
    enum: [
      'AWAITING_ACCEPTANCE',
      'ACCEPTED',
      'IN_PROGRESS',
      'SUBMITTED',
      'UNDER_REVIEW',
      'REVISION_REQUIRED',
      'RESUBMITTED',
      'COMPLETED',
      'CANCELLED',
      // Legacy compatibility values
      'TODO',
      'REVIEW',
      'DONE'
    ],
    default: 'AWAITING_ACCEPTANCE'
  },
  acceptanceStatus: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING'
  },
  acceptedAt: {
    type: Date
  },
  attachments: [fileAttachmentSchema],
  submissions: [submissionSchema],
  messages: [messageSchema],
  timeline: [timelineSchema]
}, { timestamps: true });

// Create indexes for high-performance filtering and employee-specific queries
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1 });

export const Task = mongoose.model('Task', taskSchema);
