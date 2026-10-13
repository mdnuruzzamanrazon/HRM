import mongoose from 'mongoose';
import { LeaveApplication } from '../models/Leave.js';
import { Employee } from '../models/Employee.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';

// Apply for leave (Employee)
export const applyLeave = async (req, res) => {
  try {
    const employeeId = req.user?.employeeProfileId || mockData.adminEmployee._id;
    const { leaveType, startDate, endDate, reason } = req.body;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const newLeave = {
        _id: 'leave-' + Date.now(),
        employeeId: mockData.adminEmployee,
        leaveType: leaveType || 'ANNUAL',
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0],
        reason: reason || 'Demo Leave Request',
        status: 'PENDING',
        appliedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      mockData.leaves.unshift(newLeave);
      return res.status(201).json({ success: true, data: newLeave, message: 'Leave application submitted successfully' });
    }

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
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: mockData.leaves });
    }
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
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: mockData.leaves });
    }
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
    const approverId = req.user?.employeeProfileId || mockData.adminEmployee._id;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const leave = mockData.leaves.find(l => l._id === id);
      if (leave) {
        leave.status = status;
        leave.remarks = remarks;
        if (status === 'APPROVED' || status === 'REJECTED') {
          leave.approvedBy = mockData.adminEmployee;
        }
      }
      return res.json({ 
        success: true, 
        data: leave || { _id: id, status, remarks }, 
        message: `Leave application ${status.toLowerCase()}` 
      });
    }

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
