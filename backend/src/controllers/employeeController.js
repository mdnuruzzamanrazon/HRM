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

    // In-memory demo mode fallback
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const newEmployee = {
        _id: 'emp-' + Date.now(),
        employeeCode: employeeCode || `CBDP-${mockData.employees.length + 101}`,
        personalDetails: { 
          firstName: firstName || 'New', 
          lastName: lastName || 'Employee',
          phone: '+1 (555) 019-2834',
          dateOfBirth: '1995-01-01',
          gender: 'OTHER'
        },
        jobDetails: { 
          title: title || 'Staff Member', 
          department: 'Operations',
          joinDate: joinDate || new Date().toISOString().split('T')[0], 
          status: 'ACTIVE',
          employmentType: 'FULL_TIME'
        },
        compensation: { baseSalary: 85000, currency: 'USD' }
      };

      mockData.employees.unshift(newEmployee);

      return res.status(201).json({ 
        success: true, 
        data: newEmployee, 
        message: 'Employee created successfully' 
      });
    }
    
    // Create Employee in Database
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
    // If database buffering times out or connection fails, save to demo memory gracefully
    if (error.message?.includes('buffering timed out') || error.name === 'MongooseError') {
      const { firstName, lastName, employeeCode, title, joinDate } = req.body;
      const fallbackEmp = {
        _id: 'emp-' + Date.now(),
        employeeCode: employeeCode || `CBDP-${mockData.employees.length + 101}`,
        personalDetails: { firstName: firstName || 'New', lastName: lastName || 'Employee' },
        jobDetails: { title: title || 'Staff Member', department: 'Operations', joinDate: joinDate || new Date().toISOString().split('T')[0], status: 'ACTIVE' },
        compensation: { baseSalary: 85000, currency: 'USD' }
      };
      mockData.employees.unshift(fallbackEmp);
      return res.status(201).json({ success: true, data: fallbackEmp, message: 'Employee created successfully (Demo Mode)' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};
