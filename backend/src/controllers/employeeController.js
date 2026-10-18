import mongoose from 'mongoose';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { hashPassword } from '../utils/authUtils.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';
import { logAudit } from '../utils/auditLogger.js';

// Get all employees with user account status
export const getEmployees = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: mockData.employees });
    }
    const employees = await Employee.find().sort({ createdAt: -1 });

    // Attach linked user account info (email, role, isActive, lastLoginAt)
    const employeeIds = employees.map(e => e._id);
    const users = await User.find({ employeeProfileId: { $in: employeeIds } })
      .select('email role isActive lastLoginAt employeeProfileId');

    const userMap = {};
    users.forEach(u => {
      userMap[u.employeeProfileId.toString()] = {
        _id: u._id,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt
      };
    });

    const enrichedEmployees = employees.map(emp => {
      const plain = emp.toObject();
      plain.userAccount = userMap[emp._id.toString()] || null;
      return plain;
    });

    res.json({ success: true, data: enrichedEmployees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const emp = mockData.employees.find(e => e._id === req.params.id) || mockData.employees[0];
      return res.json({ success: true, data: emp });
    }

    const employee = await Employee.findById(req.params.id)
      .populate('jobDetails.departmentId', 'name code')
      .populate('jobDetails.managerId', 'personalDetails employeeCode');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Attach user account
    const userAccount = await User.findOne({ employeeProfileId: employee._id })
      .select('email role isActive lastLoginAt createdAt');

    const plain = employee.toObject();
    plain.user = userAccount || null;

    res.json({ success: true, data: plain });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new employee
export const createEmployee = async (req, res) => {
  try {
    const { 
      firstName, lastName, email, employeeCode, 
      title, joinDate, phone, contactAddress, dob, 
      gender, employmentType, status, salary 
    } = req.body;

    if (!firstName || !lastName || !employeeCode || !title) {
      return res.status(400).json({ 
        success: false, 
        message: 'First name, last name, employee code, and job title are required' 
      });
    }

    // In-memory demo mode fallback
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const newEmployee = {
        _id: 'emp-' + Date.now(),
        employeeCode: employeeCode || `CBDP-${mockData.employees.length + 101}`,
        personalDetails: { 
          firstName, 
          lastName,
          phone: phone || '+1 (555) 019-2834',
          dob: dob || '1995-01-01',
          contactAddress: contactAddress || '100 Corporate Blvd'
        },
        jobDetails: { 
          title, 
          joinDate: joinDate || new Date().toISOString().split('T')[0], 
          status: status || 'ACTIVE',
          employmentType: employmentType || 'FULL_TIME',
          salary: Number(salary) || 75000
        },
        documents: []
      };

      mockData.employees.unshift(newEmployee);

      return res.status(201).json({ 
        success: true, 
        data: newEmployee, 
        message: 'Employee created successfully' 
      });
    }
    
    // Check if employee code already exists
    const existingEmp = await Employee.findOne({ employeeCode });
    if (existingEmp) {
      return res.status(400).json({ success: false, message: `Employee code ${employeeCode} already exists.` });
    }

    // Create Employee in Database
    const employee = new Employee({
      employeeCode,
      personalDetails: { 
        firstName, 
        lastName, 
        phone: phone || '', 
        contactAddress: contactAddress || '',
        dob: dob ? new Date(dob) : undefined
      },
      jobDetails: { 
        title, 
        joinDate: joinDate ? new Date(joinDate) : new Date(), 
        status: status || 'ACTIVE',
        employmentType: employmentType || 'FULL_TIME'
      }
    });

    await employee.save();

    // Auto-create User account if email provided
    let createdUser = null;
    if (email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (!existingUser) {
        const passwordHash = await hashPassword('CBDP@123'); // Default password
        createdUser = new User({
          email: email.toLowerCase(),
          passwordHash,
          role: 'EMPLOYEE',
          employeeProfileId: employee._id,
          isActive: true
        });
        await createdUser.save();
      }
    }

    await logAudit({
      userId: req.user?._id,
      action: 'CREATE',
      module: 'EMPLOYEE',
      resourceId: employee._id,
      newState: employee,
      req
    });

    res.status(201).json({ 
      success: true, 
      data: employee, 
      userAccount: createdUser,
      message: 'Employee created successfully' 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update employee details (personal, job, bank)
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { personalDetails, jobDetails, bankDetails, employeeCode } = req.body;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const emp = mockData.employees.find(e => e._id === id);
      if (emp) {
        if (personalDetails) emp.personalDetails = { ...emp.personalDetails, ...personalDetails };
        if (jobDetails) emp.jobDetails = { ...emp.jobDetails, ...jobDetails };
        if (employeeCode) emp.employeeCode = employeeCode;
      }
      return res.json({ success: true, data: emp || req.body, message: 'Employee updated successfully' });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const previousState = employee.toObject();

    if (employeeCode) employee.employeeCode = employeeCode;
    if (personalDetails) {
      employee.personalDetails = {
        ...employee.personalDetails.toObject(),
        ...personalDetails
      };
    }
    if (jobDetails) {
      employee.jobDetails = {
        ...employee.jobDetails.toObject(),
        ...jobDetails
      };

      // If status changed to TERMINATED, deactivate user account
      if (jobDetails.status === 'TERMINATED') {
        await User.updateMany({ employeeProfileId: employee._id }, { isActive: false });
      } else if (jobDetails.status === 'ACTIVE') {
        await User.updateMany({ employeeProfileId: employee._id }, { isActive: true });
      }
    }
    if (bankDetails) {
      employee.bankDetails = {
        ...employee.bankDetails?.toObject(),
        ...bankDetails
      };
    }

    await employee.save();

    await logAudit({
      userId: req.user?._id,
      action: 'UPDATE',
      module: 'EMPLOYEE',
      resourceId: employee._id,
      previousState,
      newState: employee,
      req
    });

    res.json({ success: true, data: employee, message: 'Employee profile updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update employee employment status (ACTIVE, TERMINATED, ON_LEAVE, PROBATION)
export const updateEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['ACTIVE', 'TERMINATED', 'ON_LEAVE', 'PROBATION'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const emp = mockData.employees.find(e => e._id === id);
      if (emp) emp.jobDetails.status = status;
      return res.json({ success: true, data: emp, message: `Status updated to ${status}` });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const prevStatus = employee.jobDetails.status;
    employee.jobDetails.status = status;
    await employee.save();

    // If terminated, deactivate portal login
    if (status === 'TERMINATED') {
      await User.updateMany({ employeeProfileId: employee._id }, { isActive: false });
    } else if (status === 'ACTIVE' && prevStatus === 'TERMINATED') {
      await User.updateMany({ employeeProfileId: employee._id }, { isActive: true });
    }

    await logAudit({
      userId: req.user?._id,
      action: 'UPDATE',
      module: 'EMPLOYEE_STATUS',
      resourceId: employee._id,
      previousState: { status: prevStatus },
      newState: { status },
      req
    });

    res.json({ success: true, data: employee, message: `Employee status changed to ${status}` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Admin: Reset employee portal password
export const resetEmployeePassword = async (req, res) => {
  try {
    const { id } = req.params; // employeeId
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, message: 'Password updated successfully (Demo Mode)' });
    }

    const user = await User.findOne({ employeeProfileId: id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No portal user account found for this employee' });
    }

    user.passwordHash = await hashPassword(newPassword);
    user.lockUntil = undefined;
    user.failedLoginAttempts = 0;
    await user.save();

    await logAudit({
      userId: req.user?._id,
      action: 'UPDATE',
      module: 'PASSWORD_RESET',
      resourceId: user._id,
      req
    });

    res.json({ success: true, message: `Password for ${user.email} reset successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Toggle employee portal login active/inactive
export const toggleEmployeeAccount = async (req, res) => {
  try {
    const { id } = req.params; // employeeId

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, message: 'Account status toggled (Demo Mode)' });
    }

    const user = await User.findOne({ employeeProfileId: id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No portal user account associated with this employee' });
    }

    user.isActive = !user.isActive;
    await user.save();

    await logAudit({
      userId: req.user?._id,
      action: 'UPDATE',
      module: 'ACCOUNT_STATUS',
      resourceId: user._id,
      newState: { isActive: user.isActive },
      req
    });

    res.json({ 
      success: true, 
      isActive: user.isActive, 
      message: `Employee portal account ${user.isActive ? 'activated' : 'deactivated'} successfully` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete / Archive employee record
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      mockData.employees = mockData.employees.filter(e => e._id !== id);
      return res.json({ success: true, message: 'Employee deleted successfully (Demo Mode)' });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found' });
    }

    // Delete linked user account
    await User.deleteMany({ employeeProfileId: id });

    // Delete employee record
    await Employee.findByIdAndDelete(id);

    await logAudit({
      userId: req.user?._id,
      action: 'DELETE',
      module: 'EMPLOYEE',
      resourceId: id,
      previousState: employee,
      req
    });

    res.json({ success: true, message: 'Employee record and associated user account removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload document for an employee
export const uploadEmployeeDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, fileUrl } = req.body;

    if (!title || !fileUrl) {
      return res.status(400).json({ success: false, message: 'Document title and file URL are required' });
    }

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const emp = mockData.employees.find(e => e._id === id);
      if (emp) {
        if (!emp.documents) emp.documents = [];
        const newDoc = { _id: 'doc_' + Date.now(), title, fileUrl, uploadedAt: new Date() };
        emp.documents.push(newDoc);
        return res.status(201).json({ success: true, data: emp.documents, message: 'Document uploaded successfully' });
      }
      return res.status(201).json({ success: true, data: [{ _id: 'doc_' + Date.now(), title, fileUrl, uploadedAt: new Date() }], message: 'Document uploaded successfully' });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const doc = {
      title,
      fileUrl,
      uploadedAt: new Date()
    };

    if (!employee.documents) employee.documents = [];
    employee.documents.push(doc);
    await employee.save();

    res.status(201).json({ success: true, data: employee.documents, message: 'Document added successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete employee document
export const deleteEmployeeDocument = async (req, res) => {
  try {
    const { id, docId } = req.params;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const emp = mockData.employees.find(e => e._id === id);
      if (emp && emp.documents) {
        emp.documents = emp.documents.filter(d => d._id !== docId);
        return res.json({ success: true, data: emp.documents, message: 'Document removed successfully' });
      }
      return res.json({ success: true, data: [], message: 'Document removed successfully' });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    employee.documents = employee.documents.filter(d => d._id.toString() !== docId);
    await employee.save();

    res.json({ success: true, data: employee.documents, message: 'Document removed successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
