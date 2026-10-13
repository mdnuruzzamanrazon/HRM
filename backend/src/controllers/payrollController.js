import mongoose from 'mongoose';
import { Payroll } from '../models/Payroll.js';
import { Employee } from '../models/Employee.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';

// Admin: Generate Payroll for a specific month/year
export const generatePayroll = async (req, res) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.status(201).json({ success: true, message: `Generated 6 payslips successfully (Demo Mode).` });
    }

    // Check if payroll already exists for this period
    const existingCount = await Payroll.countDocuments({ month, year });
    if (existingCount > 0) {
      return res.status(400).json({ success: false, message: 'Payroll for this month/year has already been generated.' });
    }

    const employees = await Employee.find({ 'jobDetails.status': 'ACTIVE' });
    
    const payslips = employees.map(emp => {
      const baseSalary = emp.jobDetails?.salary || 5000;
      const allowances = 500;
      const deductions = 200;
      const netSalary = baseSalary + allowances - deductions;

      return {
        employeeId: emp._id,
        month,
        year,
        baseSalary,
        allowances,
        deductions,
        netSalary,
        status: 'PENDING'
      };
    });

    if (payslips.length > 0) {
      await Payroll.insertMany(payslips);
    }

    res.status(201).json({ success: true, message: `Generated ${payslips.length} payslips successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all payslips
export const getAllPayslips = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: mockData.payrolls });
    }
    const payslips = await Payroll.find()
      .populate('employeeId', 'personalDetails employeeCode')
      .sort({ year: -1, month: -1 });
    res.json({ success: true, data: payslips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Employee: Get my payslips
export const getMyPayslips = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: mockData.payrolls });
    }
    const employeeId = req.user.employeeProfileId;
    const payslips = await Payroll.find({ employeeId }).sort({ year: -1, month: -1 });
    res.json({ success: true, data: payslips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Update status (e.g. PAID)
export const updatePayslipStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const payslip = mockData.payrolls.find(p => p._id === id);
      if (payslip) {
        payslip.status = status;
      }
      return res.json({ success: true, data: payslip || { _id: id, status }, message: 'Payslip status updated' });
    }

    const payslip = await Payroll.findByIdAndUpdate(id, { status }, { new: true });
    if (!payslip) return res.status(404).json({ success: false, message: 'Payslip not found' });

    res.json({ success: true, data: payslip, message: 'Payslip status updated' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
