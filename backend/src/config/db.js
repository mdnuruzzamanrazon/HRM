import mongoose from 'mongoose';

// Disable Mongoose command buffering globally to prevent 10s hangs when DB is not connected
mongoose.set('bufferCommands', false);

let cachedConnection = null;

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
  // If in demo mode, resolve immediately
  if (isDemoMode()) {
    console.log('[Database] Demo Mode active (no MONGO_URI). Running with in-memory store.');
    return null;
  }

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

  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.MONGODB_URL ||
    process.env.DATABASE_URL ||
    process.env.MONGO_URL;

  cachedConnection = mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    const conn = await cachedConnection;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    cachedConnection = null;
    console.error(`MongoDB Connection Error: ${error.message}. Falling back to Demo Mode.`);
    // Don't crash in production if connection fails, allow graceful fallback
    return null;
  }
};



