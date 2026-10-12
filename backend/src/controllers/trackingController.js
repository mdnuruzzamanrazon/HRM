import mongoose from 'mongoose';
import { TrackingLog } from '../models/TrackingLog.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';

// Employee: Manual check-in ping
export const checkIn = async (req, res) => {
  try {
    const employeeId = req.user?.employeeProfileId || mockData.adminEmployee._id;
    const { location } = req.body;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const newLog = {
        _id: 'trk-' + Date.now(),
        employeeId: mockData.adminEmployee,
        activityType: 'LOCATION_CHECKIN',
        description: `Check-in recorded from ${location || 'HQ Campus'}`,
        ipAddress: '192.168.1.100',
        deviceInfo: req.headers['user-agent'] || 'Chrome Browser',
        createdAt: new Date().toISOString(),
      };
      mockData.tracking.unshift(newLog);
      return res.status(201).json({ success: true, data: newLog, message: 'Check-in recorded successfully' });
    }

    const log = new TrackingLog({
      employeeId,
      activityType: 'LOCATION_CHECKIN',
      description: `Remote check-in from ${location || 'Unknown Location'}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      deviceInfo: req.headers['user-agent']
    });

    await log.save();
    res.status(201).json({ success: true, data: log, message: 'Check-in recorded successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Admin: Get all tracking logs
export const getAllLogs = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: mockData.tracking });
    }
    const logs = await TrackingLog.find()
      .populate('employeeId', 'personalDetails employeeCode')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Employee: Get own tracking logs
export const getMyLogs = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: mockData.tracking });
    }
    const employeeId = req.user.employeeProfileId;
    const logs = await TrackingLog.find({ employeeId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
