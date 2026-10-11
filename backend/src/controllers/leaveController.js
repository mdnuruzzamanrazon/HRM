import { LeaveApplication } from '../models/Leave.js';
import { Employee } from '../models/Employee.js';

// Apply for leave (Employee)
export const applyLeave = async (req, res) => {
  try {
    const employeeId = req.user.employeeProfileId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee Profile ID missing. Cannot apply for leave.' });
    }

    const { leaveType, startDate, endDate, reason } = req.body;

    const leave = new LeaveApplication({
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason,
      status: 'PENDING'
    });

    await leave.save();
    res.status(201).json({ success: true, data: leave, message: 'Leave application submitted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get my leaves (Employee)
export const getMyLeaves = async (req, res) => {
  try {
    const employeeId = req.user.employeeProfileId;
    const leaves = await LeaveApplication.find({ employeeId }).sort({ createdAt: -1 });
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all leaves (Admin/Manager)
export const getAllLeaves = async (req, res) => {
  try {
    const leaves = await LeaveApplication.find()
      .populate('employeeId', 'personalDetails employeeCode')
      .populate('approvedBy', 'personalDetails')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve/Reject leave (Admin/Manager)
export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const approverId = req.user.employeeProfileId;

    const leave = await LeaveApplication.findById(id);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave application not found' });

    leave.status = status;
    leave.remarks = remarks;
    if (status === 'APPROVED' || status === 'REJECTED') {
      leave.approvedBy = approverId;
    }

    await leave.save();
    res.json({ success: true, data: leave, message: `Leave application ${status.toLowerCase()}` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
