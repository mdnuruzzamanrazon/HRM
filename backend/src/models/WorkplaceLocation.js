import mongoose from 'mongoose';

const workplaceLocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workplace name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Workplace branch code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  address: {
    type: String,
    required: [true, 'Physical address is required'],
    trim: true,
  },
  city: {
    type: String,
    trim: true,
    default: '',
  },
  country: {
    type: String,
    trim: true,
    default: '',
  },
  coordinates: {
    lat: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: -90,
      max: 90,
    },
    lng: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: -180,
      max: 180,
    },
  },
  radiusMeters: {
    type: Number,
    required: [true, 'Permitted radius in meters is required'],
    default: 100,
    min: [10, 'Radius must be at least 10 meters'],
    max: [50000, 'Radius cannot exceed 50,000 meters'],
  },
  maxAccuracyThreshold: {
    type: Number,
    default: 200,
    min: [10, 'Accuracy threshold must be at least 10 meters'],
    max: [2000, 'Accuracy threshold cannot exceed 2000 meters'],
    description: 'Reject GPS readings if device reported accuracy exceeds this number of meters',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  geofenceEnforced: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

// Index for geo coordinates and code
workplaceLocationSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });
workplaceLocationSchema.index({ isActive: 1, isDefault: 1 });

export const WorkplaceLocation = mongoose.model('WorkplaceLocation', workplaceLocationSchema);
