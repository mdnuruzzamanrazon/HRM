import mongoose from 'mongoose';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { AttendanceCorrection } from '../models/AttendanceCorrection.js';
import { Employee } from '../models/Employee.js';
import { WorkplaceLocation } from '../models/WorkplaceLocation.js';
import { TrackingLog } from '../models/TrackingLog.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';
import { logAudit } from '../utils/auditLogger.js';
import { calculateDistanceMeters, isValidCoordinate, formatDistance } from '../utils/geoUtils.js';

// Helper to verify device GPS coordinates against authorized workplace geofences
async function verifyGeofence({ latitude, longitude, accuracy, workplaceId, req, actionName }) {
  let activeWorkplaces = [];
  if (isDemoMode() || mongoose.connection.readyState !== 1) {
    activeWorkplaces = (mockData.workplaces || []).filter(w => w.isActive);
  } else {
    activeWorkplaces = await WorkplaceLocation.find({ isActive: true });
  }

  if (!activeWorkplaces || activeWorkplaces.length === 0) {
    // If no active workplaces are configured in the system, allow bypass
    return { verified: false, workplace: null, distance: null };
  }

  let targetWorkplace = null;
  if (workplaceId) {
    targetWorkplace = activeWorkplaces.find(w => w._id.toString() === workplaceId.toString());
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!isValidCoordinate(lat, lng)) {
    const error = new Error('Physical GPS coordinates are required to verify attendance within the authorized workplace area.');
    error.statusCode = 400;
    error.code = 'LOCATION_REQUIRED';
    throw error;
  }

  // If no specific workplace was selected, choose the nearest active workplace
  if (!targetWorkplace) {
    let minDistance = Infinity;
    for (const wp of activeWorkplaces) {
      const d = calculateDistanceMeters(lat, lng, wp.coordinates.lat, wp.coordinates.lng);
      if (d < minDistance) {
        minDistance = d;
        targetWorkplace = wp;
      }
    }
  }

  if (!targetWorkplace) {
    targetWorkplace = activeWorkplaces[0];
  }

  // Check GPS accuracy threshold
  const maxAcc = targetWorkplace.maxAccuracyThreshold || 200;
  if (accuracy !== undefined && accuracy !== null && !isNaN(Number(accuracy))) {
    const accNum = Number(accuracy);
    if (accNum > maxAcc) {
      const error = new Error(`GPS reading accuracy is too low (±${Math.round(accNum)}m). High-accuracy GPS is required (within ±${maxAcc}m). Please enable high accuracy / Wi-Fi positioning and try again.`);
      error.statusCode = 400;
      error.code = 'ACCURACY_TOO_LOW';
      throw error;
    }
  }

  // Calculate distance between employee device and workplace coordinates
  const distance = calculateDistanceMeters(lat, lng, targetWorkplace.coordinates.lat, targetWorkplace.coordinates.lng);

  // If geofence is enforced on this workplace, check radius restriction
  if (targetWorkplace.geofenceEnforced && distance > targetWorkplace.radiusMeters) {
    await logAudit({
      userId: req.user?._id,
      action: 'ATTENDANCE_BLOCKED_OUTSIDE_GEOFENCE',
      resource: 'AttendanceRecord',
      details: `Employee attempted ${actionName} from ${formatDistance(distance)} away from '${targetWorkplace.name}' (permitted radius: ${targetWorkplace.radiusMeters}m). Attendance action blocked.`,
      ip: req.ip
    });

    const error = new Error('You are outside the authorized workplace area. Please move within the permitted location to check in or check out.');
    error.statusCode = 403;
    error.code = 'OUTSIDE_GEOFENCE';
    error.data = {
      workplaceName: targetWorkplace.name,
      workplaceAddress: targetWorkplace.address,
      distanceMeters: distance,
      distanceFormatted: formatDistance(distance),
      permittedRadius: targetWorkplace.radiusMeters,
      excessMeters: distance - targetWorkplace.radiusMeters
    };
    throw error;
  }

  return {
    verified: true,
    workplace: targetWorkplace,
    distance,
    lat,
    lng,
    accuracy: accuracy ? Math.round(Number(accuracy)) : null
  };
}

export const clockIn = async (req, res) => {
  try {
    const employeeId = req.body.employeeId || req.user?.employeeProfileId?._id || req.user?.employeeProfileId || mockData.adminEmployee._id;
    const { latitude, longitude, accuracy, workplaceId } = req.body;
    const date = new Date().toISOString().split('T')[0];

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const existing = mockData.attendance.find(a => a.date === date);
      if (existing && existing.checkIn) {
        return res.status(400).json({ success: false, message: 'Already clocked in for today' });
      }
      const newRecord = {
        _id: 'att-' + Date.now(),
        employeeId: mockData.adminEmployee,
        date,
        checkIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        checkOut: null,
        status: 'PRESENT',
        workHours: 0
      };
      mockData.attendance.unshift(newRecord);
      return res.status(201).json({ success: true, data: newRecord, message: 'Clocked in successfully' });
    }

    const existingRecord = await AttendanceRecord.findOne({ employeeId, date });
    if (existingRecord && existingRecord.checkIn?.timestamp) {
      return res.status(400).json({ success: false, message: 'Already clocked in for today' });
    }

    // Verify GPS Geofence Restriction on Backend
    const geoResult = await verifyGeofence({
      latitude,
      longitude,
      accuracy,
      workplaceId,
      req,
      actionName: 'Clock-In'
    });

    const now = new Date();
    // Attendance rule: Check if late (e.g. after 09:30 AM local)
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const isLate = hours > 9 || (hours === 9 && minutes > 30);

    const record = existingRecord || new AttendanceRecord({
      employeeId,
      date,
      status: isLate ? 'LATE' : 'PRESENT'
    });

    if (geoResult.verified) {
      record.checkIn = {
        timestamp: now,
        ip: req.ip,
        geo: { lat: geoResult.lat, lng: geoResult.lng },
        accuracy: geoResult.accuracy,
        distanceMeters: geoResult.distance,
        workplaceId: geoResult.workplace._id,
        workplaceName: geoResult.workplace.name,
        verificationStatus: 'VERIFIED',
        verificationMethod: 'GPS_GEOFENCE'
      };

      try {
        await new TrackingLog({
          employeeId,
          activityType: 'LOCATION_CHECKIN',
          description: `GPS Verified Check-In at ${geoResult.workplace.name} (${formatDistance(geoResult.distance)} from branch center, radius ${geoResult.workplace.radiusMeters}m)`,
          ipAddress: req.ip,
          deviceInfo: req.headers['user-agent'] || 'Web Client'
        }).save();
      } catch (tErr) {
        console.error('Failed to record tracking log on check-in:', tErr.message);
      }
    } else {
      record.checkIn = {
        timestamp: now,
        ip: req.ip,
        verificationStatus: 'UNVERIFIED',
        verificationMethod: 'NONE'
      };
    }

    if (!existingRecord) {
      record.status = isLate ? 'LATE' : 'PRESENT';
    }

    await record.save();

    await logAudit({
      userId: req.user?._id,
      action: 'EMPLOYEE_CLOCKED_IN',
      resource: 'AttendanceRecord',
      resourceId: record._id,
      details: `Clocked in successfully. GPS Verified: ${geoResult.verified ? `Yes (${geoResult.workplace.name})` : 'No'}`,
      ip: req.ip
    });

    res.status(201).json({ 
      success: true, 
      data: record, 
      message: isLate ? 'Clocked in (Marked Late)' : 'Clocked in successfully' 
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ 
      success: false, 
      code: error.code || 'ATTENDANCE_ERROR',
      message: error.message,
      data: error.data || null
    });
  }
};

export const clockOut = async (req, res) => {
  try {
    const employeeId = req.body.employeeId || req.user?.employeeProfileId?._id || req.user?.employeeProfileId || mockData.adminEmployee._id;
    const { latitude, longitude, accuracy, workplaceId } = req.body;
    const date = new Date().toISOString().split('T')[0];

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const record = mockData.attendance.find(a => a.date === date) || mockData.attendance[0];
      if (!record) {
        return res.status(404).json({ success: false, message: 'No check-in record found for today' });
      }
      if (record.checkOut) {
        return res.status(400).json({ success: false, message: 'Already clocked out for today' });
      }
      record.checkOut = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      record.workHours = 8.5;
      return res.json({ success: true, data: record, message: 'Clocked out successfully' });
    }

    const record = await AttendanceRecord.findOne({ employeeId, date });
    if (!record || !record.checkIn?.timestamp) {
      return res.status(404).json({ success: false, message: 'No check-in record found for today' });
    }
    
    if (record.checkOut && record.checkOut.timestamp) {
      return res.status(400).json({ success: false, message: 'Already clocked out for today' });
    }

    // Verify GPS Geofence Restriction on Backend
    const geoResult = await verifyGeofence({
      latitude,
      longitude,
      accuracy,
      workplaceId,
      req,
      actionName: 'Clock-Out'
    });

    const now = new Date();
    if (geoResult.verified) {
      record.checkOut = {
        timestamp: now,
        ip: req.ip,
        geo: { lat: geoResult.lat, lng: geoResult.lng },
        accuracy: geoResult.accuracy,
        distanceMeters: geoResult.distance,
        workplaceId: geoResult.workplace._id,
        workplaceName: geoResult.workplace.name,
        verificationStatus: 'VERIFIED',
        verificationMethod: 'GPS_GEOFENCE'
      };

      try {
        await new TrackingLog({
          employeeId,
          activityType: 'LOCATION_CHECKIN',
          description: `GPS Verified Check-Out at ${geoResult.workplace.name} (${formatDistance(geoResult.distance)} from branch center)`,
          ipAddress: req.ip,
          deviceInfo: req.headers['user-agent'] || 'Web Client'
        }).save();
      } catch (tErr) {
        console.error('Failed to record tracking log on check-out:', tErr.message);
      }
    } else {
      record.checkOut = {
        timestamp: now,
        ip: req.ip,
        verificationStatus: 'UNVERIFIED',
        verificationMethod: 'NONE'
      };
    }

    const checkInTime = new Date(record.checkIn.timestamp);
    const diffMs = now.getTime() - checkInTime.getTime();
    record.totalWorkMinutes = Math.max(0, Math.floor(diffMs / 60000));

    await record.save();

    await logAudit({
      userId: req.user?._id,
      action: 'EMPLOYEE_CLOCKED_OUT',
      resource: 'AttendanceRecord',
      resourceId: record._id,
      details: `Clocked out successfully. Total Work: ${record.totalWorkMinutes} mins. GPS Verified: ${geoResult.verified ? 'Yes' : 'No'}`,
      ip: req.ip
    });

    res.json({ 
      success: true, 
      data: record, 
      message: 'Clocked out successfully' 
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ 
      success: false, 
      code: error.code || 'ATTENDANCE_ERROR',
      message: error.message,
      data: error.data || null
    });
  }
};

// Employee: Get today's attendance status
export const getTodayAttendance = async (req, res) => {
  try {
    const employeeId = req.user?.employeeProfileId?._id || req.user?.employeeProfileId || mockData.adminEmployee._id;
    const date = new Date().toISOString().split('T')[0];

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const record = mockData.attendance.find(a => a.date === date);
      return res.json({
        success: true,
        data: {
          hasCheckedIn: !!record?.checkIn,
          hasCheckedOut: !!record?.checkOut,
          checkIn: record?.checkIn || null,
          checkOut: record?.checkOut || null,
          totalWorkMinutes: record ? Math.round((record.workHours || 0) * 60) : 0,
          status: record?.status || 'ABSENT'
        }
      });
    }

    const record = await AttendanceRecord.findOne({ employeeId, date });
    res.json({
      success: true,
      data: {
        hasCheckedIn: !!record?.checkIn?.timestamp,
        hasCheckedOut: !!record?.checkOut?.timestamp,
        checkIn: record?.checkIn?.timestamp || null,
        checkOut: record?.checkOut?.timestamp || null,
        totalWorkMinutes: record?.totalWorkMinutes || 0,
        status: record?.status || 'NOT_CHECKED_IN',
        record
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Employee: Get my attendance history & stats
export const getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.user?.employeeProfileId?._id || req.user?.employeeProfileId || mockData.adminEmployee._id;
    
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        data: {
          records: mockData.attendance,
          stats: {
            totalDays: mockData.attendance.length,
            presentCount: mockData.attendance.filter(a => a.status === 'PRESENT').length,
            lateCount: 1,
            totalWorkHours: 38.5,
            avgDailyHours: 7.7
          }
        }
      });
    }

    const { month, year } = req.query;
    let query = { employeeId };

    if (month && year) {
      const mStr = String(month).padStart(2, '0');
      query.date = { $regex: `^${year}-${mStr}` };
    }

    const records = await AttendanceRecord.find(query).sort({ date: -1 });

    const totalDays = records.length;
    const presentCount = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const lateCount = records.filter(r => r.status === 'LATE').length;
    const totalMinutes = records.reduce((acc, curr) => acc + (curr.totalWorkMinutes || 0), 0);
    const totalWorkHours = Number((totalMinutes / 60).toFixed(1));
    const avgDailyHours = presentCount > 0 ? Number((totalWorkHours / presentCount).toFixed(1)) : 0;

    res.json({
      success: true,
      data: {
        records,
        stats: {
          totalDays,
          presentCount,
          lateCount,
          totalWorkHours,
          avgDailyHours
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get daily attendance of all employees
export const getDailyAttendance = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: mockData.attendance });
    }
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const records = await AttendanceRecord.find({ date }).populate('employeeId', 'personalDetails employeeCode jobDetails');
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Employee: Submit attendance correction request
export const submitAttendanceCorrection = async (req, res) => {
  try {
    const employeeId = req.user?.employeeProfileId?._id || req.user?.employeeProfileId || mockData.adminEmployee._id;
    const { date, checkInTime, checkOutTime, reason } = req.body;

    if (!date || !checkInTime || !checkOutTime || !reason) {
      return res.status(400).json({ success: false, message: 'Date, check-in time, check-out time, and reason are required' });
    }

    const correction = new AttendanceCorrection({
      employeeId,
      date,
      checkInTime,
      checkOutTime,
      reason
    });

    await correction.save();
    res.status(201).json({ success: true, data: correction, message: 'Attendance correction request submitted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Employee: Get own attendance correction requests
export const getMyAttendanceCorrections = async (req, res) => {
  try {
    const employeeId = req.user?.employeeProfileId?._id || req.user?.employeeProfileId || mockData.adminEmployee._id;
    const corrections = await AttendanceCorrection.find({ employeeId }).sort({ createdAt: -1 });
    res.json({ success: true, data: corrections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all attendance correction requests
export const getAllAttendanceCorrections = async (req, res) => {
  try {
    const corrections = await AttendanceCorrection.find()
      .populate('employeeId', 'personalDetails employeeCode')
      .populate('reviewedBy', 'email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: corrections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Review attendance correction request (Approve/Reject)
export const reviewAttendanceCorrection = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewRemarks } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED' });
    }

    const correction = await AttendanceCorrection.findById(id);
    if (!correction) {
      return res.status(404).json({ success: false, message: 'Correction request not found' });
    }

    correction.status = status;
    correction.reviewRemarks = reviewRemarks || '';
    correction.reviewedBy = req.user._id;
    await correction.save();

    // If approved, update or create the AttendanceRecord for that date!
    if (status === 'APPROVED') {
      const [inH, inM] = correction.checkInTime.split(':').map(Number);
      const [outH, outM] = correction.checkOutTime.split(':').map(Number);

      const checkInDate = new Date(`${correction.date}T${String(inH).padStart(2, '0')}:${String(inM).padStart(2, '0')}:00`);
      const checkOutDate = new Date(`${correction.date}T${String(outH).padStart(2, '0')}:${String(outM).padStart(2, '0')}:00`);
      const totalMinutes = Math.max(0, Math.floor((checkOutDate.getTime() - checkInDate.getTime()) / 60000));

      let record = await AttendanceRecord.findOne({ employeeId: correction.employeeId, date: correction.date });
      if (!record) {
        record = new AttendanceRecord({
          employeeId: correction.employeeId,
          date: correction.date,
          status: 'PRESENT'
        });
      }

      record.checkIn = { timestamp: checkInDate, ip: 'Correction Approved' };
      record.checkOut = { timestamp: checkOutDate, ip: 'Correction Approved' };
      record.totalWorkMinutes = totalMinutes;
      record.status = 'PRESENT';
      await record.save();
    }

    res.json({ success: true, data: correction, message: `Correction request ${status.toLowerCase()} successfully` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Admin: Manually log or override attendance for an employee
export const manualRecordAttendance = async (req, res) => {
  try {
    const { employeeId, date, checkInTime, checkOutTime, status } = req.body;
    if (!employeeId || !date) {
      return res.status(400).json({ success: false, message: 'Employee ID and date are required' });
    }

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const demoRec = {
        _id: 'att-' + Date.now(),
        employeeId: mockData.employees.find(e => e._id === employeeId) || mockData.adminEmployee,
        date,
        checkIn: checkInTime || '09:00',
        checkOut: checkOutTime || '17:00',
        status: status || 'PRESENT',
        workHours: 8
      };
      mockData.attendance.unshift(demoRec);
      return res.status(201).json({ success: true, data: demoRec, message: 'Attendance record saved (Demo Mode)' });
    }

    let record = await AttendanceRecord.findOne({ employeeId, date });
    const isNew = !record;
    if (!record) {
      record = new AttendanceRecord({ employeeId, date });
    }

    if (checkInTime) {
      const [h, m] = checkInTime.split(':').map(Number);
      const inDate = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
      record.checkIn = { timestamp: inDate, ip: 'Admin Manual Entry' };
    }

    if (checkOutTime) {
      const [h, m] = checkOutTime.split(':').map(Number);
      const outDate = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
      record.checkOut = { timestamp: outDate, ip: 'Admin Manual Entry' };
    }

    if (record.checkIn?.timestamp && record.checkOut?.timestamp) {
      const diffMs = new Date(record.checkOut.timestamp).getTime() - new Date(record.checkIn.timestamp).getTime();
      record.totalWorkMinutes = Math.max(0, Math.floor(diffMs / 60000));
    }

    record.status = status || (record.checkIn ? 'PRESENT' : 'ABSENT');
    await record.save();

    await logAudit({
      userId: req.user?._id,
      action: isNew ? 'CREATE' : 'UPDATE',
      module: 'ATTENDANCE',
      resourceId: record._id,
      newState: { employeeId, date, status: record.status },
      req
    });

    const populated = await AttendanceRecord.findById(record._id).populate('employeeId', 'personalDetails employeeCode');
    res.status(201).json({ success: true, data: populated, message: 'Attendance recorded successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Admin: Delete an attendance record
export const deleteAttendanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      mockData.attendance = mockData.attendance.filter(a => a._id !== id);
      return res.json({ success: true, message: 'Attendance record removed' });
    }

    const record = await AttendanceRecord.findByIdAndDelete(id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    await logAudit({
      userId: req.user?._id,
      action: 'DELETE',
      module: 'ATTENDANCE',
      resourceId: id,
      previousState: record,
      req
    });

    res.json({ success: true, message: 'Attendance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

