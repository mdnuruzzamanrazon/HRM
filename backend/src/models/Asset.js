import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  assetTag: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String },
  serialNumber: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  status: { type: String, enum: ['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED'], default: 'AVAILABLE' }
}, { timestamps: true });

export const Asset = mongoose.model('Asset', assetSchema);
