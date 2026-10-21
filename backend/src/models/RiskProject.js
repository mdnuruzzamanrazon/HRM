import mongoose from 'mongoose';

const riskProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project Name is required'],
      trim: true,
      index: true,
    },
    officeResponsible: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    period: {
      type: String,
      trim: true,
      default: '',
    },
    reviewQuarter: {
      type: String,
      trim: true,
      default: '',
    },
    endQuarter: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'],
      default: 'ACTIVE',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const RiskProject = mongoose.model('RiskProject', riskProjectSchema);
