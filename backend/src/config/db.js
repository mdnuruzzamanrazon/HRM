import mongoose from 'mongoose';

let cachedConnection = null;

export const connectDB = async () => {
  // If already connected, reuse connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If in the process of connecting, wait for it
  if (cachedConnection) {
    try {
      const conn = await cachedConnection;
      return conn;
    } catch {
      cachedConnection = null;
    }
  }

  const mongoUri = process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.MONGODB_URL ||
    process.env.DATABASE_URL ||
    process.env.MONGO_URL;

  if (!mongoUri) {
    throw new Error('No MongoDB connection string found. Please configure MONGO_URI in your Vercel Environment Variables.');
  }

  cachedConnection = mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    const conn = await cachedConnection;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    cachedConnection = null;
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};


