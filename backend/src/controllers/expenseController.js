import mongoose from 'mongoose';
import { Expense } from '../models/Expense.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';

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
        amount: Number(amount) || 120,
        currency: 'USD',
        description: description || 'Demo Expense Claim',
        status: 'PENDING',
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
    const approverId = req.user.employeeProfileId;

    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    expense.status = status;
    expense.remarks = remarks;
    if (status !== 'PENDING') {
      expense.approvedBy = approverId;
    }

    await expense.save();
    res.json({ success: true, data: expense, message: `Expense marked as ${status.toLowerCase()}` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
