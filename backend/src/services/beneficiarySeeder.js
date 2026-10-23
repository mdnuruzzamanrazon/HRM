import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import Beneficiary from '../models/Beneficiary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const parseOfficialSpreadsheet = (filePath) => {
  if (!fs.existsSync(filePath)) {
    console.warn(`[BeneficiarySeeder] File not found at: ${filePath}`);
    return [];
  }

  const wb = XLSX.readFile(filePath);
  const sheetsConfig = [
    {
      sheetName: 'Upazilla Nagoric Forum ',
      forumName: 'Upazilla Nagoric Forum',
      forumType: 'UPAZILA_FORUM',
      prefix: 'BEN-NAG-UPZ',
      sourceGid: '297583984',
    },
    {
      sheetName: 'Amtoli Sada Union Nagoric Forum',
      forumName: 'Amtoli Sadar Union Nagoric Forum',
      forumType: 'UNION_FORUM',
      prefix: 'BEN-NAG-AMT',
      sourceGid: '998575966',
    },
    {
      sheetName: 'Arpangasia Union Nagoric Forum',
      forumName: 'Arpangasia Union Nagoric Forum',
      forumType: 'UNION_FORUM',
      prefix: 'BEN-NAG-ARP',
      sourceGid: '1628679435',
    },
  ];

  const beneficiaries = [];

  sheetsConfig.forEach((cfg) => {
    let ws = wb.Sheets[cfg.sheetName];
    if (!ws) {
      // Try fuzzy sheet matching if exact string has extra spaces
      const match = wb.SheetNames.find(
        (sn) => sn.trim().toLowerCase() === cfg.sheetName.trim().toLowerCase()
      );
      if (match) ws = wb.Sheets[match];
    }

    if (!ws) {
      console.warn(`[BeneficiarySeeder] Worksheet not found: ${cfg.sheetName}`);
      return;
    }

    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    // Row 5 contains column headers, data starts from index 6
    for (let r = 6; r < rows.length; r++) {
      const row = rows[r];
      if (row && row.some((c) => c !== undefined && c !== null && String(c).trim() !== '')) {
        const sl = row[0] || r - 5;
        const district = String(row[1] || 'Barguna').trim();
        const upazila = String(row[2] || 'Amtoli').trim();
        const union = String(row[3] || '').trim();
        const village = String(row[4] || '').trim();
        const groupNameCode = String(row[5] || '').trim();
        const name = String(row[6] || '').trim();
        if (!name) continue; // Skip header-like empty name rows

        let sex = String(row[7] || '').trim();
        if (!['Male', 'Female', 'Transgender'].includes(sex)) sex = 'Female';

        const motherName = String(row[8] || '').trim();
        let contactNo = row[9] ? String(row[9]).trim() : '';
        if (contactNo && !contactNo.startsWith('0') && contactNo.length === 10) {
          contactNo = '0' + contactNo;
        }

        const alternativeContactNo = row[10] ? String(row[10]).trim() : '';
        const age = row[11] ? parseInt(row[11], 10) : null;
        const occupation = String(row[12] || '').trim();
        const detailAddress = String(row[13] || '').trim();
        const adibashi = row[14] && String(row[14]).trim().toLowerCase() === 'yes' ? 'Yes' : 'No';
        const dalit = row[15] && String(row[15]).trim().toLowerCase() === 'yes' ? 'Yes' : 'No';
        const rawDisability = row[16] ? String(row[16]).trim().toLowerCase() : '';
        const disability = rawDisability === 'yes' || rawDisability === 'y' ? 'Yes' : 'No';
        const remarks = String(row[17] || '').trim();

        const numStr = String(sl).padStart(4, '0');
        const beneficiaryId = `${cfg.prefix}-${numStr}`;

        beneficiaries.push({
          beneficiaryId,
          sl: typeof sl === 'number' ? sl : parseInt(sl, 10),
          projectName: 'NAGORIC Project',
          csoName: 'Community Based Development Project (CBDP)',
          category: 'Direct Beneficiary Information',
          forumName: cfg.forumName,
          forumType: cfg.forumType,
          groupNameCode,
          sourceGid: cfg.sourceGid,
          name,
          sex,
          motherName,
          age,
          occupation,
          contactNo,
          alternativeContactNo,
          division: 'Barishal',
          district,
          upazila,
          union,
          village,
          detailAddress,
          adibashi,
          dalit,
          disability,
          remarks,
          status: 'ACTIVE',
          isVerified: true,
          auditTrail: [
            {
              action: 'IMPORT_SEEDED',
              performedBy: 'System Auto-Seeder',
              userEmail: 'system@cbdp.org',
              role: 'SUPER_ADMIN',
              details: `Imported from official worksheet: ${cfg.forumName} (Row ${r + 1})`,
            },
          ],
        });
      }
    }
  });

  // Cross-link multi-forum members (identifiable by matching contact number or exact name + mother's name)
  const phoneToForums = {};
  beneficiaries.forEach((b) => {
    if (b.contactNo) {
      if (!phoneToForums[b.contactNo]) phoneToForums[b.contactNo] = new Set();
      phoneToForums[b.contactNo].add(b.forumName);
    }
  });

  beneficiaries.forEach((b) => {
    if (b.contactNo && phoneToForums[b.contactNo]?.size > 1) {
      b.crossForumMember = true;
      b.linkedForums = Array.from(phoneToForums[b.contactNo]);
    }
  });

  return beneficiaries;
};

export const seedBeneficiariesIfEmpty = async () => {
  try {
    const count = await Beneficiary.countDocuments();
    if (count > 0) {
      console.log(`[BeneficiarySeeder] Database already contains ${count} beneficiary records.`);
      return { count, seeded: false };
    }

    // Try finding the workbook file in root or relative to project
    const possiblePaths = [
      path.resolve(process.cwd(), 'cbdp_beneficiaries_full.xlsx'),
      path.resolve(__dirname, '../../../cbdp_beneficiaries_full.xlsx'),
      path.resolve(__dirname, '../../cbdp_beneficiaries_full.xlsx'),
    ];

    let records = [];
    const xlsxPath = possiblePaths.find((p) => fs.existsSync(p));
    if (xlsxPath) {
      console.log(`[BeneficiarySeeder] Seeding beneficiaries from ${xlsxPath}...`);
      records = parseOfficialSpreadsheet(xlsxPath);
    } else {
      const jsonPath = path.join(__dirname, '../data/officialBeneficiaries.json');
      if (fs.existsSync(jsonPath)) {
        console.log(`[BeneficiarySeeder] Loading official beneficiaries from JSON fallback: ${jsonPath}`);
        records = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      }
    }

    if (records.length === 0) {
      console.warn('[BeneficiarySeeder] No records found to seed.');
      return { count: 0, seeded: false };
    }

    await Beneficiary.insertMany(records);
    console.log(`[BeneficiarySeeder] Successfully seeded ${records.length} official beneficiary records!`);
    return { count: records.length, seeded: true };
  } catch (err) {
    console.error('[BeneficiarySeeder] Error during seeding:', err.message);
    return { count: 0, error: err.message };
  }
};
