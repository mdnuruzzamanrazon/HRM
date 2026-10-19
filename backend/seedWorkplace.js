import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { WorkplaceLocation } from './src/models/WorkplaceLocation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedWorkplaces = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cbdp';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');

    const count = await WorkplaceLocation.countDocuments();
    if (count > 0) {
      console.log(`Workplaces already seeded (${count} locations exist).`);
      const existing = await WorkplaceLocation.find();
      console.log('Locations:', existing.map(e => `${e.name} (${e.code}) - Radius: ${e.radiusMeters}m`));
      process.exit(0);
    }

    const defaultLocations = [
      {
        name: 'CBDP Corporate Headquarters',
        code: 'CBDP-HQ-01',
        address: '100 Innovation Way, Suite 400, Tech Park',
        city: 'Silicon Valley, CA',
        country: 'United States',
        coordinates: {
          lat: 37.774929,
          lng: -122.419416,
        },
        radiusMeters: 150, // 150 meters permitted radius
        maxAccuracyThreshold: 200,
        isDefault: true,
        isActive: true,
        geofenceEnforced: true,
        description: 'Main headquarters building and administrative campus. Includes floors 1-5 and north parking.',
      },
      {
        name: 'CBDP Regional Operations Hub',
        code: 'CBDP-HUB-02',
        address: '450 Technology Boulevard, North Tower',
        city: 'Austin, TX',
        country: 'United States',
        coordinates: {
          lat: 30.267153,
          lng: -97.7430608,
        },
        radiusMeters: 200,
        maxAccuracyThreshold: 200,
        isDefault: false,
        isActive: true,
        geofenceEnforced: true,
        description: 'Regional field operations, logistics dispatch, and technical support office.',
      },
      {
        name: 'Dhaka City Center Branch',
        code: 'CBDP-DHK-03',
        address: 'Gulshan 2 Avenue, Commercial Tower, Level 11',
        city: 'Dhaka',
        country: 'Bangladesh',
        coordinates: {
          lat: 23.7925,
          lng: 90.4078,
        },
        radiusMeters: 100,
        maxAccuracyThreshold: 200,
        isDefault: false,
        isActive: true,
        geofenceEnforced: true,
        description: 'South Asia regional development and operational center.',
      }
    ];

    await WorkplaceLocation.insertMany(defaultLocations);
    console.log(`Successfully seeded ${defaultLocations.length} authorized workplace locations!`);

    process.exit(0);
  } catch (err) {
    console.error('Error seeding workplaces:', err);
    process.exit(1);
  }
};

seedWorkplaces();
