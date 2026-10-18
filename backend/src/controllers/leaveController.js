import mongoose from 'mongoose';
import { LeaveApplication } from '../models/Leave.js';
import { Employee } from '../models/Employee.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';

// Apply for leave (Employee)
export const applyLeave = async (req, res) => {
  try {
    const employeeId = req.user?.employeeProfileId?._id || req.user?.employeeProfileId || mockData.adminEmployee._id;
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Leave type, start date, and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    const totalDays = req.body.totalDays ? Number(req.body.totalDays) : calculatedDays;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const newLeave = {
        _id: 'leave-' + Date.now(),
        employeeId: mockData.adminEmployee,
        leaveType: leaveType || 'ANNUAL',
        startDate: startDate,
        endDate: endDate,
        totalDays,
        reason: reason || 'Leave Request',
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
      startDate: start,
      endDate: end,
      totalDays,
      reason: reason || '',
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
    const employeeId = req.user?.employeeProfileId?._id || req.user?.employeeProfileId || mockData.adminEmployee._id;
    
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: mockData.leaves });
    }
    const leaves = await LeaveApplication.find({ employeeId }).sort({ createdAt: -1 });
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Employee: Get leave balances & summary
export const getLeaveBalances = async (req, res) => {
  try {
    const employeeId = req.user?.employeeProfileId?._id || req.user?.employeeProfileId || mockData.adminEmployee._id;

    const quotas = {
      ANNUAL: 20,
      SICK: 10,
      CASUAL: 7,
      MATERNITY: 90,
      UNPAID: 30
    };

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        data: {
          balances: [
            { type: 'Annual Leave', code: 'ANNUAL', total: 20, used: 4, remaining: 16 },
            { type: 'Sick Leave', code: 'SICK', total: 10, used: 2, remaining: 8 },
            { type: 'Casual Leave', code: 'CASUAL', total: 7, used: 1, remaining: 6 },
            { type: 'Unpaid Leave', code: 'UNPAID', total: 30, used: 0, remaining: 30 }
          ],
          summary: {
            totalQuota: 37,
            totalUsed: 7,
            totalRemaining: 30,
            pendingRequests: 1
          }
        }
      });
    }

    const approvedLeaves = await LeaveApplication.find({
      employeeId,
      status: 'APPROVED'
    });

    const pendingLeaves = await LeaveApplication.find({
      employeeId,
      status: 'PENDING'
    });

    const usedByType = { ANNUAL: 0, SICK: 0, CASUAL: 0, MATERNITY: 0, UNPAID: 0 };
    approvedLeaves.forEach(l => {
      const type = (l.leaveType || 'ANNUAL').toUpperCase();
      if (usedByType[type] !== undefined) {
        usedByType[type] += (l.totalDays || 1);
      }
    });

    const balances = [
      { type: 'Annual Leave', code: 'ANNUAL', total: quotas.ANNUAL, used: usedByType.ANNUAL, remaining: Math.max(0, quotas.ANNUAL - usedByType.ANNUAL) },
      { type: 'Sick Leave', code: 'SICK', total: quotas.SICK, used: usedByType.SICK, remaining: Math.max(0, quotas.SICK - usedByType.SICK) },
      { type: 'Casual Leave', code: 'CASUAL', total: quotas.CASUAL, used: usedByType.CASUAL, remaining: Math.max(0, quotas.CASUAL - usedByType.CASUAL) },
      { type: 'Unpaid Leave', code: 'UNPAID', total: quotas.UNPAID, used: usedByType.UNPAID, remaining: Math.max(0, quotas.UNPAID - usedByType.UNPAID) }
    ];

    const totalQuota = quotas.ANNUAL + quotas.SICK + quotas.CASUAL;
    const totalUsed = usedByType.ANNUAL + usedByType.SICK + usedByType.CASUAL;

    res.json({
      success: true,
      data: {
        balances,
        summary: {
          totalQuota,
          totalUsed,
          totalRemaining: Math.max(0, totalQuota - totalUsed),
          pendingRequests: pendingLeaves.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Employee: Cancel/Withdraw pending leave application
export const cancelLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user?.employeeProfileId?._id || req.user?.employeeProfileId || mockData.adminEmployee._id;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const leave = mockData.leaves.find(l => l._id === id);
      if (leave) leave.status = 'CANCELLED';
      return res.json({ success: true, message: 'Leave application cancelled successfully' });
    }

    const leave = await LeaveApplication.findOne({ _id: id, employeeId });
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave application not found' });
    }

    if (leave.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Only pending applications can be cancelled' });
    }

    leave.status = 'CANCELLED';
    await leave.save();

    res.json({ success: true, data: leave, message: 'Leave application cancelled successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
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
      .populate('auditTrail.actorId', 'email')
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
    const approverId = req.user?._id;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const leave = mockData.leaves.find(l => l._id === id);
      if (leave) {
        leave.status = status;
        leave.remarks = remarks;
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
    leave.auditTrail.push({
      actorId: approverId,
      action: status,
      comment: remarks || '',
      timestamp: new Date()
    });

    await leave.save();
    res.json({ success: true, data: leave, message: `Leave application ${status.toLowerCase()}` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
