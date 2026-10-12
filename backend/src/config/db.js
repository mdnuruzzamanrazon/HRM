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

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexushr';

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


