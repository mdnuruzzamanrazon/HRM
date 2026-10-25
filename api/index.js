import app from '../backend/src/app.js';
import { connectDB } from '../backend/src/config/db.js';
import { seedBeneficiariesIfEmpty } from '../backend/src/services/beneficiarySeeder.js';
import { runProjectMigration } from '../backend/src/services/projectMigration.js';

let seeded = false;

export default async function handler(req, res) {
  try {
    await connectDB();
    if (!seeded) {
      seedBeneficiariesIfEmpty().catch((e) => console.error('[api/index] Auto-seed error:', e.message));
      runProjectMigration().catch((e) => console.error('[api/index] Project migration error:', e.message));
      seeded = true;
    }
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
