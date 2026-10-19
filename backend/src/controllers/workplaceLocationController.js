import mongoose from 'mongoose';
import { WorkplaceLocation } from '../models/WorkplaceLocation.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { isValidCoordinate, calculateDistanceMeters } from '../utils/geoUtils.js';
import { logAudit } from '../utils/auditLogger.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';

// Get all workplaces (Admin view)
export const getAllWorkplaces = async (req, res) => {
  try {
    const { search, status } = req.query;

    // Demo Mode fallback for serverless when cloud database is not connected
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      let list = mockData.workplaces || [];
      if (status === 'active') list = list.filter(w => w.isActive);
      if (status === 'inactive') list = list.filter(w => !w.isActive);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(w => 
          (w.name && w.name.toLowerCase().includes(q)) ||
          (w.code && w.code.toLowerCase().includes(q)) ||
          (w.address && w.address.toLowerCase().includes(q)) ||
          (w.city && w.city.toLowerCase().includes(q))
        );
      }
      return res.json({
        success: true,
        data: list,
        count: list.length,
        isDemoMode: true,
      });
    }

    const query = {};
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }

    const workplaces = await WorkplaceLocation.find(query)
      .sort({ isDefault: -1, createdAt: -1 })
      .populate('createdBy', 'email');

    // Aggregate attendance count for each workplace
    const workplacesWithStats = await Promise.all(
      workplaces.map(async (wp) => {
        const attendanceCount = await AttendanceRecord.countDocuments({
          $or: [
            { 'checkIn.workplaceId': wp._id },
            { 'checkOut.workplaceId': wp._id },
          ],
        });
        const obj = wp.toObject();
        obj.attendanceCount = attendanceCount;
        return obj;
      })
    );

    res.json({
      success: true,
      data: workplacesWithStats,
      count: workplacesWithStats.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get active workplaces (Available to employees for check-in)
export const getActiveWorkplaces = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const list = (mockData.workplaces || []).filter(w => w.isActive);
      return res.json({
        success: true,
        data: list,
        isDemoMode: true,
      });
    }

    const workplaces = await WorkplaceLocation.find({ isActive: true })
      .select('name code address city country coordinates radiusMeters maxAccuracyThreshold isDefault geofenceEnforced description')
      .sort({ isDefault: -1, name: 1 });

    res.json({
      success: true,
      data: workplaces,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single workplace by ID
export const getWorkplaceById = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const workplace = (mockData.workplaces || []).find(w => w._id.toString() === req.params.id);
      if (!workplace) {
        return res.status(404).json({ success: false, message: 'Workplace location not found' });
      }
      return res.json({ success: true, data: workplace, isDemoMode: true });
    }

    const workplace = await WorkplaceLocation.findById(req.params.id)
      .populate('createdBy', 'email');

    if (!workplace) {
      return res.status(404).json({ success: false, message: 'Workplace location not found' });
    }

    res.json({ success: true, data: workplace });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new workplace location (Admin only)
export const createWorkplace = async (req, res) => {
  try {
    const {
      name,
      code,
      address,
      city,
      country,
      latitude,
      longitude,
      radiusMeters,
      maxAccuracyThreshold,
      isDefault,
      isActive,
      geofenceEnforced,
      description,
    } = req.body;

    if (!name || !code || !address) {
      return res.status(400).json({ success: false, message: 'Name, branch code, and address are required' });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!isValidCoordinate(lat, lng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GPS coordinates. Latitude must be between -90 and 90, Longitude between -180 and 180.',
      });
    }

    const radius = Number(radiusMeters) || 100;
    if (radius < 10 || radius > 50000) {
      return res.status(400).json({
        success: false,
        message: 'Permitted attendance radius must be between 10 and 50,000 meters.',
      });
    }

    // Demo Mode handling
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      if (!mockData.workplaces) mockData.workplaces = [];
      const codeUpper = code.trim().toUpperCase();
      if (mockData.workplaces.some(w => w.code === codeUpper)) {
        return res.status(400).json({
          success: false,
          message: `Workplace branch code '${codeUpper}' is already in use. Please specify a unique code.`,
        });
      }

      if (isDefault) {
        mockData.workplaces.forEach(w => { w.isDefault = false; });
      }

      const newWp = {
        _id: 'wp-' + Date.now(),
        name: name.trim(),
        code: codeUpper,
        address: address.trim(),
        city: city ? city.trim() : '',
        country: country ? country.trim() : '',
        coordinates: { lat, lng },
        radiusMeters: radius,
        maxAccuracyThreshold: Number(maxAccuracyThreshold) || 200,
        isDefault: Boolean(isDefault) || mockData.workplaces.length === 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        geofenceEnforced: geofenceEnforced !== undefined ? Boolean(geofenceEnforced) : true,
        description: description ? description.trim() : '',
        attendanceCount: 0,
        createdAt: new Date().toISOString(),
      };

      mockData.workplaces.unshift(newWp);
      return res.status(201).json({
        success: true,
        message: 'Workplace location created successfully',
        data: newWp,
        isDemoMode: true,
      });
    }

    // Check code uniqueness in MongoDB
    const existingCode = await WorkplaceLocation.findOne({ code: code.trim().toUpperCase() });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: `Workplace branch code '${code.trim().toUpperCase()}' is already in use. Please specify a unique code.`,
      });
    }

    // If marked as default, unset any existing default
    if (isDefault) {
      await WorkplaceLocation.updateMany({}, { isDefault: false });
    }

    // If this is the very first workplace, make it default automatically
    const totalCount = await WorkplaceLocation.countDocuments();
    const shouldBeDefault = isDefault || totalCount === 0;

    const workplace = new WorkplaceLocation({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      address: address.trim(),
      city: city ? city.trim() : '',
      country: country ? country.trim() : '',
      coordinates: { lat, lng },
      radiusMeters: radius,
      maxAccuracyThreshold: Number(maxAccuracyThreshold) || 200,
      isDefault: shouldBeDefault,
      isActive: isActive !== undefined ? isActive : true,
      geofenceEnforced: geofenceEnforced !== undefined ? geofenceEnforced : true,
      description: description ? description.trim() : '',
      createdBy: req.user?._id,
    });

    await workplace.save();

    await logAudit({
      userId: req.user?._id,
      action: 'WORKPLACE_LOCATION_CREATED',
      resource: 'WorkplaceLocation',
      resourceId: workplace._id,
      details: `Created workplace location: ${workplace.name} (${workplace.code}) with radius ${radius}m`,
      ip: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Workplace location created successfully',
      data: workplace,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update an existing workplace location (Admin only)
export const updateWorkplace = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      address,
      city,
      country,
      latitude,
      longitude,
      radiusMeters,
      maxAccuracyThreshold,
      isDefault,
      isActive,
      geofenceEnforced,
      description,
    } = req.body;

    // Demo Mode handling
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      if (!mockData.workplaces) mockData.workplaces = [];
      const idx = mockData.workplaces.findIndex(w => w._id.toString() === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Workplace location not found' });
      }

      if (code && code.trim().toUpperCase() !== mockData.workplaces[idx].code) {
        const codeUpper = code.trim().toUpperCase();
        if (mockData.workplaces.some(w => w._id.toString() !== id && w.code === codeUpper)) {
          return res.status(400).json({
            success: false,
            message: `Branch code '${codeUpper}' is already used by another workplace.`,
          });
        }
        mockData.workplaces[idx].code = codeUpper;
      }

      if (isDefault) {
        mockData.workplaces.forEach(w => { w.isDefault = false; });
      }

      const cur = mockData.workplaces[idx];
      const updated = {
        ...cur,
        ...(name ? { name: name.trim() } : {}),
        ...(address ? { address: address.trim() } : {}),
        ...(city !== undefined ? { city: city.trim() } : {}),
        ...(country !== undefined ? { country: country.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        ...(latitude !== undefined && longitude !== undefined ? { coordinates: { lat: Number(latitude), lng: Number(longitude) } } : {}),
        ...(radiusMeters !== undefined ? { radiusMeters: Number(radiusMeters) } : {}),
        ...(maxAccuracyThreshold !== undefined ? { maxAccuracyThreshold: Number(maxAccuracyThreshold) } : {}),
        ...(isDefault !== undefined ? { isDefault: Boolean(isDefault) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(geofenceEnforced !== undefined ? { geofenceEnforced: Boolean(geofenceEnforced) } : {}),
      };

      mockData.workplaces[idx] = updated;
      return res.json({
        success: true,
        message: 'Workplace location updated successfully',
        data: updated,
        isDemoMode: true,
      });
    }

    const workplace = await WorkplaceLocation.findById(id);
    if (!workplace) {
      return res.status(404).json({ success: false, message: 'Workplace location not found' });
    }

    if (code && code.trim().toUpperCase() !== workplace.code) {
      const codeExists = await WorkplaceLocation.findOne({
        code: code.trim().toUpperCase(),
        _id: { $ne: id },
      });
      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: `Branch code '${code.trim().toUpperCase()}' is already used by another workplace.`,
        });
      }
      workplace.code = code.trim().toUpperCase();
    }

    if (name) workplace.name = name.trim();
    if (address) workplace.address = address.trim();
    if (city !== undefined) workplace.city = city.trim();
    if (country !== undefined) workplace.country = country.trim();
    if (description !== undefined) workplace.description = description.trim();

    if (latitude !== undefined && longitude !== undefined) {
      const lat = Number(latitude);
      const lng = Number(longitude);
      if (!isValidCoordinate(lat, lng)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid GPS coordinates provided.',
        });
      }
      workplace.coordinates = { lat, lng };
    }

    if (radiusMeters !== undefined) {
      const radius = Number(radiusMeters);
      if (radius < 10 || radius > 50000) {
        return res.status(400).json({
          success: false,
          message: 'Radius must be between 10 and 50,000 meters.',
        });
      }
      workplace.radiusMeters = radius;
    }

    if (maxAccuracyThreshold !== undefined) {
      workplace.maxAccuracyThreshold = Number(maxAccuracyThreshold) || 200;
    }

    if (isActive !== undefined) {
      workplace.isActive = Boolean(isActive);
    }

    if (geofenceEnforced !== undefined) {
      workplace.geofenceEnforced = Boolean(geofenceEnforced);
    }

    if (isDefault) {
      await WorkplaceLocation.updateMany({ _id: { $ne: id } }, { isDefault: false });
      workplace.isDefault = true;
    } else if (isDefault === false && workplace.isDefault) {
      workplace.isDefault = false;
    }

    await workplace.save();

    await logAudit({
      userId: req.user?._id,
      action: 'WORKPLACE_LOCATION_UPDATED',
      resource: 'WorkplaceLocation',
      resourceId: workplace._id,
      details: `Updated workplace location: ${workplace.name}`,
      ip: req.ip,
    });

    res.json({
      success: true,
      message: 'Workplace location updated successfully',
      data: workplace,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle active status (Admin only)
export const toggleWorkplaceStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      if (!mockData.workplaces) mockData.workplaces = [];
      const wp = mockData.workplaces.find(w => w._id.toString() === id);
      if (!wp) return res.status(404).json({ success: false, message: 'Workplace location not found' });
      wp.isActive = !wp.isActive;
      return res.json({
        success: true,
        message: `Workplace location ${wp.isActive ? 'activated' : 'deactivated'} successfully`,
        data: wp,
        isDemoMode: true,
      });
    }

    const workplace = await WorkplaceLocation.findById(id);

    if (!workplace) {
      return res.status(404).json({ success: false, message: 'Workplace location not found' });
    }

    workplace.isActive = !workplace.isActive;
    await workplace.save();

    await logAudit({
      userId: req.user?._id,
      action: 'WORKPLACE_STATUS_TOGGLED',
      resource: 'WorkplaceLocation',
      resourceId: workplace._id,
      details: `Set workplace ${workplace.name} active status to: ${workplace.isActive}`,
      ip: req.ip,
    });

    res.json({
      success: true,
      message: `Workplace location ${workplace.isActive ? 'activated' : 'deactivated'} successfully`,
      data: workplace,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete workplace location (Admin only)
export const deleteWorkplace = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      if (!mockData.workplaces) mockData.workplaces = [];
      mockData.workplaces = mockData.workplaces.filter(w => w._id.toString() !== id);
      return res.json({
        success: true,
        message: 'Workplace location deleted successfully',
        isDemoMode: true,
      });
    }

    const workplace = await WorkplaceLocation.findById(id);

    if (!workplace) {
      return res.status(404).json({ success: false, message: 'Workplace location not found' });
    }

    // Check if workplace has recorded attendances
    const usageCount = await AttendanceRecord.countDocuments({
      $or: [
        { 'checkIn.workplaceId': id },
        { 'checkOut.workplaceId': id },
      ],
    });

    if (usageCount > 0 && req.query.force !== 'true') {
      workplace.isActive = false;
      await workplace.save();
      return res.json({
        success: true,
        message: `Workplace has ${usageCount} historical attendance records and was deactivated to preserve data integrity.`,
        data: workplace,
      });
    }

    await WorkplaceLocation.findByIdAndDelete(id);

    await logAudit({
      userId: req.user?._id,
      action: 'WORKPLACE_LOCATION_DELETED',
      resource: 'WorkplaceLocation',
      resourceId: id,
      details: `Deleted workplace location: ${workplace.name} (${workplace.code})`,
      ip: req.ip,
    });

    res.json({
      success: true,
      message: 'Workplace location deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
