import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Beneficiary from '../models/Beneficiary.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get fallback in-memory records
const getFallbackRecords = () => {
  if (!mockData.beneficiaries || mockData.beneficiaries.length === 0) {
    try {
      const jsonPath = path.join(__dirname, '../data/officialBeneficiaries.json');
      if (fs.existsSync(jsonPath)) {
        const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        mockData.beneficiaries = raw.map((b, idx) => ({
          ...b,
          _id: b._id || `mock-ben-${idx + 1}`,
          createdAt: b.createdAt || new Date().toISOString(),
          updatedAt: b.updatedAt || new Date().toISOString(),
        }));
      }
    } catch (e) {
      console.warn('[BeneficiaryController] Fallback JSON read error:', e.message);
      mockData.beneficiaries = [];
    }
  }
  return mockData.beneficiaries || [];
};

/**
 * Normalizes Upazila and Union names to handle common Bengali/English transliteration differences
 */
const normalizeLocationRegex = (str) => {
  if (!str || str === 'ALL') return null;
  const clean = str.trim();
  if (/^amt[ao]li$/i.test(clean)) {
    return /^amt[ao]li$/i;
  }
  if (/^arpangas[h]?ia$/i.test(clean)) {
    return /^arpangas[h]?ia$/i;
  }
  return new RegExp(`^${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
};

const matchesLocation = (itemVal, filterVal) => {
  if (!filterVal || filterVal === 'ALL') return true;
  if (!itemVal) return false;
  const itemClean = String(itemVal).trim().toLowerCase();
  const filterClean = String(filterVal).trim().toLowerCase();
  if (filterClean === 'amtoli' || filterClean === 'amtali') {
    return itemClean === 'amtoli' || itemClean === 'amtali';
  }
  if (filterClean.includes('arpangasia') || filterClean.includes('arpangashia')) {
    return itemClean.includes('arpangasia') || itemClean.includes('arpangashia');
  }
  return itemClean === filterClean || itemClean.includes(filterClean);
};

/**
 * 1. Get Beneficiaries with filtering, searching, sorting, and pagination
 */
export const getBeneficiaries = async (req, res) => {
  try {
    const {
      search,
      division,
      district,
      upazila,
      union,
      forumName,
      projectName,
      sex,
      disability,
      adibashi,
      dalit,
      crossForumOnly,
      occupation,
      sortBy = 'sl',
      sortOrder = 'asc',
      page = 1,
      limit = 25,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const isDbConnected = !isDemoMode() && mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      // Memory / Serverless fallback
      let records = getFallbackRecords().slice();

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        records = records.filter(
          (b) =>
            (b.name && b.name.toLowerCase().includes(q)) ||
            (b.contactNo && b.contactNo.includes(q)) ||
            (b.motherName && b.motherName.toLowerCase().includes(q)) ||
            (b.village && b.village.toLowerCase().includes(q)) ||
            (b.detailAddress && b.detailAddress.toLowerCase().includes(q)) ||
            (b.occupation && b.occupation.toLowerCase().includes(q)) ||
            (b.beneficiaryId && b.beneficiaryId.toLowerCase().includes(q))
        );
      }

      if (division && division !== 'ALL') {
        records = records.filter((b) => matchesLocation(b.division, division));
      }
      if (district && district !== 'ALL') {
        records = records.filter((b) => matchesLocation(b.district, district));
      }
      if (upazila && upazila !== 'ALL') {
        records = records.filter((b) => matchesLocation(b.upazila, upazila));
      }
      if (union && union !== 'ALL') {
        records = records.filter((b) => matchesLocation(b.union, union));
      }
      if (forumName && forumName !== 'ALL') {
        records = records.filter((b) => b.forumName === forumName);
      }
      if (projectName && projectName !== 'ALL') {
        records = records.filter((b) => b.projectName === projectName);
      }
      if (sex && sex !== 'ALL') {
        records = records.filter((b) => b.sex === sex);
      }
      if (disability && disability !== 'ALL') {
        records = records.filter((b) => b.disability === disability);
      }
      if (adibashi && adibashi !== 'ALL') {
        records = records.filter((b) => b.adibashi === adibashi);
      }
      if (dalit && dalit !== 'ALL') {
        records = records.filter((b) => b.dalit === dalit);
      }
      if (crossForumOnly === 'true') {
        records = records.filter((b) => b.crossForumMember === true);
      }

      // Sort
      records.sort((a, b) => {
        const valA = a[sortBy] ?? '';
        const valB = b[sortBy] ?? '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'desc' ? valB - valA : valA - valB;
        }
        return sortOrder === 'desc'
          ? String(valB).localeCompare(String(valA))
          : String(valA).localeCompare(String(valB));
      });

      const total = records.length;
      const totalPages = Math.ceil(total / limitNum) || 1;
      const pageData = records.slice(skip, skip + limitNum);

      return res.json({
        success: true,
        count: pageData.length,
        total,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        data: pageData,
        isDemoFallback: true,
      });
    }

    // MongoDB Connected Mode
    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: searchRegex },
        { beneficiaryId: searchRegex },
        { contactNo: searchRegex },
        { motherName: searchRegex },
        { village: searchRegex },
        { detailAddress: searchRegex },
        { occupation: searchRegex },
        { groupNameCode: searchRegex },
      ];
    }

    if (division && division !== 'ALL') {
      query.division = new RegExp(`^${division.trim()}$`, 'i');
    }
    if (district && district !== 'ALL') {
      query.district = new RegExp(`^${district.trim()}$`, 'i');
    }
    if (upazila && upazila !== 'ALL') {
      const upaRegex = normalizeLocationRegex(upazila);
      if (upaRegex) query.upazila = upaRegex;
    }
    if (union && union !== 'ALL') {
      const unionRegex = normalizeLocationRegex(union);
      if (unionRegex) query.union = unionRegex;
    }

    if (forumName && forumName !== 'ALL') {
      query.forumName = forumName.trim();
    }
    if (projectName && projectName !== 'ALL') {
      query.projectName = projectName.trim();
    }
    if (sex && sex !== 'ALL') {
      query.sex = sex;
    }
    if (disability && disability !== 'ALL') {
      query.disability = disability;
    }
    if (adibashi && adibashi !== 'ALL') {
      query.adibashi = adibashi;
    }
    if (dalit && dalit !== 'ALL') {
      query.dalit = dalit;
    }
    if (occupation && occupation !== 'ALL') {
      query.occupation = new RegExp(`^${occupation.trim()}$`, 'i');
    }
    if (crossForumOnly === 'true') {
      query.crossForumMember = true;
    }

    const sortField = sortBy || 'sl';
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sortObj = {};
    sortObj[sortField] = sortDirection;
    if (sortField !== '_id') sortObj._id = 1;

    const [total, beneficiaries] = await Promise.all([
      Beneficiary.countDocuments(query),
      Beneficiary.find(query).sort(sortObj).skip(skip).limit(limitNum).lean(),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.json({
      success: true,
      count: beneficiaries.length,
      total,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
      data: beneficiaries,
    });
  } catch (error) {
    console.error('[BeneficiaryController] getBeneficiaries error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2. Get Dynamic Dashboard Summary Statistics
 */
export const getBeneficiaryStats = async (req, res) => {
  try {
    const { division, district, upazila, union, forumName, projectName } = req.query;

    const isDbConnected = !isDemoMode() && mongoose.connection.readyState === 1;

    let allMatching = [];

    if (!isDbConnected) {
      allMatching = getFallbackRecords().slice();
      if (division && division !== 'ALL') {
        allMatching = allMatching.filter((b) => matchesLocation(b.division, division));
      }
      if (district && district !== 'ALL') {
        allMatching = allMatching.filter((b) => matchesLocation(b.district, district));
      }
      if (upazila && upazila !== 'ALL') {
        allMatching = allMatching.filter((b) => matchesLocation(b.upazila, upazila));
      }
      if (union && union !== 'ALL') {
        allMatching = allMatching.filter((b) => matchesLocation(b.union, union));
      }
      if (forumName && forumName !== 'ALL') {
        allMatching = allMatching.filter((b) => b.forumName === forumName);
      }
      if (projectName && projectName !== 'ALL') {
        allMatching = allMatching.filter((b) => b.projectName === projectName);
      }
    } else {
      const filter = {};
      if (division && division !== 'ALL') filter.division = new RegExp(`^${division.trim()}$`, 'i');
      if (district && district !== 'ALL') filter.district = new RegExp(`^${district.trim()}$`, 'i');
      if (upazila && upazila !== 'ALL') {
        const upaRegex = normalizeLocationRegex(upazila);
        if (upaRegex) filter.upazila = upaRegex;
      }
      if (union && union !== 'ALL') {
        const unionRegex = normalizeLocationRegex(union);
        if (unionRegex) filter.union = unionRegex;
      }
      if (forumName && forumName !== 'ALL') filter.forumName = forumName.trim();
      if (projectName && projectName !== 'ALL') filter.projectName = projectName.trim();

      allMatching = await Beneficiary.find(filter).lean();
    }

    const totalBeneficiaries = allMatching.length;

    const byForum = {};
    const byProject = {};
    const byDivision = {};
    const byDistrict = {};
    const byUpazila = {};
    const byUnion = {};
    const bySex = { Male: 0, Female: 0, Transgender: 0, Other: 0 };
    const byOccupation = {};
    let disabilityCount = 0;
    let adibashiCount = 0;
    let dalitCount = 0;
    let crossForumCount = 0;

    let ageGroups = {
      under18: 0,
      age18to35: 0,
      age36to50: 0,
      over50: 0,
      unspecified: 0,
    };

    allMatching.forEach((b) => {
      const fName = b.forumName || 'Unspecified';
      byForum[fName] = (byForum[fName] || 0) + 1;

      const pName = b.projectName || 'NAGORIC Project';
      byProject[pName] = (byProject[pName] || 0) + 1;

      if (b.division) byDivision[b.division] = (byDivision[b.division] || 0) + 1;
      if (b.district) byDistrict[b.district] = (byDistrict[b.district] || 0) + 1;
      if (b.upazila) byUpazila[b.upazila] = (byUpazila[b.upazila] || 0) + 1;
      if (b.union) byUnion[b.union] = (byUnion[b.union] || 0) + 1;

      if (b.sex && bySex[b.sex] !== undefined) {
        bySex[b.sex] += 1;
      } else if (b.sex) {
        bySex.Other += 1;
      }

      if (b.disability === 'Yes') disabilityCount += 1;
      if (b.adibashi === 'Yes') adibashiCount += 1;
      if (b.dalit === 'Yes') dalitCount += 1;
      if (b.crossForumMember) crossForumCount += 1;

      if (!b.age) {
        ageGroups.unspecified += 1;
      } else if (b.age < 18) {
        ageGroups.under18 += 1;
      } else if (b.age <= 35) {
        ageGroups.age18to35 += 1;
      } else if (b.age <= 50) {
        ageGroups.age36to50 += 1;
      } else {
        ageGroups.over50 += 1;
      }

      if (b.occupation) {
        const occ = b.occupation.trim();
        byOccupation[occ] = (byOccupation[occ] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: {
        totalBeneficiaries,
        byForum,
        byProject,
        byDivision,
        byDistrict,
        byUpazila,
        byUnion,
        bySex,
        vulnerabilities: {
          disabilityCount,
          adibashiCount,
          dalitCount,
          crossForumCount,
        },
        ageGroups,
        topOccupations: Object.entries(byOccupation)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, count]) => ({ name, count })),
      },
    });
  } catch (error) {
    console.error('[BeneficiaryController] getBeneficiaryStats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. Get Single Beneficiary by ID
 */
export const getBeneficiaryById = async (req, res) => {
  try {
    const { id } = req.params;
    const isDbConnected = !isDemoMode() && mongoose.connection.readyState === 1;

    let beneficiary = null;
    let siblingRecords = [];

    if (!isDbConnected) {
      beneficiary = getFallbackRecords().find(
        (b) => String(b._id) === String(id) || b.beneficiaryId === id
      );
      if (!beneficiary) {
        return res.status(404).json({ success: false, message: 'Beneficiary not found' });
      }
      if (beneficiary.contactNo) {
        siblingRecords = getFallbackRecords().filter(
          (b) => b.contactNo === beneficiary.contactNo && String(b._id) !== String(beneficiary._id)
        );
      }
    } else {
      beneficiary = await Beneficiary.findById(id).lean();
      if (!beneficiary) {
        return res.status(404).json({ success: false, message: 'Beneficiary not found' });
      }
      if (beneficiary.contactNo) {
        siblingRecords = await Beneficiary.find({
          contactNo: beneficiary.contactNo,
          _id: { $ne: beneficiary._id },
        })
          .select('beneficiaryId name forumName union village sl')
          .lean();
      }
    }

    res.json({
      success: true,
      data: {
        ...beneficiary,
        siblingRecords,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. Create Single Beneficiary
 */
export const createBeneficiary = async (req, res) => {
  try {
    const {
      name,
      sex,
      forumName,
      forumType = 'UNION_FORUM',
      projectName = 'NAGORIC Project',
      csoName = 'Community Based Development Project (CBDP)',
      category = 'Direct Beneficiary Information',
      groupNameCode = '',
      motherName = '',
      contactNo = '',
      alternativeContactNo = '',
      age,
      occupation = '',
      division = 'Barishal',
      district = 'Barguna',
      upazila = 'Amtoli',
      union,
      village = '',
      detailAddress = '',
      adibashi = 'No',
      dalit = 'No',
      disability = 'No',
      remarks = '',
      sl,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Beneficiary Name is required' });
    }
    if (!forumName || !forumName.trim()) {
      return res.status(400).json({ success: false, message: 'Forum Name is required' });
    }
    if (!union || !union.trim()) {
      return res.status(400).json({ success: false, message: 'Union is required' });
    }

    let cleanContact = contactNo ? contactNo.trim() : '';
    if (cleanContact && !cleanContact.startsWith('0') && cleanContact.length === 10) {
      cleanContact = '0' + cleanContact;
    }

    const isDbConnected = !isDemoMode() && mongoose.connection.readyState === 1;

    let finalSl = sl;
    if (!finalSl) {
      finalSl = isDbConnected
        ? (await Beneficiary.countDocuments({ forumName: forumName.trim() })) + 1
        : getFallbackRecords().filter((b) => b.forumName === forumName.trim()).length + 1;
    }

    let prefix = 'BEN';
    if (forumName.toLowerCase().includes('upazilla') || forumName.toLowerCase().includes('upazila')) {
      prefix = 'BEN-NAG-UPZ';
    } else if (forumName.toLowerCase().includes('amtoli') || forumName.toLowerCase().includes('amtali')) {
      prefix = 'BEN-NAG-AMT';
    } else if (forumName.toLowerCase().includes('arpangasia')) {
      prefix = 'BEN-NAG-ARP';
    } else {
      prefix = `BEN-${new Date().getFullYear()}`;
    }

    const beneficiaryId = `${prefix}-${String(finalSl).padStart(4, '0')}`;

    let crossForumMember = false;
    let linkedForums = [forumName.trim()];

    const newObj = {
      _id: isDbConnected ? undefined : `mock-ben-${Date.now()}`,
      beneficiaryId,
      sl: finalSl,
      name: name.trim(),
      sex: sex || 'Female',
      motherName: motherName.trim(),
      age: age ? parseInt(age, 10) : undefined,
      occupation: occupation.trim(),
      contactNo: cleanContact,
      alternativeContactNo: alternativeContactNo.trim(),
      projectName: projectName.trim(),
      csoName: csoName.trim(),
      category: category.trim(),
      forumName: forumName.trim(),
      forumType,
      groupNameCode: groupNameCode.trim(),
      division: division.trim(),
      district: district.trim(),
      upazila: upazila.trim(),
      union: union.trim(),
      village: village.trim(),
      detailAddress: detailAddress.trim(),
      adibashi: adibashi === 'Yes' ? 'Yes' : 'No',
      dalit: dalit === 'Yes' ? 'Yes' : 'No',
      disability: disability === 'Yes' ? 'Yes' : 'No',
      remarks: remarks.trim(),
      crossForumMember,
      linkedForums,
      status: 'ACTIVE',
      isVerified: true,
      auditTrail: [
        {
          action: 'CREATED',
          performedBy: req.user?.name || 'Authorized Personnel',
          userEmail: req.user?.email || '',
          role: req.user?.role || 'HR_ADMIN',
          details: `Beneficiary created manually under ${forumName}`,
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!isDbConnected) {
      mockData.beneficiaries = mockData.beneficiaries || getFallbackRecords();
      mockData.beneficiaries.unshift(newObj);
      return res.status(201).json({
        success: true,
        message: 'Beneficiary record created successfully (Demo Store)',
        data: newObj,
      });
    }

    const doc = new Beneficiary(newObj);
    await doc.save();

    res.status(201).json({
      success: true,
      message: 'Beneficiary record created successfully',
      data: doc,
    });
  } catch (error) {
    console.error('[BeneficiaryController] createBeneficiary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 5. Update Existing Beneficiary
 */
export const updateBeneficiary = async (req, res) => {
  try {
    const { id } = req.params;
    const isDbConnected = !isDemoMode() && mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const records = getFallbackRecords();
      const idx = records.findIndex((b) => String(b._id) === String(id) || b.beneficiaryId === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Beneficiary not found' });
      }
      records[idx] = { ...records[idx], ...req.body, updatedAt: new Date() };
      return res.json({
        success: true,
        message: 'Beneficiary updated successfully (Demo Store)',
        data: records[idx],
      });
    }

    const beneficiary = await Beneficiary.findById(id);
    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }

    Object.keys(req.body).forEach((k) => {
      if (req.body[k] !== undefined && k !== '_id' && k !== 'beneficiaryId') {
        beneficiary[k] = req.body[k];
      }
    });

    beneficiary.auditTrail.push({
      action: 'UPDATED',
      performedBy: req.user?.name || 'Authorized Personnel',
      userEmail: req.user?.email || '',
      role: req.user?.role || 'HR_ADMIN',
      details: 'Beneficiary profile updated',
    });

    await beneficiary.save();

    res.json({
      success: true,
      message: 'Beneficiary updated successfully',
      data: beneficiary,
    });
  } catch (error) {
    console.error('[BeneficiaryController] updateBeneficiary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 6. Delete Beneficiary
 */
export const deleteBeneficiary = async (req, res) => {
  try {
    const { id } = req.params;
    const isDbConnected = !isDemoMode() && mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      mockData.beneficiaries = getFallbackRecords().filter(
        (b) => String(b._id) !== String(id) && b.beneficiaryId !== id
      );
      return res.json({
        success: true,
        message: 'Beneficiary permanently deleted (Demo Store).',
      });
    }

    const beneficiary = await Beneficiary.findById(id);
    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }

    await Beneficiary.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `Beneficiary "${beneficiary.name}" permanently deleted.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 7. Export Beneficiaries matching official spreadsheet headers
 */
export const exportBeneficiaries = async (req, res) => {
  try {
    const { forumName, division, district, upazila, union, search, format = 'json' } = req.query;
    const isDbConnected = !isDemoMode() && mongoose.connection.readyState === 1;

    let beneficiaries = [];

    if (!isDbConnected) {
      beneficiaries = getFallbackRecords().slice();
      if (forumName && forumName !== 'ALL') beneficiaries = beneficiaries.filter((b) => b.forumName === forumName);
      if (division && division !== 'ALL') beneficiaries = beneficiaries.filter((b) => matchesLocation(b.division, division));
      if (district && district !== 'ALL') beneficiaries = beneficiaries.filter((b) => matchesLocation(b.district, district));
      if (upazila && upazila !== 'ALL') beneficiaries = beneficiaries.filter((b) => matchesLocation(b.upazila, upazila));
      if (union && union !== 'ALL') beneficiaries = beneficiaries.filter((b) => matchesLocation(b.union, union));
    } else {
      const query = {};
      if (forumName && forumName !== 'ALL') query.forumName = forumName;
      if (division && division !== 'ALL') query.division = new RegExp(`^${division.trim()}$`, 'i');
      if (district && district !== 'ALL') query.district = new RegExp(`^${district.trim()}$`, 'i');
      if (upazila && upazila !== 'ALL') {
        const upaRegex = normalizeLocationRegex(upazila);
        if (upaRegex) query.upazila = upaRegex;
      }
      if (union && union !== 'ALL') {
        const unionRegex = normalizeLocationRegex(union);
        if (unionRegex) query.union = unionRegex;
      }
      beneficiaries = await Beneficiary.find(query).sort({ sl: 1 }).lean();
    }

    const rows = beneficiaries.map((b, idx) => ({
      'Sl No.': b.sl || idx + 1,
      'Beneficiary ID': b.beneficiaryId,
      'District': b.district || 'Barguna',
      'Upazila': b.upazila || 'Amtoli',
      'Union ': b.union || '',
      'Village/Institution': b.village || '',
      'Group Name and Code (If)': b.groupNameCode || '',
      'Name of the Beneficiary/Group Member ': b.name,
      'Sex (Female/Male/Transgender)': b.sex,
      "Mother's Name": b.motherName || '',
      'Contact Number (Self)': b.contactNo || '',
      'Contract Number (Alternative)': b.alternativeContactNo || '',
      'Age': b.age || '',
      'Occupation': b.occupation || '',
      'Detail Address': b.detailAddress || '',
      'Adibashi': b.adibashi || 'No',
      'Dalit ': b.dalit || 'No',
      'Persons with Disability \nYes/No/': b.disability || 'No',
      'Forum Name': b.forumName,
      'Cross Forum Member': b.crossForumMember ? 'Yes' : 'No',
      'Remarks': b.remarks || '',
    }));

    if (format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(rows);
      const csv = XLSX.utils.sheet_to_csv(ws);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="cbdp_beneficiaries.csv"');
      return res.send(csv);
    }

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 8. Batch Import Beneficiary Spreadsheet
 */
export const batchImportBeneficiaries = async (req, res) => {
  try {
    const { records, forumName: targetForum, overwriteDuplicates = false } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'No records provided for import' });
    }

    const isDbConnected = !isDemoMode() && mongoose.connection.readyState === 1;

    const summary = {
      totalReceived: records.length,
      importedCount: 0,
      skippedCount: 0,
      updatedCount: 0,
      errors: [],
    };

    const targetList = isDbConnected ? null : getFallbackRecords();

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const name = (rec['Name of the Beneficiary/Group Member '] || rec.name || '').trim();
      if (!name) {
        summary.errors.push({ row: i + 1, message: 'Missing Beneficiary Name' });
        summary.skippedCount++;
        continue;
      }

      const union = (rec['Union '] || rec.union || '').trim();
      const forum = (targetForum || rec['Forum Name'] || rec.forumName || 'Upazilla Nagoric Forum').trim();

      let contactNo = String(rec['Contact Number (Self)'] || rec.contactNo || '').trim();
      if (contactNo && !contactNo.startsWith('0') && contactNo.length === 10) {
        contactNo = '0' + contactNo;
      }

      if (isDbConnected) {
        const existing = contactNo ? await Beneficiary.findOne({ forumName: forum, contactNo }) : null;
        if (existing) {
          if (overwriteDuplicates) {
            existing.name = name;
            await existing.save();
            summary.updatedCount++;
          } else {
            summary.skippedCount++;
          }
          continue;
        }

        const sl = parseInt(rec['Sl No.'] || rec.sl || i + 1, 10);
        const prefix = forum.toLowerCase().includes('amtoli') ? 'BEN-NAG-AMT' : 'BEN-NAG-UPZ';
        const beneficiaryId = `${prefix}-${String(sl).padStart(4, '0')}-${Date.now().toString().slice(-4)}`;

        const newDoc = new Beneficiary({
          beneficiaryId,
          sl,
          name,
          sex: rec['Sex (Female/Male/Transgender)'] || rec.sex || 'Female',
          contactNo,
          forumName: forum,
          union: union || 'Amtoli Sadar',
        });
        await newDoc.save();
        summary.importedCount++;
      } else {
        targetList.unshift({
          _id: `mock-ben-${Date.now()}-${i}`,
          beneficiaryId: `BEN-IMP-${String(i + 1).padStart(4, '0')}`,
          name,
          forumName: forum,
          union: union || 'Amtoli Sadar',
          contactNo,
          sex: rec.sex || 'Female',
        });
        summary.importedCount++;
      }
    }

    res.json({
      success: true,
      message: `Import completed: ${summary.importedCount} added, ${summary.updatedCount} updated, ${summary.skippedCount} skipped.`,
      summary,
    });
  } catch (error) {
    console.error('[BeneficiaryController] batchImportBeneficiaries error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
