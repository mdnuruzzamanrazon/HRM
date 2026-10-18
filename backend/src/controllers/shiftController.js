import mongoose from 'mongoose';
import { Shift } from '../models/Shift.js';
import { ShiftAssignment } from '../models/ShiftAssignment.js';
import { Employee } from '../models/Employee.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';
import { logAudit } from '../utils/auditLogger.js';

export const createShift = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const newShift = { _id: 'shift-' + Date.now(), ...req.body };
      mockData.shifts.push(newShift);
      return res.status(201).json({ success: true, data: newShift, message: 'Shift created successfully' });
    }
    const shift = new Shift(req.body);
    await shift.save();
    res.status(201).json({ success: true, data: shift, message: 'Shift created successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getShifts = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: mockData.shifts });
    }
    const shifts = await Shift.find({ isActive: true });
    res.json({ success: true, data: shifts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignShift = async (req, res) => {
  try {
    const { employeeId, shiftId } = req.body;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const assignment = {
        _id: 'sa-' + Date.now(),
        employeeId: mockData.employees.find(e => e._id === employeeId) || mockData.adminEmployee,
        shiftId: mockData.shifts.find(s => s._id === shiftId) || mockData.shifts[0],
        isActive: true
      };
      return res.status(201).json({ success: true, data: assignment, message: 'Shift assigned successfully' });
    }

    // Inactivate previous assignments for this employee
    await ShiftAssignment.updateMany(
      { employeeId, isActive: true },
      { isActive: false }
    );

    const assignment = new ShiftAssignment({ employeeId, shiftId });
    await assignment.save();

    res.status(201).json({ success: true, data: assignment, message: 'Shift assigned successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getShiftAssignments = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const demoAssignments = mockData.employees.map((emp, idx) => ({
        _id: 'sa-' + idx,
        employeeId: emp,
        shiftId: mockData.shifts[idx % mockData.shifts.length],
        isActive: true,
      }));
      return res.json({ success: true, data: demoAssignments });
    }
    const assignments = await ShiftAssignment.find({ isActive: true })
      .populate('employeeId', 'personalDetails employeeCode')
      .populate('shiftId');
    res.json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyShift = async (req, res) => {
  try {
    const employeeId = req.user?.employeeProfileId?._id || req.user?.employeeProfileId || mockData.adminEmployee._id;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        data: {
          shift: mockData.shifts[0] || { name: 'Standard Day Shift', startTime: '09:00', endTime: '17:00', workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }
        }
      });
    }

    const assignment = await ShiftAssignment.findOne({ employeeId, isActive: true }).populate('shiftId');
    if (!assignment || !assignment.shiftId) {
      const defaultShift = await Shift.findOne({ isActive: true });
      return res.json({
        success: true,
        data: {
          shift: defaultShift || { name: 'Regular Office Shift', startTime: '09:00', endTime: '17:00', workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }
        }
      });
    }

    res.json({ success: true, data: { shift: assignment.shiftId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Update existing shift details
export const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startTime, endTime, workDays, description } = req.body;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const s = mockData.shifts.find(item => item._id === id);
      if (s) {
        if (name) s.name = name;
        if (startTime) s.startTime = startTime;
        if (endTime) s.endTime = endTime;
        if (workDays) s.workDays = workDays;
      }
      return res.json({ success: true, data: s, message: 'Shift updated successfully (Demo Mode)' });
    }

    const shift = await Shift.findByIdAndUpdate(
      id,
      { name, startTime, endTime, workDays, description },
      { new: true }
    );
    if (!shift) return res.status(404).json({ success: false, message: 'Shift not found' });

    await logAudit({
      userId: req.user?._id,
      action: 'UPDATE',
      module: 'SHIFT',
      resourceId: id,
      newState: shift,
      req
    });

    res.json({ success: true, data: shift, message: 'Shift updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Admin: Delete a shift
export const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      mockData.shifts = mockData.shifts.filter(s => s._id !== id);
      return res.json({ success: true, message: 'Shift deleted (Demo Mode)' });
    }

    const shift = await Shift.findByIdAndDelete(id);
    if (!shift) return res.status(404).json({ success: false, message: 'Shift not found' });

    // Also remove associated assignments
    await ShiftAssignment.deleteMany({ shiftId: id });

    await logAudit({
      userId: req.user?._id,
      action: 'DELETE',
      module: 'SHIFT',
      resourceId: id,
      previousState: shift,
      req
    });

    res.json({ success: true, message: 'Shift and its assignments deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Remove an employee from a shift assignment
export const deleteShiftAssignment = async (req, res) => {
  try {
    const { id } = req.params; // assignment ID

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, message: 'Assignment removed (Demo Mode)' });
    }

    const assignment = await ShiftAssignment.findByIdAndDelete(id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    await logAudit({
      userId: req.user?._id,
      action: 'DELETE',
      module: 'SHIFT_ASSIGNMENT',
      resourceId: id,
      previousState: assignment,
      req
    });

    res.json({ success: true, message: 'Shift assignment removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

