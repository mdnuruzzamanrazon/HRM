import { Shift } from '../models/Shift.js';
import { ShiftAssignment } from '../models/ShiftAssignment.js';
import { Employee } from '../models/Employee.js';

export const createShift = async (req, res) => {
  try {
    const shift = new Shift(req.body);
    await shift.save();
    res.status(201).json({ success: true, data: shift, message: 'Shift created successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getShifts = async (req, res) => {
  try {
    const shifts = await Shift.find({ isActive: true });
    res.json({ success: true, data: shifts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignShift = async (req, res) => {
  try {
    const { employeeId, shiftId } = req.body;
    
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
    const assignments = await ShiftAssignment.find({ isActive: true })
      .populate('employeeId', 'personalDetails employeeCode')
      .populate('shiftId');
    res.json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
