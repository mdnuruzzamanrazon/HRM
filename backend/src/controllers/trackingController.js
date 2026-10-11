import { TrackingLog } from '../models/TrackingLog.js';

// Employee: Manual check-in ping
export const checkIn = async (req, res) => {
  try {
    const employeeId = req.user.employeeProfileId;
    if (!employeeId) return res.status(400).json({ success: false, message: 'Employee Profile ID missing.' });

    const { location } = req.body;
    
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
    const logs = await TrackingLog.find()
      .populate('employeeId', 'personalDetails employeeCode')
      .sort({ createdAt: -1 })
      .limit(100); // Limit to recent 100 for performance
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Employee: Get own tracking logs
export const getMyLogs = async (req, res) => {
  try {
    const employeeId = req.user.employeeProfileId;
    const logs = await TrackingLog.find({ employeeId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
