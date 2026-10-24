import mongoose from 'mongoose';

const vehicleLogSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: [true, 'Date is required'],
      index: true,
    },
    vehicleId: {
      type: String,
      required: [true, 'Vehicle ID is required'],
      trim: true,
      index: true,
    },
    driver: {
      type: String,
      required: [true, 'Driver is required'],
      trim: true,
    },
    startKm: {
      type: Number,
      required: true,
      default: 0,
    },
    endKm: {
      type: Number,
      required: true,
      default: 0,
    },
    tripKm: {
      type: Number,
      default: 0,
    },
    purposeRoute: {
      type: String,
      trim: true,
      default: '',
    },
    fuelLiters: {
      type: Number,
      default: 0,
    },
    fuelCost: {
      type: Number,
      default: 0,
    },
    costPerLiter: {
      type: Number,
      default: 130,
    },
    kmPerLiter: {
      type: Number,
      default: 0,
    },
    costPerKm: {
      type: Number,
      default: 0,
    },
    odometerCheck: {
      type: String,
      enum: ['OK', 'Discrepancy'],
      default: 'OK',
    },
    approvedBy: {
      type: String,
      default: 'Admin',
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

vehicleLogSchema.pre('save', function (next) {
  if (this.endKm >= this.startKm) {
    this.tripKm = Number((this.endKm - this.startKm).toFixed(2));
  }
  if (this.fuelLiters > 0 && this.tripKm > 0) {
    this.kmPerLiter = Number((this.tripKm / this.fuelLiters).toFixed(2));
  }
  if (this.tripKm > 0 && this.fuelCost > 0) {
    this.costPerKm = Number((this.fuelCost / this.tripKm).toFixed(2));
  }
  if (this.fuelLiters > 0 && this.fuelCost > 0 && !this.costPerLiter) {
    this.costPerLiter = Number((this.fuelCost / this.fuelLiters).toFixed(2));
  }
  if (typeof next === 'function') next();
});

const VehicleLog = mongoose.models.VehicleLog || mongoose.model('VehicleLog', vehicleLogSchema);

export default VehicleLog;
