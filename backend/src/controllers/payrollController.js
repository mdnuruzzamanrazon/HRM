import mongoose from 'mongoose';
import { Payroll } from '../models/Payroll.js';
import { Employee } from '../models/Employee.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';
import { logAudit } from '../utils/auditLogger.js';

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

    await logAudit({
      userId: req.user?._id,
      action: 'UPDATE',
      module: 'PAYROLL',
      resourceId: id,
      newState: { status },
      req
    });

    res.json({ success: true, data: payslip, message: 'Payslip status updated' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Admin: Edit payslip salary breakdown (base, allowances, deductions, status)
export const updatePayslipDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { baseSalary, allowances, deductions, status } = req.body;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const p = mockData.payrolls.find(item => item._id === id);
      if (p) {
        if (baseSalary !== undefined) p.baseSalary = Number(baseSalary);
        if (allowances !== undefined) p.allowances = Number(allowances);
        if (deductions !== undefined) p.deductions = Number(deductions);
        if (status) p.status = status;
        p.netSalary = (p.baseSalary || 0) + (p.allowances || 0) - (p.deductions || 0);
      }
      return res.json({ success: true, data: p, message: 'Payslip updated successfully (Demo Mode)' });
    }

    const payslip = await Payroll.findById(id);
    if (!payslip) return res.status(404).json({ success: false, message: 'Payslip not found' });

    const prev = payslip.toObject();

    if (baseSalary !== undefined) payslip.baseSalary = Number(baseSalary);
    if (allowances !== undefined) payslip.allowances = Number(allowances);
    if (deductions !== undefined) payslip.deductions = Number(deductions);
    if (status) payslip.status = status;

    payslip.netSalary = Math.max(0, payslip.baseSalary + payslip.allowances - payslip.deductions);
    await payslip.save();

    await logAudit({
      userId: req.user?._id,
      action: 'UPDATE',
      module: 'PAYROLL_BREAKDOWN',
      resourceId: id,
      previousState: prev,
      newState: payslip,
      req
    });

    res.json({ success: true, data: payslip, message: 'Payslip structure updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Admin: Manually create a single payslip
export const createPayslipManual = async (req, res) => {
  try {
    const { employeeId, month, year, baseSalary, allowances, deductions, status } = req.body;

    if (!employeeId || !month || !year || baseSalary === undefined) {
      return res.status(400).json({ success: false, message: 'Employee, month, year, and base salary are required' });
    }

    const bSalary = Number(baseSalary);
    const allow = Number(allowances || 0);
    const deduct = Number(deductions || 0);
    const net = Math.max(0, bSalary + allow - deduct);

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const demoP = {
        _id: 'pay-' + Date.now(),
        employeeId: mockData.employees.find(e => e._id === employeeId) || mockData.adminEmployee,
        month: Number(month),
        year: Number(year),
        baseSalary: bSalary,
        allowances: allow,
        deductions: deduct,
        netSalary: net,
        status: status || 'PENDING'
      };
      mockData.payrolls.unshift(demoP);
      return res.status(201).json({ success: true, data: demoP, message: 'Payslip created (Demo Mode)' });
    }

    const payslip = new Payroll({
      employeeId,
      month: Number(month),
      year: Number(year),
      baseSalary: bSalary,
      allowances: allow,
      deductions: deduct,
      netSalary: net,
      status: status || 'PENDING'
    });

    await payslip.save();

    await logAudit({
      userId: req.user?._id,
      action: 'CREATE',
      module: 'PAYROLL',
      resourceId: payslip._id,
      newState: payslip,
      req
    });

    const populated = await Payroll.findById(payslip._id).populate('employeeId', 'personalDetails employeeCode');
    res.status(201).json({ success: true, data: populated, message: 'Payslip generated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Admin: Delete a payslip
export const deletePayslip = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      mockData.payrolls = mockData.payrolls.filter(p => p._id !== id);
      return res.json({ success: true, message: 'Payslip deleted (Demo Mode)' });
    }

    const payslip = await Payroll.findByIdAndDelete(id);
    if (!payslip) return res.status(404).json({ success: false, message: 'Payslip not found' });

    await logAudit({
      userId: req.user?._id,
      action: 'DELETE',
      module: 'PAYROLL',
      resourceId: id,
      previousState: payslip,
      req
    });

    res.json({ success: true, message: 'Payslip deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

