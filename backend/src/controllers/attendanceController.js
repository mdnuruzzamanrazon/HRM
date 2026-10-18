import mongoose from 'mongoose';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { AttendanceCorrection } from '../models/AttendanceCorrection.js';
import { Employee } from '../models/Employee.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';

export const clockIn = async (req, res) => {
  try {
    const employeeId = req.body.employeeId || req.user?.employeeProfileId?._id || req.user?.employeeProfileId || mockData.adminEmployee._id;
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

    record.checkIn = {
      timestamp: now,
      ip: req.ip
    };
    if (!existingRecord) {
      record.status = isLate ? 'LATE' : 'PRESENT';
    }

    await record.save();
    res.status(201).json({ success: true, data: record, message: isLate ? 'Clocked in (Marked Late)' : 'Clocked in successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clockOut = async (req, res) => {
  try {
    const employeeId = req.body.employeeId || req.user?.employeeProfileId?._id || req.user?.employeeProfileId || mockData.adminEmployee._id;
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

    const now = new Date();
    record.checkOut = {
      timestamp: now,
      ip: req.ip
    };

    const checkInTime = new Date(record.checkIn.timestamp);
    const diffMs = now.getTime() - checkInTime.getTime();
    record.totalWorkMinutes = Math.max(0, Math.floor(diffMs / 60000));

    await record.save();
    res.json({ success: true, data: record, message: 'Clocked out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
