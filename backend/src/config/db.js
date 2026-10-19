import mongoose from 'mongoose';

// Disable Mongoose command buffering globally to prevent hangs when DB is not connected
mongoose.set('bufferCommands', false);

// Global connection cache across serverless warm invocations
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const isDemoMode = () => {
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.MONGODB_URL ||
    process.env.DATABASE_URL ||
    process.env.MONGO_URL;

  return !mongoUri;
};

export const connectDB = async () => {
  // If no MONGO_URI is configured, run in demo mode
  if (isDemoMode()) {
    return null;
  }

  // If already connected, reuse existing connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      process.env.MONGODB_URL ||
      process.env.DATABASE_URL ||
      process.env.MONGO_URL;

    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(mongoUri, opts).then((mongooseInstance) => {
      console.log(`[MongoDB] Connected successfully to host: ${mongooseInstance.connection.host}`);
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error(`[MongoDB] Connection error: ${error.message}`);
    throw error;
  }
};



