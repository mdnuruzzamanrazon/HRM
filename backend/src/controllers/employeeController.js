import mongoose from 'mongoose';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { hashPassword } from '../utils/authUtils.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';

export const getEmployees = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: mockData.employees });
    }
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const emp = mockData.employees.find(e => e._id === req.params.id) || mockData.employees[0];
      return res.json({ success: true, data: emp });
    }
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const { firstName, lastName, email, employeeCode, title, joinDate } = req.body;
    
    // Create Employee
    const employee = new Employee({
      employeeCode,
      personalDetails: { firstName, lastName },
      jobDetails: { title, joinDate, status: 'ACTIVE' }
    });
    await employee.save();

    // Auto-create User account
    if (email) {
      const passwordHash = await hashPassword('CBDP@123'); // Default password
      const user = new User({
        email,
        passwordHash,
        role: 'EMPLOYEE',
        employeeProfileId: employee._id
      });
      await user.save();
    }

    res.status(201).json({ success: true, data: employee, message: 'Employee created successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
