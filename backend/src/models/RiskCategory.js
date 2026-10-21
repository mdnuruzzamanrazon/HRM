import mongoose from 'mongoose';

const subCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, default: '' },
    ukDirector: { type: String, trim: true, default: '' },
    note: { type: String, trim: true, default: '' },
    aliases: [{ type: String, trim: true }],
  },
  { _id: true }
);

const riskCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    subCategories: [subCategorySchema],
    isCustom: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const RiskCategory = mongoose.model('RiskCategory', riskCategorySchema);
