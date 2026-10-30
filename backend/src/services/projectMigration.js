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
import Asset from '../models/Asset.js';
import { AssetAssignment } from '../models/AssetAssignment.js';
import { connectDB, isDemoMode } from '../config/db.js';

/**
 * Resolve project strictly from verifiable record evidence.
 * Returns null when evidence is insufficient so the record is flagged for administrative review rather than guessed.
 */
const matchProjectByEvidence = (textCandidates = [], projects = []) => {
  const joined = textCandidates
    .filter(Boolean)
    .map((s) => String(s).trim())
    .join(' | ');
  if (!joined) return null;

  for (const proj of projects) {
    if (proj.code && new RegExp(`\\b${proj.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(joined)) {
      return proj;
    }
    if (proj.name && joined.toLowerCase().includes(proj.name.toLowerCase())) {
      return proj;
    }
  }

  if (/women\s*&\s*girls\s*empowerment|wgei/i.test(joined)) {
    return projects.find((p) => p.code === 'PRJ-WGEI' || /Women & Girls Empowerment/i.test(p.name)) || null;
  }
  if (/nagoric|ben-nag-/i.test(joined)) {
    return projects.find((p) => p.code === 'PRJ-NAG' || /NAGORIC/i.test(p.name)) || null;
  }
  if (/community\s*based\s*development\s*project|\bcbdp\b|^\d{6}cb/i.test(joined)) {
    return projects.find((p) => p.code === 'PRJ-CBDP' || /Community Based Development Project/i.test(p.name)) || null;
  }

  return null;
};

export const runProjectMigration = async () => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (e) {
      console.warn('[ProjectMigration] DB connect attempt error:', e.message);
    }
  }

  if (isDemoMode() || mongoose.connection.readyState !== 1) {
    console.log('[ProjectMigration] Running in Demo Mode or DB not ready. Skipping persistent migration.');
    return { success: true, message: 'Demo mode active' };
  }

  try {
    console.log('[ProjectMigration] Starting safe evidence-based multi-project migration...');

    // 1. Ensure "CBDP Women & Girls Empowerment Initiative" project exists (PRJ-WGEI)
    let wgeiProject = await RiskProject.findOne({
      $or: [{ code: 'PRJ-WGEI' }, { name: /Women & Girls Empowerment/i }],
      isDeleted: { $ne: true },
    });
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
    } else if (!wgeiProject.code) {
      wgeiProject.code = 'PRJ-WGEI';
      await wgeiProject.save();
    }

    // 2. Ensure "Community Based Development Project (CBDP)" project exists (PRJ-CBDP)
    let cbdpProject = await RiskProject.findOne({
      $or: [{ code: 'PRJ-CBDP' }, { name: /Community Based Development Project/i }],
      isDeleted: { $ne: true },
    });
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
    } else if (!cbdpProject.code) {
      cbdpProject.code = 'PRJ-CBDP';
      await cbdpProject.save();
    }

    // 3. Ensure "NAGORIC Project" exists (PRJ-NAG)
    let nagoricProject = await RiskProject.findOne({
      $or: [{ code: 'PRJ-NAG' }, { name: /NAGORIC Project/i }],
      isDeleted: { $ne: true },
    });
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
    } else if (!nagoricProject.code || !nagoricProject.isDefault) {
      nagoricProject.code = nagoricProject.code || 'PRJ-NAG';
      nagoricProject.isDefault = true;
      await nagoricProject.save();
    }

    const allProjects = await RiskProject.find({ isDeleted: { $ne: true } }).lean();
    const validProjectIds = new Set(allProjects.map((p) => String(p._id)));

    let linkedCounts = { risks: 0, complaints: 0, events: 0, beneficiaries: 0, assetAssignments: 0 };
    let flaggedForReview = { risks: 0, complaints: 0, events: 0, beneficiaries: 0 };

    // 4. Evidence-based RiskRecord check (never guess unknown records)
    const orphanRisks = await RiskRecord.find({
      $or: [{ projectId: { $exists: false } }, { projectId: null }],
    });
    for (const r of orphanRisks) {
      const matched = matchProjectByEvidence([r.notes, r.description], allProjects);
      if (matched) {
        r.projectId = matched._id;
        r.needsProjectReview = false;
        await r.save();
        linkedCounts.risks++;
      } else if (!r.needsProjectReview) {
        r.needsProjectReview = true;
        r.projectReviewNote = 'Missing verifiable project evidence during migration; flagged for HR Admin review.';
        await r.save();
        flaggedForReview.risks++;
      }
    }

    // 5. Evidence-based ComplaintRecord migration
    const orphanComplaints = await ComplaintRecord.find({
      $or: [{ projectId: { $exists: false } }, { projectId: null }],
      isDeleted: { $ne: true },
    });
    for (const c of orphanComplaints) {
      const matched = matchProjectByEvidence([c.projectName, c.partnerOrgName], allProjects);
      if (matched) {
        c.projectId = matched._id;
        c.projectName = matched.name;
        c.needsProjectReview = false;
        await c.save();
        linkedCounts.complaints++;
      } else {
        c.needsProjectReview = true;
        c.projectReviewNote = 'Complaint record lacks verifiable project association; requires HR Admin review.';
        await c.save();
        flaggedForReview.complaints++;
      }
    }

    // 6. Evidence-based EventRecord migration
    const orphanEvents = await EventRecord.find({
      $or: [{ projectId: { $exists: false } }, { projectId: null }],
      isDeleted: { $ne: true },
    });
    for (const ev of orphanEvents) {
      const matched = matchProjectByEvidence([ev.projectName, ev.eventId, ev.implementingOrg], allProjects);
      if (matched) {
        ev.projectId = matched._id;
        ev.projectName = matched.name;
        ev.needsProjectReview = false;
        await ev.save();
        linkedCounts.events++;
      } else {
        ev.needsProjectReview = true;
        ev.projectReviewNote = 'Event record lacks verifiable project association; requires HR Admin review.';
        await ev.save();
        flaggedForReview.events++;
      }
    }

    // 7. Evidence-based Beneficiary migration
    const orphanBeneficiaries = await Beneficiary.find({
      $or: [{ projectId: { $exists: false } }, { projectId: null }],
    });
    for (const ben of orphanBeneficiaries) {
      const matched = matchProjectByEvidence([ben.projectName, ben.beneficiaryId, ben.forumName], allProjects);
      if (matched) {
        ben.projectId = matched._id;
        ben.projectName = matched.name;
        ben.needsProjectReview = false;
        await ben.save();
        linkedCounts.beneficiaries++;
      } else {
        ben.needsProjectReview = true;
        ben.projectReviewNote = 'Beneficiary record lacks verifiable project association; requires HR Admin review.';
        await ben.save();
        flaggedForReview.beneficiaries++;
      }
    }

    // 8. Non-duplicative Asset Assignment initialization from existing `projectDonor` evidence
    const assetsWithoutStructuredAssignment = await Asset.find({
      isDeleted: { $ne: true },
      'currentAssignment.projectId': { $in: [null, undefined] },
      projectDonor: { $nin: ['Core', 'CORE', '', null] },
    });

    for (const asset of assetsWithoutStructuredAssignment) {
      const matchedProj = matchProjectByEvidence([asset.projectDonor], allProjects);
      if (matchedProj && validProjectIds.has(String(matchedProj._id))) {
        asset.currentAssignment = {
          assignmentType: 'PROJECT',
          projectId: matchedProj._id,
          projectCode: matchedProj.code || '',
          projectName: matchedProj.name,
          department: '',
          location: asset.location || matchedProj.location || 'Head Office',
          custodianEmployeeId: null,
          custodianName: asset.custodian || 'Unassigned',
          assignedDate: asset.createdAt || new Date(),
          expectedReturnDate: null,
          notes: `Initialized from existing asset projectDonor ("${asset.projectDonor}") during migration`,
        };
        await asset.save();

        const existingAsg = await AssetAssignment.findOne({ assetRef: asset._id, status: 'ACTIVE' }).lean();
        if (!existingAsg) {
          await AssetAssignment.create({
            assetRef: asset._id,
            assetId: asset.assetId,
            assignmentType: 'PROJECT',
            projectId: matchedProj._id,
            projectCode: matchedProj.code || '',
            projectName: matchedProj.name,
            location: asset.location || 'Head Office',
            custodianName: asset.custodian || 'Unassigned',
            assignedDate: asset.createdAt || new Date(),
            conditionAtAssignment: asset.condition || 'Good',
            status: 'ACTIVE',
            notes: `Migrated from source projectDonor "${asset.projectDonor}"`,
          });
        }
        linkedCounts.assetAssignments++;
      }
    }

    // 9. Verification Summary
    const stats = {
      projects: allProjects.length,
      linkedCounts,
      flaggedForReview,
      pendingReviewTotals: {
        risks: await RiskRecord.countDocuments({ needsProjectReview: true }),
        complaints: await ComplaintRecord.countDocuments({ needsProjectReview: true, isDeleted: { $ne: true } }),
        events: await EventRecord.countDocuments({ needsProjectReview: true, isDeleted: { $ne: true } }),
        beneficiaries: await Beneficiary.countDocuments({ needsProjectReview: true }),
      },
      risksByProject: await RiskRecord.aggregate([{ $group: { _id: '$projectId', count: { $sum: 1 } } }]),
      complaintsByProject: await ComplaintRecord.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: '$projectId', count: { $sum: 1 } } },
      ]),
      eventsByProject: await EventRecord.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: '$projectId', count: { $sum: 1 } } },
      ]),
      beneficiariesByProject: await Beneficiary.aggregate([{ $group: { _id: '$projectId', count: { $sum: 1 } } }]),
    };

    console.log('[ProjectMigration] Migration completed safely. Linked:', linkedCounts, 'Flagged:', flaggedForReview);

    return {
      success: true,
      message: 'Evidence-based project migration completed safely',
      stats,
    };
  } catch (error) {
    console.error('[ProjectMigration] Error during migration:', error);
    throw error;
  }
};

// If run directly via node command line
if (process.argv[1]?.endsWith('projectMigration.js')) {
  connectDB()
    .then(async () => {
      await runProjectMigration();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[ProjectMigration] Failed:', err);
      process.exit(1);
    });
}
