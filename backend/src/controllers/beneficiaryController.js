import Beneficiary from '../models/Beneficiary.js';
import XLSX from 'xlsx';

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

    const query = {};

    // Global Search across primary fields
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

    // Administrative Location Filters
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

    // Source & Forum Filters
    if (forumName && forumName !== 'ALL') {
      query.forumName = forumName.trim();
    }
    if (projectName && projectName !== 'ALL') {
      query.projectName = projectName.trim();
    }

    // Demographic & Vulnerability Filters
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

    // Sorting
    const sortField = sortBy || 'sl';
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sortObj = {};
    sortObj[sortField] = sortDirection;
    // Secondary sort for stability
    if (sortField !== '_id') {
      sortObj._id = 1;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

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

    const filter = {};
    if (division && division !== 'ALL') {
      filter.division = new RegExp(`^${division.trim()}$`, 'i');
    }
    if (district && district !== 'ALL') {
      filter.district = new RegExp(`^${district.trim()}$`, 'i');
    }
    if (upazila && upazila !== 'ALL') {
      const upaRegex = normalizeLocationRegex(upazila);
      if (upaRegex) filter.upazila = upaRegex;
    }
    if (union && union !== 'ALL') {
      const unionRegex = normalizeLocationRegex(union);
      if (unionRegex) filter.union = unionRegex;
    }
    if (forumName && forumName !== 'ALL') {
      filter.forumName = forumName.trim();
    }
    if (projectName && projectName !== 'ALL') {
      filter.projectName = projectName.trim();
    }

    // Aggregate key indicators
    const allMatching = await Beneficiary.find(filter).lean();
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
      // Forum
      const fName = b.forumName || 'Unspecified';
      byForum[fName] = (byForum[fName] || 0) + 1;

      // Project
      const pName = b.projectName || 'NAGORIC Project';
      byProject[pName] = (byProject[pName] || 0) + 1;

      // Locations
      if (b.division) byDivision[b.division] = (byDivision[b.division] || 0) + 1;
      if (b.district) byDistrict[b.district] = (byDistrict[b.district] || 0) + 1;
      if (b.upazila) byUpazila[b.upazila] = (byUpazila[b.upazila] || 0) + 1;
      if (b.union) byUnion[b.union] = (byUnion[b.union] || 0) + 1;

      // Gender
      if (b.sex && bySex[b.sex] !== undefined) {
        bySex[b.sex] += 1;
      } else if (b.sex) {
        bySex.Other += 1;
      }

      // Vulnerabilities
      if (b.disability === 'Yes') disabilityCount += 1;
      if (b.adibashi === 'Yes') adibashiCount += 1;
      if (b.dalit === 'Yes') dalitCount += 1;
      if (b.crossForumMember) crossForumCount += 1;

      // Age brackets
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

      // Occupation
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
 * 3. Get Single Beneficiary by ID with audit trail and cross-forum sibling records
 */
export const getBeneficiaryById = async (req, res) => {
  try {
    const { id } = req.params;
    const beneficiary = await Beneficiary.findById(id).lean();

    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }

    // If multi-forum member, retrieve sibling records sharing the same contact number
    let siblingRecords = [];
    if (beneficiary.contactNo) {
      siblingRecords = await Beneficiary.find({
        contactNo: beneficiary.contactNo,
        _id: { $ne: beneficiary._id },
      })
        .select('beneficiaryId name forumName union village sl')
        .lean();
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

    // Clean phone number
    let cleanContact = contactNo ? contactNo.trim() : '';
    if (cleanContact && !cleanContact.startsWith('0') && cleanContact.length === 10) {
      cleanContact = '0' + cleanContact;
    }

    // Check duplicate in same forum
    if (cleanContact) {
      const existingInForum = await Beneficiary.findOne({
        forumName: forumName.trim(),
        contactNo: cleanContact,
      });
      if (existingInForum) {
        return res.status(409).json({
          success: false,
          message: `A beneficiary with contact number "${cleanContact}" already exists in ${forumName} (${existingInForum.name}).`,
        });
      }
    }

    // Calculate Serial Number if not provided
    let finalSl = sl;
    if (!finalSl) {
      const countInForum = await Beneficiary.countDocuments({ forumName: forumName.trim() });
      finalSl = countInForum + 1;
    }

    // Generate unique beneficiary ID
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

    const countTotal = await Beneficiary.countDocuments();
    const beneficiaryId = `${prefix}-${String(finalSl || countTotal + 1).padStart(4, '0')}`;

    // Cross-forum detection
    let crossForumMember = false;
    let linkedForums = [forumName.trim()];
    if (cleanContact) {
      const existingInOtherForums = await Beneficiary.find({ contactNo: cleanContact });
      if (existingInOtherForums.length > 0) {
        crossForumMember = true;
        const otherForums = existingInOtherForums.map((b) => b.forumName);
        linkedForums = Array.from(new Set([...linkedForums, ...otherForums]));

        // Update the sibling records as well
        await Beneficiary.updateMany(
          { contactNo: cleanContact },
          { $set: { crossForumMember: true, linkedForums } }
        );
      }
    }

    const beneficiary = new Beneficiary({
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
      auditTrail: [
        {
          action: 'CREATED',
          performedBy: req.user?.name || 'Authorized Personnel',
          userEmail: req.user?.email || '',
          role: req.user?.role || 'HR_ADMIN',
          details: `Beneficiary created manually under ${forumName}`,
        },
      ],
    });

    await beneficiary.save();

    res.status(201).json({
      success: true,
      message: 'Beneficiary record created successfully',
      data: beneficiary,
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
    const beneficiary = await Beneficiary.findById(id);

    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }

    const updatableFields = [
      'name',
      'sex',
      'motherName',
      'age',
      'occupation',
      'contactNo',
      'alternativeContactNo',
      'projectName',
      'csoName',
      'category',
      'forumName',
      'forumType',
      'groupNameCode',
      'division',
      'district',
      'upazila',
      'union',
      'village',
      'detailAddress',
      'adibashi',
      'dalit',
      'disability',
      'remarks',
      'status',
      'sl',
    ];

    const changedFields = [];
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined && req.body[field] !== beneficiary[field]) {
        changedFields.push(field);
        beneficiary[field] = req.body[field];
      }
    });

    // Clean phone number if changed
    if (beneficiary.contactNo && !beneficiary.contactNo.startsWith('0') && beneficiary.contactNo.length === 10) {
      beneficiary.contactNo = '0' + beneficiary.contactNo;
    }

    // Check cross-forum membership status on phone update
    if (changedFields.includes('contactNo') && beneficiary.contactNo) {
      const siblings = await Beneficiary.find({
        contactNo: beneficiary.contactNo,
        _id: { $ne: beneficiary._id },
      });
      if (siblings.length > 0) {
        beneficiary.crossForumMember = true;
        beneficiary.linkedForums = Array.from(
          new Set([beneficiary.forumName, ...siblings.map((s) => s.forumName)])
        );
      }
    }

    beneficiary.auditTrail.push({
      action: 'UPDATED',
      performedBy: req.user?.name || 'Authorized Personnel',
      userEmail: req.user?.email || '',
      role: req.user?.role || 'HR_ADMIN',
      details: `Updated fields: ${changedFields.join(', ')}`,
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
    const beneficiary = await Beneficiary.findById(id);

    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }

    await Beneficiary.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `Beneficiary "${beneficiary.name}" (${beneficiary.beneficiaryId}) permanently deleted.`,
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
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { contactNo: searchRegex }, { village: searchRegex }];
    }

    const beneficiaries = await Beneficiary.find(query).sort({ sl: 1, createdAt: 1 }).lean();

    // Map to official 18 source column format
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

    const summary = {
      totalReceived: records.length,
      importedCount: 0,
      skippedCount: 0,
      updatedCount: 0,
      errors: [],
    };

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

      // Check existing record
      const existing = contactNo
        ? await Beneficiary.findOne({ forumName: forum, contactNo })
        : null;

      if (existing) {
        if (overwriteDuplicates) {
          existing.name = name;
          existing.motherName = (rec["Mother's Name"] || rec.motherName || existing.motherName).trim();
          existing.occupation = (rec['Occupation'] || rec.occupation || existing.occupation).trim();
          existing.detailAddress = (rec['Detail Address'] || rec.detailAddress || existing.detailAddress).trim();
          existing.village = (rec['Village/Institution'] || rec.village || existing.village).trim();
          existing.auditTrail.push({
            action: 'BATCH_IMPORTED',
            performedBy: req.user?.name || 'Importer',
            userEmail: req.user?.email || '',
            role: req.user?.role || 'HR_ADMIN',
            details: 'Overwritten during batch import',
          });
          await existing.save();
          summary.updatedCount++;
        } else {
          summary.skippedCount++;
        }
        continue;
      }

      const sl = parseInt(rec['Sl No.'] || rec.sl || i + 1, 10);
      const prefix = forum.toLowerCase().includes('amtoli') ? 'BEN-NAG-AMT' : (forum.toLowerCase().includes('arpangasia') ? 'BEN-NAG-ARP' : 'BEN-NAG-UPZ');
      const beneficiaryId = `${prefix}-${String(sl).padStart(4, '0')}-${Date.now().toString().slice(-4)}`;

      const newDoc = new Beneficiary({
        beneficiaryId,
        sl,
        name,
        sex: ['Male', 'Female', 'Transgender'].includes(rec['Sex (Female/Male/Transgender)'] || rec.sex)
          ? rec['Sex (Female/Male/Transgender)'] || rec.sex
          : 'Female',
        motherName: (rec["Mother's Name"] || rec.motherName || '').trim(),
        contactNo,
        alternativeContactNo: String(rec['Contract Number (Alternative)'] || rec.alternativeContactNo || '').trim(),
        age: rec.Age || rec.age ? parseInt(rec.Age || rec.age, 10) : undefined,
        occupation: (rec.Occupation || rec.occupation || '').trim(),
        division: (rec.Division || rec.division || 'Barishal').trim(),
        district: (rec.District || rec.district || 'Barguna').trim(),
        upazila: (rec.Upazila || rec.upazila || 'Amtoli').trim(),
        union: union || 'Amtoli Sadar',
        village: (rec['Village/Institution'] || rec.village || '').trim(),
        detailAddress: (rec['Detail Address'] || rec.detailAddress || '').trim(),
        adibashi: (rec.Adibashi || rec.adibashi || '').toLowerCase() === 'yes' ? 'Yes' : 'No',
        dalit: (rec['Dalit '] || rec.dalit || '').toLowerCase() === 'yes' ? 'Yes' : 'No',
        disability: (rec['Persons with Disability \nYes/No/'] || rec.disability || '').toLowerCase() === 'yes' ? 'Yes' : 'No',
        remarks: (rec.Remarks || rec.remarks || '').trim(),
        forumName: forum,
        projectName: (rec['Project Name'] || rec.projectName || 'NAGORIC Project').trim(),
        csoName: 'Community Based Development Project (CBDP)',
        auditTrail: [
          {
            action: 'BATCH_IMPORTED',
            performedBy: req.user?.name || 'Spreadsheet Importer',
            userEmail: req.user?.email || '',
            role: req.user?.role || 'HR_ADMIN',
            details: `Imported via spreadsheet batch import into ${forum}`,
          },
        ],
      });

      await newDoc.save();
      summary.importedCount++;
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
