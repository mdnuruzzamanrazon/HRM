import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import mongoose from 'mongoose';
import { RiskProject } from '../models/RiskProject.js';
import { RiskRecord } from '../models/RiskRecord.js';
import { ComplaintRecord } from '../models/ComplaintRecord.js';
import EventRecord from '../models/EventRecord.js';
import Beneficiary from '../models/Beneficiary.js';
import { connectDB, isDemoMode } from '../config/db.js';

export const runProjectMigration = async () => {
  if (isDemoMode() || mongoose.connection.readyState !== 1) {
    console.log('[ProjectMigration] Running in Demo Mode or DB not ready. Skipping persistent migration.');
    return { success: true, message: 'Demo mode active' };
  }

  try {
    console.log('[ProjectMigration] Starting multi-project historical data migration...');

    // 1. Ensure "CBDP Women & Girls Empowerment Initiative" project exists and has code PRJ-WGEI
    let wgeiProject = await RiskProject.findOne({ name: /Women & Girls Empowerment/i, isDeleted: { $ne: true } });
    if (!wgeiProject) {
      wgeiProject = await RiskProject.create({
        name: 'CBDP Women & Girls Empowerment Initiative',
        code: 'PRJ-WGEI',
        officeResponsible: 'Country Office / Safeguarding & HR Unit',
        location: 'Dhaka & Regional Impact Zones',
        period: 'Jan 2025 - Dec 2027',
        reviewQuarter: 'Q1 2026',
        endQuarter: 'Q4 2027',
        description: 'Comprehensive multi-region human development and empowerment intervention.',
        status: 'ACTIVE',
        isDefault: false,
      });
      console.log(`[ProjectMigration] Created WGEI project with ID: ${wgeiProject._id}`);
    } else {
      if (!wgeiProject.code) {
        wgeiProject.code = 'PRJ-WGEI';
        await wgeiProject.save();
      }
    }

    // 2. Ensure "Community Based Development Project (CBDP)" project exists
    let cbdpProject = await RiskProject.findOne({ name: /Community Based Development Project/i, isDeleted: { $ne: true } });
    if (!cbdpProject) {
      cbdpProject = await RiskProject.create({
        name: 'Community Based Development Project (CBDP)',
        code: 'PRJ-CBDP',
        officeResponsible: 'Country Office / Field Operations Unit',
        location: 'Amtoli, Barguna, Barishal & Regional Centers',
        period: 'Jan 2024 - Dec 2026',
        reviewQuarter: 'Q2 2026',
        endQuarter: 'Q4 2026',
        description: 'Community-led development initiatives focusing on conflict mitigation, civic participation, and social resilience.',
        status: 'ACTIVE',
        isDefault: false,
      });
      console.log(`[ProjectMigration] Created CBDP project with ID: ${cbdpProject._id}`);
    } else {
      if (!cbdpProject.code) {
        cbdpProject.code = 'PRJ-CBDP';
        await cbdpProject.save();
      }
    }

    // 3. Ensure "NAGORIC Project" exists
    let nagoricProject = await RiskProject.findOne({ name: /NAGORIC Project/i, isDeleted: { $ne: true } });
    if (!nagoricProject) {
      nagoricProject = await RiskProject.create({
        name: 'NAGORIC Project',
        code: 'PRJ-NAG',
        officeResponsible: 'Amtoli Upazila / Union Civic Fora',
        location: 'Amtoli Upazila & Union Civic Hubs, Barguna, Barishal',
        period: 'Jan 2025 - Dec 2027',
        reviewQuarter: 'Q1 2026',
        endQuarter: 'Q4 2027',
        description: 'Citizen empowerment, social inclusion, and rights-based civic forum mobilization.',
        status: 'ACTIVE',
        isDefault: true,
      });
      console.log(`[ProjectMigration] Created NAGORIC project with ID: ${nagoricProject._id}`);
    } else {
      if (!nagoricProject.code) {
        nagoricProject.code = 'PRJ-NAG';
        await nagoricProject.save();
      }
      nagoricProject.isDefault = true;
      await nagoricProject.save();
    }

    // 4. Migrate Risks: link unlinked risks to WGEI or matching project
    const unlinkedRisks = await RiskRecord.countDocuments({ projectId: { $exists: false } });
    if (unlinkedRisks > 0) {
      await RiskRecord.updateMany(
        { projectId: { $exists: false } },
        { $set: { projectId: wgeiProject._id } }
      );
      console.log(`[ProjectMigration] Linked ${unlinkedRisks} historical risks to ${wgeiProject.name}`);
    }

    // 5. Migrate Complaints: link complaints
    const complaintsToWgei = await ComplaintRecord.updateMany(
      { $or: [{ projectId: { $exists: false } }, { projectId: null }], projectName: /Women & Girls/i },
      { $set: { projectId: wgeiProject._id } }
    );
    console.log(`[ProjectMigration] Linked ${complaintsToWgei.modifiedCount} complaints to ${wgeiProject.name}`);

    // 6. Migrate Events: link events with projectName 'Community Based Development Project (CBDP)' to CBDP project
    const eventsToCbdp = await EventRecord.updateMany(
      { $or: [{ projectId: { $exists: false } }, { projectId: null }] },
      { $set: { projectId: cbdpProject._id, projectName: cbdpProject.name } }
    );
    console.log(`[ProjectMigration] Linked ${eventsToCbdp.modifiedCount} events to ${cbdpProject.name} (${cbdpProject._id})`);

    // 7. Migrate Beneficiaries: link beneficiaries with projectName 'NAGORIC Project' to NAGORIC project
    const benToNagoric = await Beneficiary.updateMany(
      { $or: [{ projectId: { $exists: false } }, { projectId: null }] },
      { $set: { projectId: nagoricProject._id, projectName: nagoricProject.name } }
    );
    console.log(`[ProjectMigration] Linked ${benToNagoric.modifiedCount} beneficiaries to ${nagoricProject.name} (${nagoricProject._id})`);

    // 8. Verification Summary
    const stats = {
      projects: await RiskProject.countDocuments({ isDeleted: { $ne: true } }),
      risksByProject: await RiskRecord.aggregate([{ $group: { _id: '$projectId', count: { $sum: 1 } } }]),
      complaintsByProject: await ComplaintRecord.aggregate([{ $match: { isDeleted: { $ne: true } } }, { $group: { _id: '$projectId', count: { $sum: 1 } } }]),
      eventsByProject: await EventRecord.aggregate([{ $match: { isDeleted: { $ne: true } } }, { $group: { _id: '$projectId', count: { $sum: 1 } } }]),
      beneficiariesByProject: await Beneficiary.aggregate([{ $group: { _id: '$projectId', count: { $sum: 1 } } }]),
    };

    console.log('[ProjectMigration] Migration completed successfully! Verification stats:', JSON.stringify(stats, null, 2));

    return {
      success: true,
      message: 'Migration completed successfully',
      stats
    };
  } catch (error) {
    console.error('[ProjectMigration] Error during migration:', error);
    throw error;
  }
};

// If run directly via node command line
if (process.argv[1]?.endsWith('projectMigration.js')) {
  connectDB().then(async () => {
    await runProjectMigration();
    process.exit(0);
  }).catch((err) => {
    console.error('[ProjectMigration] Failed:', err);
    process.exit(1);
  });
}
