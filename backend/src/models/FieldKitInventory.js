import mongoose from 'mongoose';

const fieldKitInventorySchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      required: [true, 'Item code is required'],
      unique: true,
      trim: true,
      index: true,
    },
    kitProject: {
      type: String,
      trim: true,
      default: 'FISHNET',
      index: true,
    },
    equipmentName: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'Field Equipment',
    },
    location: {
      type: String,
      trim: true,
      default: 'Warehouse',
    },
    responsiblePerson: {
      type: String,
      trim: true,
      default: 'Logistics Assistant',
    },
    openingQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    issuedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    returnedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    damagedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    missingQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableQty: {
      type: Number,
      default: 0,
    },
    minimumStock: {
      type: Number,
      default: 5,
    },
    stockStatus: {
      type: String,
      enum: ['OK', 'Low', 'Reorder', 'Critical'],
      default: 'OK',
    },
    lastPhysicalCount: {
      type: String,
      default: '',
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

fieldKitInventorySchema.pre('save', function (next) {
  this.availableQty = Math.max(0, (this.openingQty - this.issuedQty + this.returnedQty - this.damagedQty - this.missingQty));
  if (this.availableQty <= 0) {
    this.stockStatus = 'Critical';
  } else if (this.availableQty <= this.minimumStock) {
    this.stockStatus = 'Reorder';
  } else {
    this.stockStatus = 'OK';
  }
  if (typeof next === 'function') next();
});

const FieldKitInventory = mongoose.models.FieldKitInventory || mongoose.model('FieldKitInventory', fieldKitInventorySchema);

export default FieldKitInventory;
