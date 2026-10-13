import mongoose from 'mongoose';
import { Shift } from '../models/Shift.js';
import { ShiftAssignment } from '../models/ShiftAssignment.js';
import { Employee } from '../models/Employee.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';

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
