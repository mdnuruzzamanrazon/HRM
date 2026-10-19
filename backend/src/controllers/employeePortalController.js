import mongoose from 'mongoose';
import { Employee } from '../models/Employee.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { LeaveApplication } from '../models/Leave.js';
import { Payroll } from '../models/Payroll.js';
import { Notice } from '../models/Notice.js';
import { ShiftAssignment } from '../models/ShiftAssignment.js';
import { Shift } from '../models/Shift.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';

export const getEmployeeDashboardData = async (req, res) => {
  try {
    const employeeId = req.user?.employeeProfileId?._id || req.user?.employeeProfileId || mockData.adminEmployee._id;
    const today = new Date().toISOString().split('T')[0];

    // Demo Mode Fallback
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const todayRecord = mockData.attendance.find(a => a.date === today);
      return res.json({
        success: true,
        data: {
          employee: mockData.adminEmployee,
          todayAttendance: {
            hasCheckedIn: !!todayRecord?.checkIn,
            hasCheckedOut: !!todayRecord?.checkOut,
            checkIn: todayRecord?.checkIn || null,
            checkOut: todayRecord?.checkOut || null,
            totalWorkMinutes: todayRecord ? Math.round((todayRecord.workHours || 0) * 60) : 0,
            status: todayRecord?.status || 'NOT_CHECKED_IN'
          },
          attendanceSummary: {
            totalDays: mockData.attendance.length,
            presentCount: 22,
            lateCount: 1,
            totalWorkHours: 176
          },
          leaveSummary: {
            available: 24,
            pending: 1,
            approved: 6,
            rejected: 0,
            usedDays: 7
          },
          recentAttendance: mockData.attendance.slice(0, 7),
          recentLeaves: mockData.leaves.slice(0, 5),
          recentPayslip: mockData.payrolls[0] || null,
          notices: mockData.notices?.slice(0, 3) || []
        }
      });
    }

    // 1. Fetch Employee Profile
    let employee = await Employee.findById(employeeId)
      .populate('jobDetails.departmentId', 'name')
      .populate('jobDetails.managerId', 'personalDetails employeeCode');

    if (!employee || employee.isDeleted) {
      if (['SUPER_ADMIN', 'HR_ADMIN'].includes(req.user?.role)) {
        employee = await Employee.findOne({ isDeleted: { $ne: true } })
          .populate('jobDetails.departmentId', 'name')
          .populate('jobDetails.managerId', 'personalDetails employeeCode');
      } else {
        return res.status(404).json({ success: false, message: 'Employee profile not found or inactive.' });
      }
    }

    // 2. Fetch Today's Attendance
    const todayRecord = await AttendanceRecord.findOne({ employeeId, date: today });

    // 3. Fetch Monthly Attendance Stats (current month)
    const currentMonth = today.slice(0, 7); // YYYY-MM
    const monthlyRecords = await AttendanceRecord.find({
      employeeId,
      date: { $regex: `^${currentMonth}` }
    }).sort({ date: -1 });

    const totalDaysPresent = monthlyRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const totalLate = monthlyRecords.filter(r => r.status === 'LATE').length;
    const totalMinutes = monthlyRecords.reduce((acc, curr) => acc + (curr.totalWorkMinutes || 0), 0);
    const totalWorkHours = Number((totalMinutes / 60).toFixed(1));

    // 4. Fetch Leave Statistics
    const allLeaves = await LeaveApplication.find({ employeeId }).sort({ createdAt: -1 });
    const pendingLeaves = allLeaves.filter(l => l.status === 'PENDING').length;
    const approvedLeaves = allLeaves.filter(l => l.status === 'APPROVED');
    const approvedCount = approvedLeaves.length;
    const rejectedCount = allLeaves.filter(l => l.status === 'REJECTED').length;
    const usedDays = approvedLeaves.reduce((acc, curr) => acc + (curr.totalDays || 1), 0);
    const leaveQuotaTotal = 37; // Standard annual quota
    const leaveAvailable = Math.max(0, leaveQuotaTotal - usedDays);

    // 5. Recent Attendance (Last 7 days)
    const recentAttendance = await AttendanceRecord.find({ employeeId }).sort({ date: -1 }).limit(7);

    // 6. Recent Payslip
    const recentPayslip = await Payroll.findOne({ employeeId }).sort({ year: -1, month: -1 });

    // 7. Active Shift
    let shiftInfo = null;
    const assignment = await ShiftAssignment.findOne({ employeeId, isActive: true }).populate('shiftId');
    if (assignment && assignment.shiftId) {
      shiftInfo = assignment.shiftId;
    } else {
      shiftInfo = await Shift.findOne({ isActive: true });
    }

    // 8. Recent Notices
    const notices = await Notice.find({ isActive: true }).sort({ createdAt: -1 }).limit(3);

    res.json({
      success: true,
      data: {
        employee,
        todayAttendance: {
          hasCheckedIn: !!todayRecord?.checkIn?.timestamp,
          hasCheckedOut: !!todayRecord?.checkOut?.timestamp,
          checkIn: todayRecord?.checkIn?.timestamp || null,
          checkOut: todayRecord?.checkOut?.timestamp || null,
          totalWorkMinutes: todayRecord?.totalWorkMinutes || 0,
          status: todayRecord?.status || 'NOT_CHECKED_IN'
        },
        attendanceSummary: {
          totalDays: monthlyRecords.length,
          presentCount: totalDaysPresent,
          lateCount: totalLate,
          totalWorkHours
        },
        leaveSummary: {
          available: leaveAvailable,
          pending: pendingLeaves,
          approved: approvedCount,
          rejected: rejectedCount,
          usedDays
        },
        recentAttendance,
        recentLeaves: allLeaves.slice(0, 5),
        recentPayslip,
        assignedShift: shiftInfo,
        notices
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmployeeProfile = async (req, res) => {
  try {
    const employeeId = req.user?.employeeProfileId?._id || req.user?.employeeProfileId || mockData.adminEmployee._id;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const allMockEmps = mockData.employees || [];
      const found = allMockEmps.find(e => e._id === employeeId || e.email === req.user?.email);
      return res.json({ success: true, data: found || mockData.adminEmployee });
    }

    const employee = await Employee.findById(employeeId)
      .populate('jobDetails.departmentId', 'name')
      .populate('jobDetails.managerId', 'personalDetails employeeCode');

    if (!employee || employee.isDeleted) {
      return res.status(404).json({ success: false, message: 'Employee profile not found or inactive' });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEmployeeProfile = async (req, res) => {
  try {
    const employeeId = req.user?.employeeProfileId?._id || req.user?.employeeProfileId;
    const { phone, contactAddress } = req.body;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, message: 'Profile updated successfully' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    if (phone !== undefined) employee.personalDetails.phone = phone;
    if (contactAddress !== undefined) employee.personalDetails.contactAddress = contactAddress;

    await employee.save();
    res.json({ success: true, data: employee, message: 'Profile contact details updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
