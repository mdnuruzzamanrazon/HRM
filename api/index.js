import app from '../backend/src/app.js';
import { connectDB } from '../backend/src/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('[api/index] Database connection error:', err.message);
  }

  try {
    return app(req, res);
  } catch (err) {
    console.error('[api/index] Fatal handler error:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error in API handler',
        error: err.message,
      });
    }
  }
}
