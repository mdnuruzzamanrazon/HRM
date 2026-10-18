import mongoose from 'mongoose';
import { Expense } from '../models/Expense.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';
import { logAudit } from '../utils/auditLogger.js';

// Employee: Submit a new expense
export const submitExpense = async (req, res) => {
  try {
    const employeeId = req.user?.employeeProfileId || mockData.adminEmployee._id;
    const { expenseType, amount, dateIncurred, description } = req.body;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const newExp = {
        _id: 'exp-' + Date.now(),
        employeeId: mockData.adminEmployee,
        category: expenseType || 'OTHER',
        expenseType: expenseType || 'OTHER',
        amount: Number(amount) || 120,
        currency: 'USD',
        description: description || 'Demo Expense Claim',
        status: 'PENDING',
        dateIncurred: dateIncurred || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };
      mockData.expenses.unshift(newExp);
      return res.status(201).json({ success: true, data: newExp, message: 'Expense submitted successfully' });
    }

    const expense = new Expense({
      employeeId,
      expenseType,
      amount,
      dateIncurred,
      description
    });

    await expense.save();
    res.status(201).json({ success: true, data: expense, message: 'Expense submitted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Employee: Get own expenses
export const getMyExpenses = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: mockData.expenses });
    }
    const employeeId = req.user.employeeProfileId;
    const expenses = await Expense.find({ employeeId }).sort({ createdAt: -1 });
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin/Finance: Get all expenses
export const getAllExpenses = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: mockData.expenses });
    }
    const expenses = await Expense.find()
      .populate('employeeId', 'personalDetails employeeCode')
      .populate('approvedBy', 'personalDetails')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin/Finance: Update expense status (Approve, Reject, Reimburse)
export const updateExpenseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const approverId = req.user?.employeeProfileId || mockData.adminEmployee._id;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const exp = mockData.expenses.find(e => e._id === id);
      if (exp) {
        exp.status = status;
        exp.remarks = remarks;
        if (status !== 'PENDING') {
          exp.approvedBy = mockData.adminEmployee;
        }
      }
      return res.json({ 
        success: true, 
        data: exp || { _id: id, status, remarks }, 
        message: `Expense marked as ${status.toLowerCase()}` 
      });
    }

    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    expense.status = status;
    expense.remarks = remarks;
    if (status !== 'PENDING') {
      expense.approvedBy = approverId;
    }

    await expense.save();

    await logAudit({
      userId: approverId,
      action: 'UPDATE',
      module: 'EXPENSE_APPROVAL',
      resourceId: id,
      newState: { status, remarks },
      req
    });

    res.json({ success: true, data: expense, message: `Expense marked as ${status.toLowerCase()}` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Admin: Submit expense claim on behalf of an employee
export const adminCreateExpense = async (req, res) => {
  try {
    const { employeeId, expenseType, amount, dateIncurred, description, status } = req.body;

    if (!employeeId || !amount) {
      return res.status(400).json({ success: false, message: 'Employee and amount are required' });
    }

    const expAmount = Number(amount);
    const expStatus = status || 'APPROVED';

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const demoExp = {
        _id: 'exp-' + Date.now(),
        employeeId: mockData.employees.find(e => e._id === employeeId) || mockData.adminEmployee,
        category: expenseType || 'OTHER',
        expenseType: expenseType || 'OTHER',
        amount: expAmount,
        currency: 'USD',
        description: description || 'Administrative expense disbursement',
        status: expStatus,
        dateIncurred: dateIncurred || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      mockData.expenses.unshift(demoExp);
      return res.status(201).json({ success: true, data: demoExp, message: 'Expense claim recorded (Demo Mode)' });
    }

    const expense = new Expense({
      employeeId,
      expenseType: expenseType || 'OTHER',
      amount: expAmount,
      dateIncurred: dateIncurred ? new Date(dateIncurred) : new Date(),
      description: description || 'Administrative reimbursement record',
      status: expStatus,
      approvedBy: expStatus !== 'PENDING' ? req.user?._id : undefined
    });

    await expense.save();

    await logAudit({
      userId: req.user?._id,
      action: 'CREATE',
      module: 'EXPENSE',
      resourceId: expense._id,
      newState: expense,
      req
    });

    const populated = await Expense.findById(expense._id).populate('employeeId', 'personalDetails employeeCode');
    res.status(201).json({ success: true, data: populated, message: 'Expense claim created successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Admin: Delete an expense record
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      mockData.expenses = mockData.expenses.filter(e => e._id !== id);
      return res.json({ success: true, message: 'Expense deleted (Demo Mode)' });
    }

    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    await logAudit({
      userId: req.user?._id,
      action: 'DELETE',
      module: 'EXPENSE',
      resourceId: id,
      previousState: expense,
      req
    });

    res.json({ success: true, message: 'Expense record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

