import app from './app.js';
import { connectDB } from './config/db.js';
import { seedBeneficiariesIfEmpty } from './services/beneficiarySeeder.js';
import { runProjectMigration } from './services/projectMigration.js';

const PORT = process.env.PORT || 5000;

// Connect to Database and start listening
connectDB().then(async () => {
  // Ensure official beneficiaries are seeded if collection is empty
  await seedBeneficiariesIfEmpty().catch((err) => {
    console.error('[BeneficiarySeeder] Startup seeding error:', err.message);
  });

  // Ensure multi-project migration is up-to-date
  await runProjectMigration().catch((err) => {
    console.error('[ProjectMigration] Startup migration error:', err.message);
  });

  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to start server due to database connection error:', err.message);
});

