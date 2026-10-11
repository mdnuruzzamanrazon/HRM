import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { Employee } from '../models/Employee.js';

export const clockIn = async (req, res) => {
  try {
    const employeeId = req.body.employeeId || req.user.employeeProfileId;
    
    if (!employeeId) {
       return res.status(400).json({ success: false, message: 'Employee Profile ID is required to clock in.' });
    }

    const date = new Date().toISOString().split('T')[0];

    const existingRecord = await AttendanceRecord.findOne({ employeeId, date });
    if (existingRecord) {
      return res.status(400).json({ success: false, message: 'Already clocked in for today' });
    }

    const record = new AttendanceRecord({
      employeeId,
      date,
      checkIn: {
        timestamp: new Date(),
        ip: req.ip
      },
      status: 'PRESENT'
    });

    await record.save();
    res.status(201).json({ success: true, data: record, message: 'Clocked in successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clockOut = async (req, res) => {
  try {
    const employeeId = req.body.employeeId || req.user.employeeProfileId;
    const date = new Date().toISOString().split('T')[0];

    const record = await AttendanceRecord.findOne({ employeeId, date });
    if (!record) {
      return res.status(404).json({ success: false, message: 'No check-in record found for today' });
    }
    
    if (record.checkOut && record.checkOut.timestamp) {
      return res.status(400).json({ success: false, message: 'Already clocked out' });
    }

    record.checkOut = {
      timestamp: new Date(),
      ip: req.ip
    };

    const checkInTime = new Date(record.checkIn.timestamp);
    const checkOutTime = new Date(record.checkOut.timestamp);
    const diffMs = checkOutTime - checkInTime;
    record.totalWorkMinutes = Math.floor(diffMs / 60000);

    await record.save();
    res.json({ success: true, data: record, message: 'Clocked out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDailyAttendance = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const records = await AttendanceRecord.find({ date }).populate('employeeId', 'personalDetails employeeCode jobDetails');
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
