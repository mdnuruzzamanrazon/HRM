import mongoose from 'mongoose';

const handoverItemSchema = new mongoose.Schema(
  {
    sl: { type: Number, default: 1 },
    assetId: { type: String, trim: true, default: '' },
    assetName: { type: String, trim: true, required: true },
    conditionHandover: { type: String, default: 'Good' },
    accessories: { type: String, default: '' },
    qty: { type: Number, default: 1, min: 1 },
    conditionReturn: { type: String, default: '' },
    remarks: { type: String, default: '' },
  },
  { _id: true }
);

const assetHandoverSchema = new mongoose.Schema(
  {
    formNo: {
      type: String,
      required: [true, 'Form No is required'],
      unique: true,
      trim: true,
      index: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['Handover', 'Return', 'Consumable'],
      default: 'Handover',
      index: true,
    },
    projectDonor: {
      type: String,
      trim: true,
      default: 'Core',
    },
    handedOverBy: {
      name: { type: String, default: '' },
      designation: { type: String, default: '' },
      location: { type: String, default: '' },
      contact: { type: String, default: '' },
    },
    receivedBy: {
      name: { type: String, default: '' },
      designation: { type: String, default: '' },
      location: { type: String, default: '' },
      contact: { type: String, default: '' },
    },
    purpose: {
      type: String,
      default: '',
    },
    expectedReturnDate: {
      type: String,
      default: '',
    },
    actualReturnDate: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Returned', 'Archived'],
      default: 'Active',
      index: true,
    },
    items: [handoverItemSchema],
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const AssetHandover = mongoose.models.AssetHandover || mongoose.model('AssetHandover', assetHandoverSchema);

export default AssetHandover;
