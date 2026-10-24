import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Asset from '../models/Asset.js';
import FieldKitInventory from '../models/FieldKitInventory.js';
import VehicleLog from '../models/VehicleLog.js';
import AssetHandover from '../models/AssetHandover.js';
import AssetWorkflow from '../models/AssetWorkflow.js';
import AssetReference from '../models/AssetReference.js';
import { isDemoMode } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const officialAssetsPath = path.resolve(__dirname, '../data/officialAssets.json');

// In-memory / JSON fallback store
let fallbackStore = null;

const getFallbackData = () => {
  if (!fallbackStore) {
    try {
      if (fs.existsSync(officialAssetsPath)) {
        fallbackStore = JSON.parse(fs.readFileSync(officialAssetsPath, 'utf8'));
      } else {
        fallbackStore = {
          assets: [],
          references: {},
          qrTags: [],
          fieldKits: [],
          consumables: [],
          vehicleLogs: [],
          handovers: [],
          workflows: []
        };
      }
    } catch (err) {
      console.error('[AssetController] Error loading fallback data:', err);
      fallbackStore = { assets: [], references: {}, qrTags: [], fieldKits: [], consumables: [], vehicleLogs: [], handovers: [], workflows: [] };
    }
  }
  return fallbackStore;
};

const saveFallbackData = () => {
  if (fallbackStore) {
    try {
      fs.writeFileSync(officialAssetsPath, JSON.stringify(fallbackStore, null, 2), 'utf8');
    } catch (e) {
      console.error('[AssetController] Error saving fallback data:', e);
    }
  }
};

const isDbActive = () => {
  return !isDemoMode() && mongoose.connection.readyState === 1;
};

// Seed MongoDB if collections are empty
const ensureDbSeeded = async () => {
  if (!isDbActive()) return;
  try {
    const assetCount = await Asset.countDocuments();
    if (assetCount === 0) {
      const data = getFallbackData();
      if (data.assets && data.assets.length > 0) {
        console.log(`[AssetSeeder] Auto-seeding ${data.assets.length} assets to MongoDB...`);
        await Asset.insertMany(data.assets);
      }
      if (data.fieldKits && data.fieldKits.length > 0) {
        await FieldKitInventory.insertMany(data.fieldKits);
      }
      if (data.vehicleLogs && data.vehicleLogs.length > 0) {
        await VehicleLog.insertMany(data.vehicleLogs);
      }
      if (data.workflows && data.workflows.length > 0) {
        await AssetWorkflow.insertMany(data.workflows);
      }
      if (data.handovers && data.handovers.length > 0) {
        await AssetHandover.insertMany(data.handovers);
      }
      if (data.references) {
        await AssetReference.findOneAndUpdate(
          { key: 'default_references' },
          { ...data.references, key: 'default_references' },
          { upsert: true, new: true }
        );
      }
      console.log('[AssetSeeder] MongoDB seeded successfully!');
    }
  } catch (err) {
    console.error('[AssetSeeder] Error checking/seeding DB:', err.message);
  }
};

// 1. Asset Management Dashboard Metrics (Matches Worksheet 1 / GID 1754930862)
export const getAssetDashboard = async (req, res) => {
  try {
    await ensureDbSeeded();
    let assets = [];
    let vehicleLogs = [];
    let workflows = [];
    let fieldKits = [];
    let references = {};

    if (isDbActive()) {
      assets = await Asset.find({ isDeleted: { $ne: true } }).lean();
      vehicleLogs = await VehicleLog.find().lean();
      workflows = await AssetWorkflow.find().lean();
      fieldKits = await FieldKitInventory.find().lean();
      const refDoc = await AssetReference.findOne({ key: 'default_references' }).lean();
      references = refDoc || getFallbackData().references || {};
    } else {
      const fallback = getFallbackData();
      assets = (fallback.assets || []).filter(a => !a.isDeleted);
      vehicleLogs = fallback.vehicleLogs || [];
      workflows = fallback.workflows || [];
      fieldKits = fallback.fieldKits || [];
      references = fallback.references || {};
    }

    const totalAssets = assets.length;
    const activeAssets = assets.filter(a => 
      ['Active', 'In Use', 'ACTIVE', 'IN USE'].includes(String(a.status || '').trim())
    ).length;

    const criticalRiskAssets = assets.filter(a => 
      ['High', 'Critical', 'HIGH', 'CRITICAL'].includes(String(a.riskFlag || '').trim())
    ).length;

    // Overdue audits: nextAuditDue < today
    const todayStr = new Date().toISOString().split('T')[0];
    const auditOverdueCount = assets.filter(a => {
      if (!a.nextAuditDue) return false;
      const due = new Date(a.nextAuditDue);
      return !isNaN(due.getTime()) && due < new Date();
    }).length;

    const totalPurchaseValue = assets.reduce((sum, a) => sum + (Number(a.purchaseCost) || 0), 0);
    const currentBookValue = assets.reduce((sum, a) => sum + (Number(a.currentBookValue) || 0), 0);

    // Calculate vehicle average fuel efficiency (KM/L)
    let avgKmPerLiter = 0;
    const validVehicleLogs = vehicleLogs.filter(v => Number(v.kmPerLiter) > 0);
    if (validVehicleLogs.length > 0) {
      const totalKmL = validVehicleLogs.reduce((sum, v) => sum + Number(v.kmPerLiter), 0);
      avgKmPerLiter = Number((totalKmL / validVehicleLogs.length).toFixed(2));
    }

    const workflowDelayedCount = workflows.filter(w => 
      ['Delayed', 'DELAYED'].includes(String(w.workflowStatus || '').trim())
    ).length;

    // Category breakdown summary table (matching GID 1754930862 table)
    const masterCategories = (references.categories && references.categories.length > 0) 
      ? references.categories 
      : ['IT Equipment', 'Office Furniture', 'Field Equipment', 'Vehicle', 'Safety Equipment', 'Communication', 'Other'];

    const categorySummaries = masterCategories.map(cat => {
      const catAssets = assets.filter(a => String(a.category || '').toLowerCase() === cat.toLowerCase());
      const active = catAssets.filter(a => ['Active', 'In Use'].includes(String(a.status || '').trim())).length;
      const risk = catAssets.filter(a => ['High', 'Critical'].includes(String(a.riskFlag || '').trim())).length;
      const value = catAssets.reduce((sum, a) => sum + (Number(a.currentBookValue) || 0), 0);
      return {
        category: cat,
        total: catAssets.length,
        active,
        risk,
        value,
      };
    });

    // Condition distribution
    const conditionMap = {};
    assets.forEach(a => {
      const cond = a.condition || 'Unspecified';
      conditionMap[cond] = (conditionMap[cond] || 0) + 1;
    });

    // Location distribution
    const locationMap = {};
    assets.forEach(a => {
      const loc = a.location || 'Head Office';
      locationMap[loc] = (locationMap[loc] || 0) + 1;
    });

    // Status distribution
    const statusMap = {};
    assets.forEach(a => {
      const st = a.status || 'Active';
      statusMap[st] = (statusMap[st] || 0) + 1;
    });

    // Kits alert
    const lowStockKits = fieldKits.filter(k => k.stockStatus === 'Reorder' || k.stockStatus === 'Critical' || k.availableQty <= k.minimumStock);

    return res.json({
      success: true,
      data: {
        kpi: {
          totalAssets,
          activeAssets,
          criticalRiskAssets,
          auditOverdueCount,
          totalPurchaseValue,
          currentBookValue,
          avgKmPerLiter,
          workflowDelayedCount,
        },
        categorySummaries,
        distributions: {
          byCondition: Object.entries(conditionMap).map(([name, count]) => ({ name, count })),
          byLocation: Object.entries(locationMap).map(([name, count]) => ({ name, count })),
          byStatus: Object.entries(statusMap).map(([name, count]) => ({ name, count })),
        },
        alerts: {
          auditOverdueCount,
          criticalRiskCount: criticalRiskAssets,
          delayedWorkflowsCount: workflowDelayedCount,
          lowStockKitsCount: lowStockKits.length,
        },
        managerNotes: [
          'Enter assets in the Asset Audit Tracker; dashboard updates automatically.',
          'QR codes are verified and printable directly from the QR Asset System.',
          'Use database-driven dropdowns and colored statuses to eliminate field audit errors.'
        ]
      }
    });
  } catch (error) {
    console.error('[AssetController:getAssetDashboard]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Assets with Search, Filtering, Sorting, Pagination
export const getAssets = async (req, res) => {
  try {
    await ensureDbSeeded();
    const {
      search = '',
      category,
      status,
      location,
      riskFlag,
      projectDonor,
      condition,
      auditResult,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 25,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10)));

    if (isDbActive()) {
      const query = { isDeleted: { $ne: true } };

      if (category && category !== 'ALL') query.category = category;
      if (status && status !== 'ALL') query.status = status;
      if (location && location !== 'ALL') query.location = location;
      if (riskFlag && riskFlag !== 'ALL') query.riskFlag = riskFlag;
      if (projectDonor && projectDonor !== 'ALL') query.projectDonor = projectDonor;
      if (condition && condition !== 'ALL') query.condition = condition;
      if (auditResult && auditResult !== 'ALL') query.auditResult = auditResult;

      if (search && search.trim() !== '') {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
          { assetId: regex },
          { name: regex },
          { custodian: regex },
          { location: regex },
          { qrText: regex },
          { remarks: regex },
        ];
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const totalCount = await Asset.countDocuments(query);
      const assets = await Asset.find(query)
        .sort(sortOptions)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();

      return res.json({
        success: true,
        data: assets,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
          page: pageNum,
          limit: limitNum,
        },
      });
    } else {
      // In-Memory / File Fallback Querying
      const fallback = getFallbackData();
      let records = (fallback.assets || []).filter(a => !a.isDeleted);

      if (category && category !== 'ALL') {
        records = records.filter(a => String(a.category || '').toLowerCase() === category.toLowerCase());
      }
      if (status && status !== 'ALL') {
        records = records.filter(a => String(a.status || '').toLowerCase() === status.toLowerCase());
      }
      if (location && location !== 'ALL') {
        records = records.filter(a => String(a.location || '').toLowerCase() === location.toLowerCase());
      }
      if (riskFlag && riskFlag !== 'ALL') {
        records = records.filter(a => String(a.riskFlag || '').toLowerCase() === riskFlag.toLowerCase());
      }
      if (projectDonor && projectDonor !== 'ALL') {
        records = records.filter(a => String(a.projectDonor || '').toLowerCase() === projectDonor.toLowerCase());
      }
      if (condition && condition !== 'ALL') {
        records = records.filter(a => String(a.condition || '').toLowerCase() === condition.toLowerCase());
      }
      if (auditResult && auditResult !== 'ALL') {
        records = records.filter(a => String(a.auditResult || '').toLowerCase() === auditResult.toLowerCase());
      }

      if (search && search.trim() !== '') {
        const term = search.trim().toLowerCase();
        records = records.filter(a => 
          String(a.assetId || '').toLowerCase().includes(term) ||
          String(a.name || '').toLowerCase().includes(term) ||
          String(a.custodian || '').toLowerCase().includes(term) ||
          String(a.location || '').toLowerCase().includes(term) ||
          String(a.qrText || '').toLowerCase().includes(term) ||
          String(a.remarks || '').toLowerCase().includes(term)
        );
      }

      records.sort((a, b) => {
        let valA = a[sortBy] ?? '';
        let valB = b[sortBy] ?? '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        return sortOrder === 'asc' 
          ? String(valA).localeCompare(String(valB)) 
          : String(valB).localeCompare(String(valA));
      });

      const totalCount = records.length;
      const paginated = records.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      return res.json({
        success: true,
        data: paginated,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
          page: pageNum,
          limit: limitNum,
        },
      });
    }
  } catch (error) {
    console.error('[AssetController:getAssets]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Single Asset by ID
export const getAssetById = async (req, res) => {
  try {
    const { id } = req.params;
    let asset = null;
    if (isDbActive()) {
      asset = await Asset.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { assetId: id }],
        isDeleted: { $ne: true }
      });
    } else {
      const fallback = getFallbackData();
      asset = (fallback.assets || []).find(a => (a._id === id || a.assetId === id) && !a.isDeleted);
    }

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    return res.json({ success: true, data: asset });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Create New Asset
export const createAsset = async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.assetId || !payload.name) {
      return res.status(400).json({ success: false, message: 'Asset ID and Asset Name are required' });
    }

    // Depreciation calculation
    const cost = Number(payload.purchaseCost) || 0;
    const usefulLife = Number(payload.usefulLifeYears) || 5;
    const annualDep = usefulLife > 0 ? Math.round(cost / usefulLife) : 0;
    const currentBookVal = payload.currentBookValue !== undefined ? Number(payload.currentBookValue) : cost;

    const qrText = payload.qrText || `${payload.assetId.trim()}|Name:${payload.name.trim()}|Location:${payload.location || 'Head Office'}|Custodian:${payload.custodian || 'Unassigned'}`;

    const newRecord = {
      ...payload,
      assetId: payload.assetId.trim(),
      name: payload.name.trim(),
      purchaseCost: cost,
      usefulLifeYears: usefulLife,
      annualDepreciation: annualDep,
      currentBookValue: currentBookVal,
      qrText,
      auditTrail: [
        {
          action: 'CREATED',
          performedBy: req.user?.name || 'Administrator',
          userEmail: req.user?.email || '',
          timestamp: new Date(),
          details: 'Asset record created in Master Register',
        }
      ]
    };

    if (isDbActive()) {
      const existing = await Asset.findOne({ assetId: newRecord.assetId });
      if (existing) {
        return res.status(409).json({ success: false, message: `Asset ID ${newRecord.assetId} already exists` });
      }
      const saved = await Asset.create(newRecord);
      return res.status(201).json({ success: true, message: 'Asset created successfully', data: saved });
    } else {
      const fallback = getFallbackData();
      const existing = (fallback.assets || []).find(a => a.assetId === newRecord.assetId && !a.isDeleted);
      if (existing) {
        return res.status(409).json({ success: false, message: `Asset ID ${newRecord.assetId} already exists` });
      }
      newRecord._id = `ast-${Date.now()}`;
      newRecord.createdAt = new Date().toISOString();
      newRecord.updatedAt = new Date().toISOString();
      fallback.assets.unshift(newRecord);
      saveFallbackData();
      return res.status(201).json({ success: true, message: 'Asset created successfully', data: newRecord });
    }
  } catch (error) {
    console.error('[AssetController:createAsset]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Update Asset
export const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.purchaseCost !== undefined && updates.usefulLifeYears !== undefined) {
      const cost = Number(updates.purchaseCost) || 0;
      const usefulLife = Number(updates.usefulLifeYears) || 5;
      updates.annualDepreciation = usefulLife > 0 ? Math.round(cost / usefulLife) : 0;
    }

    const auditEntry = {
      action: 'UPDATED',
      performedBy: req.user?.name || 'Administrator',
      userEmail: req.user?.email || '',
      timestamp: new Date(),
      details: updates.auditNotes || 'Asset updated',
    };

    if (isDbActive()) {
      const asset = await Asset.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { assetId: id }],
        isDeleted: { $ne: true }
      });
      if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

      Object.assign(asset, updates);
      asset.auditTrail.push(auditEntry);
      await asset.save();
      return res.json({ success: true, message: 'Asset updated successfully', data: asset });
    } else {
      const fallback = getFallbackData();
      const idx = fallback.assets.findIndex(a => (a._id === id || a.assetId === id) && !a.isDeleted);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Asset not found' });

      fallback.assets[idx] = {
        ...fallback.assets[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
        auditTrail: [...(fallback.assets[idx].auditTrail || []), auditEntry]
      };
      saveFallbackData();
      return res.json({ success: true, message: 'Asset updated successfully', data: fallback.assets[idx] });
    }
  } catch (error) {
    console.error('[AssetController:updateAsset]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Delete Asset (Soft Delete with Audit)
export const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const auditEntry = {
      action: 'DELETED',
      performedBy: req.user?.name || 'Administrator',
      userEmail: req.user?.email || '',
      timestamp: new Date(),
      details: 'Asset marked as deleted/archived',
    };

    if (isDbActive()) {
      const asset = await Asset.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { assetId: id }]
      });
      if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

      asset.isDeleted = true;
      asset.auditTrail.push(auditEntry);
      await asset.save();
      return res.json({ success: true, message: 'Asset removed successfully' });
    } else {
      const fallback = getFallbackData();
      const idx = fallback.assets.findIndex(a => a._id === id || a.assetId === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Asset not found' });

      fallback.assets[idx].isDeleted = true;
      fallback.assets[idx].auditTrail = [...(fallback.assets[idx].auditTrail || []), auditEntry];
      saveFallbackData();
      return res.json({ success: true, message: 'Asset removed successfully' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. QR Print Status Batch Update
export const updateQrPrintStatus = async (req, res) => {
  try {
    const { assetIds, printStatus, labelSize, tagLocation } = req.body;
    if (!Array.isArray(assetIds) || assetIds.length === 0) {
      return res.status(400).json({ success: false, message: 'assetIds array is required' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const updateObj = {
      qrPrintStatus: printStatus || 'Printed',
      lastPrintedDate: todayStr,
    };
    if (labelSize) updateObj.qrLabelSize = labelSize;
    if (tagLocation) updateObj.physicalTagLocation = tagLocation;

    if (isDbActive()) {
      await Asset.updateMany(
        { assetId: { $in: assetIds } },
        { 
          $set: updateObj,
          $push: {
            auditTrail: {
              action: 'QR_PRINTED',
              performedBy: req.user?.name || 'Administrator',
              details: `QR Label printed (${labelSize || 'default size'})`
            }
          }
        }
      );
      return res.json({ success: true, message: `Updated QR print status for ${assetIds.length} assets` });
    } else {
      const fallback = getFallbackData();
      fallback.assets.forEach(a => {
        if (assetIds.includes(a.assetId)) {
          Object.assign(a, updateObj);
          a.auditTrail = a.auditTrail || [];
          a.auditTrail.push({
            action: 'QR_PRINTED',
            performedBy: req.user?.name || 'Administrator',
            timestamp: new Date(),
            details: `QR Label printed (${labelSize || 'default size'})`
          });
        }
      });
      saveFallbackData();
      return res.json({ success: true, message: `Updated QR print status for ${assetIds.length} assets` });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Field Kit Inventory APIs (GID 1726563914)
export const getFieldKits = async (req, res) => {
  try {
    await ensureDbSeeded();
    let kits = [];
    if (isDbActive()) {
      kits = await FieldKitInventory.find().sort({ itemCode: 1 }).lean();
    } else {
      kits = getFallbackData().fieldKits || [];
    }
    return res.json({ success: true, data: kits });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createFieldKit = async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.itemCode || !payload.equipmentName) {
      return res.status(400).json({ success: false, message: 'Item Code and Equipment Name are required' });
    }
    if (isDbActive()) {
      const created = await FieldKitInventory.create(payload);
      return res.status(201).json({ success: true, data: created });
    } else {
      const fallback = getFallbackData();
      payload._id = `kit-${Date.now()}`;
      fallback.fieldKits.push(payload);
      saveFallbackData();
      return res.status(201).json({ success: true, data: payload });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const adjustKitStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { openingQty, issuedQty, returnedQty, damagedQty, missingQty, minimumStock, remarks } = req.body;

    if (isDbActive()) {
      const kit = await FieldKitInventory.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { itemCode: id }]
      });
      if (!kit) return res.status(404).json({ success: false, message: 'Field Kit not found' });

      if (openingQty !== undefined) kit.openingQty = Number(openingQty);
      if (issuedQty !== undefined) kit.issuedQty = Number(issuedQty);
      if (returnedQty !== undefined) kit.returnedQty = Number(returnedQty);
      if (damagedQty !== undefined) kit.damagedQty = Number(damagedQty);
      if (missingQty !== undefined) kit.missingQty = Number(missingQty);
      if (minimumStock !== undefined) kit.minimumStock = Number(minimumStock);
      if (remarks !== undefined) kit.remarks = remarks;

      kit.lastPhysicalCount = new Date().toISOString().split('T')[0];
      await kit.save();
      return res.json({ success: true, data: kit });
    } else {
      const fallback = getFallbackData();
      const idx = fallback.fieldKits.findIndex(k => k._id === id || k.itemCode === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Field Kit not found' });

      const kit = fallback.fieldKits[idx];
      if (openingQty !== undefined) kit.openingQty = Number(openingQty);
      if (issuedQty !== undefined) kit.issuedQty = Number(issuedQty);
      if (returnedQty !== undefined) kit.returnedQty = Number(returnedQty);
      if (damagedQty !== undefined) kit.damagedQty = Number(damagedQty);
      if (missingQty !== undefined) kit.missingQty = Number(missingQty);
      if (minimumStock !== undefined) kit.minimumStock = Number(minimumStock);
      if (remarks !== undefined) kit.remarks = remarks;

      kit.availableQty = Math.max(0, kit.openingQty - kit.issuedQty + kit.returnedQty - kit.damagedQty - kit.missingQty);
      kit.stockStatus = kit.availableQty <= 0 ? 'Critical' : (kit.availableQty <= kit.minimumStock ? 'Reorder' : 'OK');
      kit.lastPhysicalCount = new Date().toISOString().split('T')[0];

      saveFallbackData();
      return res.json({ success: true, data: kit });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Vehicle Fleet & Logbook APIs (GID 1933684115)
export const getVehicleLogs = async (req, res) => {
  try {
    await ensureDbSeeded();
    let logs = [];
    if (isDbActive()) {
      logs = await VehicleLog.find().sort({ date: -1 }).lean();
    } else {
      logs = getFallbackData().vehicleLogs || [];
    }
    return res.json({ success: true, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createVehicleLog = async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.vehicleId || !payload.date || !payload.driver) {
      return res.status(400).json({ success: false, message: 'Date, Vehicle ID, and Driver are required' });
    }

    const start = Number(payload.startKm) || 0;
    const end = Number(payload.endKm) || 0;
    const trip = Math.max(0, end - start);
    const fuelLiters = Number(payload.fuelLiters) || 0;
    const fuelCost = Number(payload.fuelCost) || 0;
    const kmPerLiter = fuelLiters > 0 && trip > 0 ? Number((trip / fuelLiters).toFixed(2)) : 0;
    const costPerKm = trip > 0 && fuelCost > 0 ? Number((fuelCost / trip).toFixed(2)) : 0;
    const costPerLiter = fuelLiters > 0 && fuelCost > 0 ? Number((fuelCost / fuelLiters).toFixed(2)) : (payload.costPerLiter || 130);

    const logEntry = {
      ...payload,
      startKm: start,
      endKm: end,
      tripKm: trip,
      fuelLiters,
      fuelCost,
      costPerLiter,
      kmPerLiter,
      costPerKm,
    };

    if (isDbActive()) {
      const created = await VehicleLog.create(logEntry);
      return res.status(201).json({ success: true, data: created });
    } else {
      const fallback = getFallbackData();
      logEntry._id = `vlog-${Date.now()}`;
      fallback.vehicleLogs.unshift(logEntry);
      saveFallbackData();
      return res.status(201).json({ success: true, data: logEntry });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Handover & Return Chain of Custody APIs (GID 2011906547 & 1510015205)
export const getHandovers = async (req, res) => {
  try {
    await ensureDbSeeded();
    let handovers = [];
    let consumables = [];
    if (isDbActive()) {
      handovers = await AssetHandover.find().sort({ createdAt: -1 }).lean();
      consumables = getFallbackData().consumables || [];
    } else {
      const fallback = getFallbackData();
      handovers = fallback.handovers || [];
      consumables = fallback.consumables || [];
    }
    return res.json({ success: true, data: { handovers, consumables } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createHandover = async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.formNo) {
      payload.formNo = `HO-${Date.now().toString().slice(-6)}`;
    }
    if (!payload.date) {
      payload.date = new Date().toISOString().split('T')[0];
    }

    if (isDbActive()) {
      const created = await AssetHandover.create(payload);
      return res.status(201).json({ success: true, data: created });
    } else {
      const fallback = getFallbackData();
      payload._id = `ho-${Date.now()}`;
      fallback.handovers.unshift(payload);
      saveFallbackData();
      return res.status(201).json({ success: true, data: payload });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createConsumableHandover = async (req, res) => {
  try {
    const { name, quantity, handoverTo } = req.body;
    if (!name || !quantity) {
      return res.status(400).json({ success: false, message: 'Name and Quantity are required' });
    }
    const item = {
      _id: `con-${Date.now()}`,
      name: name.trim(),
      quantity: Number(quantity) || 1,
      handoverTo: handoverTo || 'Staff Member',
      date: new Date().toISOString().split('T')[0]
    };
    const fallback = getFallbackData();
    fallback.consumables.unshift(item);
    saveFallbackData();
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 11. Procurement & Disposal Lifecycle Workflows (GID 1017327203)
export const getWorkflows = async (req, res) => {
  try {
    await ensureDbSeeded();
    let workflows = [];
    if (isDbActive()) {
      workflows = await AssetWorkflow.find().sort({ requisitionDate: -1 }).lean();
    } else {
      workflows = getFallbackData().workflows || [];
    }
    return res.json({ success: true, data: workflows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createWorkflow = async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.requestId || !payload.assetName) {
      return res.status(400).json({ success: false, message: 'Request ID and Asset Name are required' });
    }

    if (isDbActive()) {
      const created = await AssetWorkflow.create(payload);
      return res.status(201).json({ success: true, data: created });
    } else {
      const fallback = getFallbackData();
      payload._id = `wf-${Date.now()}`;
      fallback.workflows.unshift(payload);
      saveFallbackData();
      return res.status(201).json({ success: true, data: payload });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateWorkflowStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentStage, workflowStatus, remarks } = req.body;

    if (isDbActive()) {
      const wf = await AssetWorkflow.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { requestId: id }]
      });
      if (!wf) return res.status(404).json({ success: false, message: 'Workflow record not found' });

      if (currentStage) wf.currentStage = currentStage;
      if (workflowStatus) wf.workflowStatus = workflowStatus;
      if (remarks) wf.remarks = remarks;

      await wf.save();
      return res.json({ success: true, data: wf });
    } else {
      const fallback = getFallbackData();
      const idx = fallback.workflows.findIndex(w => w._id === id || w.requestId === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Workflow record not found' });

      if (currentStage) fallback.workflows[idx].currentStage = currentStage;
      if (workflowStatus) fallback.workflows[idx].workflowStatus = workflowStatus;
      if (remarks) fallback.workflows[idx].remarks = remarks;

      saveFallbackData();
      return res.json({ success: true, data: fallback.workflows[idx] });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 12. Master Reference Data & Dropdown Options (GID 671339665)
export const getReferences = async (req, res) => {
  try {
    let references = {};
    if (isDbActive()) {
      const refDoc = await AssetReference.findOne({ key: 'default_references' }).lean();
      references = refDoc || getFallbackData().references || {};
    } else {
      references = getFallbackData().references || {};
    }
    return res.json({ success: true, data: references });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateReferences = async (req, res) => {
  try {
    const newReferences = req.body;
    if (isDbActive()) {
      const updated = await AssetReference.findOneAndUpdate(
        { key: 'default_references' },
        { ...newReferences, key: 'default_references' },
        { upsert: true, new: true }
      );
      return res.json({ success: true, data: updated });
    } else {
      const fallback = getFallbackData();
      fallback.references = { ...fallback.references, ...newReferences };
      saveFallbackData();
      return res.json({ success: true, data: fallback.references });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 13. Sync Live from Google Sheets
export const syncFromGoogleSheets = async (req, res) => {
  try {
    const sheetId = '11ucgtB03mb7Pm3fJOREwhCDrlhYb8o2c';
    const gids = {
      dashboard: '1754930862',
      assets: '1517243350',
      qrTags: '861206349',
      kits: '1726563914',
      vehicles: '1933684115',
      workflows: '1017327203',
      references: '671339665'
    };

    console.log('[AssetController:syncFromGoogleSheets] Syncing live data...');
    // We can fetch the CSV from Google Sheets export endpoint
    const assetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gids.assets}`;
    const response = await fetch(assetUrl);
    if (!response.ok) {
      throw new Error(`Google Sheets responded with status ${response.status}`);
    }
    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);

    let importedCount = 0;
    let updatedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const r = lines[i].split(',');
      const assetId = r[0] ? r[0].replace(/"/g, '').trim() : '';
      if (!assetId || assetId.startsWith('Total')) continue;

      const assetName = r[2] ? r[2].replace(/"/g, '').trim() : 'Asset';
      const category = r[3] ? r[3].replace(/"/g, '').trim() : 'IT Equipment';
      const location = r[5] ? r[5].replace(/"/g, '').trim() : 'Head Office';
      const custodian = r[6] ? r[6].replace(/"/g, '').trim() : 'Unassigned';

      if (isDbActive()) {
        const found = await Asset.findOne({ assetId });
        if (found) {
          found.name = assetName;
          found.category = category;
          found.location = location;
          found.custodian = custodian;
          await found.save();
          updatedCount++;
        } else {
          await Asset.create({
            assetId,
            name: assetName,
            category,
            location,
            custodian,
            status: 'Active',
            qrText: `${assetId}|Name:${assetName}|Location:${location}|Custodian:${custodian}`
          });
          importedCount++;
        }
      } else {
        const fallback = getFallbackData();
        const existing = fallback.assets.find(a => a.assetId === assetId);
        if (existing) {
          existing.name = assetName;
          existing.category = category;
          existing.location = location;
          existing.custodian = custodian;
          updatedCount++;
        } else {
          fallback.assets.push({
            _id: `ast-${Date.now()}-${i}`,
            assetId,
            name: assetName,
            category,
            location,
            custodian,
            status: 'Active',
            qrText: `${assetId}|Name:${assetName}|Location:${location}|Custodian:${custodian}`
          });
          importedCount++;
        }
      }
    }

    if (!isDbActive()) {
      saveFallbackData();
    }

    return res.json({
      success: true,
      message: 'Google Sheets synchronization completed',
      summary: {
        totalRowsProcessed: lines.length - 1,
        newAssetsImported: importedCount,
        existingAssetsUpdated: updatedCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[AssetController:syncFromGoogleSheets]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
