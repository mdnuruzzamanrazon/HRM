import mongoose from 'mongoose';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { hashPassword } from '../utils/authUtils.js';
import { isDemoMode } from '../config/db.js';
import { mockData, saveStoreToDisk, loadStoreFromDisk } from '../services/mockDataService.js';
import { logAudit } from '../utils/auditLogger.js';


// Get all non-deleted employees with user account status
export const getEmployees = async (req, res) => {
  try {
    const { includeDeleted, status } = req.query;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      loadStoreFromDisk();
      let list = (mockData.employees || []).filter(e => includeDeleted === 'true' || !e.isDeleted);
      if (status && status !== 'ALL') {
        list = list.filter(e => e.jobDetails?.status === status);
      }
      return res.json({ 
        success: true, 
        data: list,
        count: list.length,
        isDemoMode: true 
      });
    }

    const filter = {};
    if (includeDeleted !== 'true') {
      filter.isDeleted = { $ne: true };
    }
    if (status && status !== 'ALL') {
      filter['jobDetails.status'] = status;
    }

    const employees = await Employee.find(filter)
      .populate('jobDetails.departmentId', 'name code')
      .populate('userId', 'email role isActive mustChangePassword lastLoginAt')
      .sort({ createdAt: -1 });

    // Fetch linked user account info for complete synchronization
    const employeeIds = employees.map(e => e._id);
    const users = await User.find({ employeeProfileId: { $in: employeeIds } })
      .select('email role isActive mustChangePassword lastLoginAt employeeProfileId');

    const userMap = {};
    users.forEach(u => {
      userMap[u.employeeProfileId.toString()] = {
        _id: u._id,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        mustChangePassword: Boolean(u.mustChangePassword),
        lastLoginAt: u.lastLoginAt
      };
    });

    const enrichedEmployees = employees.map(emp => {
      const plain = emp.toObject();
      plain.userAccount = userMap[emp._id.toString()] || (plain.userId ? {
        _id: plain.userId._id,
        email: plain.userId.email,
        role: plain.userId.role,
        isActive: plain.userId.isActive,
        mustChangePassword: plain.userId.mustChangePassword,
        lastLoginAt: plain.userId.lastLoginAt
      } : null);
      // Guarantee both top-level and nested fields are always fully populated
      plain.firstName = plain.firstName || plain.personalDetails?.firstName || '';
      plain.lastName = plain.lastName || plain.personalDetails?.lastName || '';
      plain.email = plain.email || plain.personalDetails?.email || plain.userAccount?.email;
      plain.title = plain.title || plain.jobDetails?.title || '';
      plain.department = plain.department || plain.jobDetails?.department || '';
      plain.status = plain.status || plain.jobDetails?.status || 'ACTIVE';
      return plain;
    });

    res.json({ success: true, data: enrichedEmployees, count: enrichedEmployees.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const emp = (mockData.employees || []).find(e => e._id === req.params.id) || mockData.employees[0];
      return res.json({ success: true, data: emp, isDemoMode: true });
    }

    const employee = await Employee.findById(req.params.id)
      .populate('jobDetails.departmentId', 'name code')
      .populate('jobDetails.managerId', 'personalDetails employeeCode')
      .populate('userId', 'email role isActive mustChangePassword lastLoginAt createdAt');

    if (!employee || employee.isDeleted) {
      return res.status(404).json({ success: false, message: 'Employee record not found' });
    }

    // Attach user account
    const userAccount = await User.findOne({ employeeProfileId: employee._id })
      .select('email role isActive mustChangePassword lastLoginAt createdAt');

    const plain = employee.toObject();
    plain.userAccount = userAccount || plain.userId || null;
    plain.email = plain.email || plain.personalDetails?.email || userAccount?.email;

    res.json({ success: true, data: plain });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new employee with mandatory email and synchronized portal account
export const createEmployee = async (req, res) => {
  try {
    const { 
      firstName, lastName, email, employeeCode, 
      title, department, joinDate, phone, contactAddress, dob, 
      gender, employmentType, status, salary, initialPassword,
      temporaryPassword, mustChangePassword
    } = req.body;

    const rawCode = employeeCode || req.body.employeeId;
    const rawTitle = title || req.body.designation;
    const rawJoinDate = joinDate || req.body.joiningDate;

    // 1. Mandatory Fields Validation
    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ success: false, message: 'First name is required' });
    }
    if (!lastName || !lastName.trim()) {
      return res.status(400).json({ success: false, message: 'Last name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Official email address is required for employee account creation' });
    }
    if (!rawCode || !rawCode.trim()) {
      return res.status(400).json({ success: false, message: 'Employee ID / Code is required' });
    }
    if (!rawTitle || !rawTitle.trim()) {
      return res.status(400).json({ success: false, message: 'Job title / designation is required' });
    }
    if (!department || !department.trim()) {
      return res.status(400).json({ success: false, message: 'Department is required' });
    }
    if (!rawJoinDate) {
      return res.status(400).json({ success: false, message: 'Date of joining is required' });
    }

    // 2. Email format validation
    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid official email address format (e.g. name@cbdp.org)' });
    }

    const normalizedCode = rawCode.trim().toUpperCase();
    const effectiveDepartment = department.trim();
    const effectiveTitle = rawTitle.trim();
    const effectiveJoinDate = rawJoinDate;
    const effectiveStatus = status || 'ACTIVE';
    const effectiveEmploymentType = employmentType || 'FULL_TIME';

    // 3. Demo Mode Fallback
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      if (!mockData.employees) mockData.employees = [];
      if (!mockData.users) mockData.users = [];

      // Check duplicate code
      if (mockData.employees.some(e => e.employeeCode === normalizedCode && !e.isDeleted)) {
        return res.status(400).json({ success: false, message: `Employee ID '${normalizedCode}' is already registered.` });
      }

      // Check duplicate email
      if (mockData.employees.some(e => (e.email === normalizedEmail || e.personalDetails?.email === normalizedEmail) && !e.isDeleted) ||
          mockData.users.some(u => u.email === normalizedEmail && !u.isDeleted)) {
        return res.status(400).json({ success: false, message: `Official email address '${normalizedEmail}' is already registered.` });
      }

      const newEmpId = 'emp-' + Date.now();
      const newUserId = 'user-' + Date.now();
      const chosenPassword = temporaryPassword || initialPassword || 'CBDP@123';
      const passwordHash = await hashPassword(chosenPassword);

      const newEmployee = {
        _id: newEmpId,
        employeeCode: normalizedCode,
        employeeId: normalizedCode,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        title: effectiveTitle,
        department: effectiveDepartment,
        status: effectiveStatus,
        employmentType: effectiveEmploymentType,
        userId: newUserId,
        isDeleted: false,
        personalDetails: { 
          firstName: firstName.trim(), 
          lastName: lastName.trim(),
          email: normalizedEmail,
          phone: phone ? phone.trim() : '',
          dob: dob || '1995-01-01',
          contactAddress: contactAddress ? contactAddress.trim() : ''
        },
        jobDetails: { 
          title: effectiveTitle, 
          department: effectiveDepartment,
          joinDate: joinDate || new Date().toISOString().split('T')[0], 
          status: effectiveStatus,
          employmentType: effectiveEmploymentType,
          salary: Number(salary) || 75000
        },
        userAccount: {
          _id: newUserId,
          email: normalizedEmail,
          role: 'EMPLOYEE',
          isActive: effectiveStatus !== 'INACTIVE' && effectiveStatus !== 'TERMINATED',
          mustChangePassword: mustChangePassword !== false,
          lastLoginAt: null
        },
        documents: [],
        createdAt: new Date().toISOString()
      };

      const newUser = {
        _id: newUserId,
        email: normalizedEmail,
        passwordHash,
        tempPassword: chosenPassword,
        role: 'EMPLOYEE',
        employeeProfileId: newEmpId,
        isActive: effectiveStatus !== 'INACTIVE' && effectiveStatus !== 'TERMINATED',
        mustChangePassword: mustChangePassword !== false,
        tokenVersion: 1,
        isDeleted: false,
        createdAt: new Date().toISOString()
      };

      mockData.employees.unshift(newEmployee);
      mockData.users.push(newUser);
      saveStoreToDisk();

      return res.status(201).json({ 
        success: true, 
        data: newEmployee, 
        userAccount: {
          email: newUser.email,
          role: newUser.role,
          isActive: newUser.isActive,
          mustChangePassword: newUser.mustChangePassword
        },
        message: 'Employee record and portal authentication account created successfully',
        isDemoMode: true
      });
    }

    // 4. Production Database Uniqueness Checks
    const existingEmpByCode = await Employee.findOne({ employeeCode: normalizedCode, isDeleted: { $ne: true } });
    if (existingEmpByCode) {
      return res.status(400).json({ 
        success: false, 
        message: `Employee ID '${normalizedCode}' is already registered to ${existingEmpByCode.personalDetails?.firstName} ${existingEmpByCode.personalDetails?.lastName}.` 
      });
    }

    const existingEmpByEmail = await Employee.findOne({ email: normalizedEmail, isDeleted: { $ne: true } });
    const existingUserByEmail = await User.findOne({ email: normalizedEmail, isDeleted: { $ne: true } });
    if (existingEmpByEmail || existingUserByEmail) {
      return res.status(400).json({ 
        success: false, 
        message: `Official email address '${normalizedEmail}' is already registered in the system.` 
      });
    }

    // 5. Establish Initial Password & Credentials
    const chosenPassword = temporaryPassword || initialPassword || 'CBDP@123';
    if (chosenPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Initial password must be at least 6 characters long' });
    }
    const passwordHash = await hashPassword(chosenPassword);

    // 6. Create Employee Record in MongoDB
    const employee = new Employee({
      employeeCode: normalizedCode,
      email: normalizedEmail,
      personalDetails: { 
        firstName: firstName.trim(), 
        lastName: lastName.trim(), 
        email: normalizedEmail,
        phone: phone ? phone.trim() : '', 
        contactAddress: contactAddress ? contactAddress.trim() : '',
        dob: dob ? new Date(dob) : undefined
      },
      jobDetails: { 
        title: effectiveTitle, 
        department: effectiveDepartment,
        joinDate: effectiveJoinDate ? new Date(effectiveJoinDate) : new Date(), 
        status: effectiveStatus,
        employmentType: effectiveEmploymentType
      },
      isDeleted: false
    });

    await employee.save();

    // 7. Create Corresponding Authentication User in MongoDB
    const createdUser = new User({
      email: normalizedEmail,
      passwordHash,
      role: 'EMPLOYEE',
      employeeProfileId: employee._id,
      isActive: effectiveStatus !== 'INACTIVE' && effectiveStatus !== 'TERMINATED',
      mustChangePassword: mustChangePassword !== false,
      tokenVersion: 1,
      isDeleted: false
    });

    await createdUser.save();

    // Link user ID to employee document for bidirectional integrity
    employee.userId = createdUser._id;
    await employee.save();

    await logAudit({
      userId: req.user?._id,
      action: 'CREATE',
      module: 'EMPLOYEE',
      resourceId: employee._id,
      newState: {
        employeeCode: employee.employeeCode,
        name: `${employee.personalDetails.firstName} ${employee.personalDetails.lastName}`,
        email: employee.email,
        title: employee.jobDetails.title,
        department: employee.jobDetails.department
      },
      req
    });

    const responseEmployee = employee.toObject();
    responseEmployee.firstName = employee.personalDetails.firstName;
    responseEmployee.lastName = employee.personalDetails.lastName;
    responseEmployee.title = employee.jobDetails.title;
    responseEmployee.department = employee.jobDetails.department;
    responseEmployee.status = employee.jobDetails.status;
    responseEmployee.employmentType = employee.jobDetails.employmentType;
    responseEmployee.userAccount = {
      _id: createdUser._id,
      email: createdUser.email,
      role: createdUser.role,
      isActive: createdUser.isActive,
      mustChangePassword: createdUser.mustChangePassword
    };

    res.status(201).json({ 
      success: true, 
      data: responseEmployee, 
      userAccount: responseEmployee.userAccount,
      message: 'Employee record and portal authentication account created successfully' 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update employee details (personal, job, bank, and credentials sync)
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { personalDetails, jobDetails, bankDetails, employeeCode, email } = req.body;

    const newEmail = email || personalDetails?.email;
    const normalizedEmail = newEmail ? newEmail.toLowerCase().trim() : null;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const emp = (mockData.employees || []).find(e => e._id === id);
      if (emp) {
        if (personalDetails) emp.personalDetails = { ...emp.personalDetails, ...personalDetails };
        if (jobDetails) emp.jobDetails = { ...emp.jobDetails, ...jobDetails };
        if (employeeCode) emp.employeeCode = employeeCode.trim().toUpperCase();
        if (normalizedEmail) {
          emp.email = normalizedEmail;
          if (emp.personalDetails) emp.personalDetails.email = normalizedEmail;
          // Synchronize mock user account
          const u = (mockData.users || []).find(user => user.employeeProfileId === id || user._id === emp.userId);
          if (u) u.email = normalizedEmail;
        }
        if (jobDetails?.status) {
          const u = (mockData.users || []).find(user => user.employeeProfileId === id || user._id === emp.userId);
          if (u) {
            u.isActive = jobDetails.status !== 'TERMINATED' && jobDetails.status !== 'INACTIVE';
            if (!u.isActive) u.tokenVersion = (u.tokenVersion || 1) + 1;
          }
        }
        saveStoreToDisk();
      }
      return res.json({ success: true, data: emp || req.body, message: 'Employee profile updated successfully', isDemoMode: true });
    }

    const employee = await Employee.findById(id);
    if (!employee || employee.isDeleted) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const previousState = employee.toObject();

    // Check employeeCode uniqueness if changed
    if (employeeCode && employeeCode.trim().toUpperCase() !== employee.employeeCode) {
      const codeUpper = employeeCode.trim().toUpperCase();
      const codeConflict = await Employee.findOne({ employeeCode: codeUpper, _id: { $ne: id }, isDeleted: { $ne: true } });
      if (codeConflict) {
        return res.status(400).json({ success: false, message: `Employee ID '${codeUpper}' is already in use.` });
      }
      employee.employeeCode = codeUpper;
    }

    // Check email uniqueness and synchronize with User if changed
    if (normalizedEmail && normalizedEmail !== employee.email) {
      const emailConflict = await User.findOne({ email: normalizedEmail, employeeProfileId: { $ne: id }, isDeleted: { $ne: true } });
      if (emailConflict) {
        return res.status(400).json({ success: false, message: `Email address '${normalizedEmail}' is already registered to another account.` });
      }
      employee.email = normalizedEmail;
      await User.updateMany({ employeeProfileId: employee._id }, { email: normalizedEmail });
    }

    if (personalDetails) {
      employee.personalDetails = {
        ...employee.personalDetails.toObject(),
        ...personalDetails,
        email: normalizedEmail || employee.personalDetails.email || employee.email
      };
    }

    if (jobDetails) {
      const prevStatus = employee.jobDetails.status;
      employee.jobDetails = {
        ...employee.jobDetails.toObject(),
        ...jobDetails
      };

      // If status changed to TERMINATED or INACTIVE, immediately deactivate portal account & revoke sessions
      if (['TERMINATED', 'INACTIVE'].includes(jobDetails.status)) {
        await User.updateMany(
          { employeeProfileId: employee._id }, 
          { isActive: false, $inc: { tokenVersion: 1 } }
        );
      } else if (jobDetails.status === 'ACTIVE' && ['TERMINATED', 'INACTIVE'].includes(prevStatus)) {
        await User.updateMany(
          { employeeProfileId: employee._id }, 
          { isActive: true }
        );
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

// Update employee employment status (ACTIVE, INACTIVE, TERMINATED, ON_LEAVE, PROBATION)
export const updateEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE', 'PROBATION'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const emp = (mockData.employees || []).find(e => e._id === id);
      if (emp) {
        emp.jobDetails.status = status;
        const u = (mockData.users || []).find(user => user.employeeProfileId === id);
        if (u) {
          u.isActive = status !== 'TERMINATED' && status !== 'INACTIVE';
          if (!u.isActive) u.tokenVersion = (u.tokenVersion || 1) + 1;
        }
      }
      return res.json({ success: true, data: emp, message: `Status updated to ${status}`, isDemoMode: true });
    }

    const employee = await Employee.findById(id);
    if (!employee || employee.isDeleted) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const prevStatus = employee.jobDetails.status;
    employee.jobDetails.status = status;
    await employee.save();

    // If terminated or deactivated, revoke all active sessions
    if (['TERMINATED', 'INACTIVE'].includes(status)) {
      await User.updateMany(
        { employeeProfileId: employee._id }, 
        { isActive: false, $inc: { tokenVersion: 1 } }
      );
    } else if (status === 'ACTIVE' && ['TERMINATED', 'INACTIVE'].includes(prevStatus)) {
      await User.updateMany(
        { employeeProfileId: employee._id }, 
        { isActive: true }
      );
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
    const { newPassword, isTemporary } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const allMockUsers = [mockData.adminUser, mockData.employeeUser, ...(mockData.users || [])];
      const u = allMockUsers.find(user => user.employeeProfileId === id || user._id === id);
      if (u) {
        u.passwordHash = await hashPassword(newPassword);
        u.tempPassword = isTemporary ? newPassword : null;
        u.mustChangePassword = Boolean(isTemporary);
        u.tokenVersion = (u.tokenVersion || 1) + 1;
        return res.json({ 
          success: true, 
          message: `Password for ${u.email} reset successfully.${isTemporary ? ' Employee must set a new password upon first login.' : ''}` 
        });
      }
      return res.json({ success: true, message: 'Password updated successfully (Demo Mode)' });
    }

    const user = await User.findOne({ 
      $or: [{ employeeProfileId: id }, { _id: mongoose.isValidObjectId(id) ? id : null }] 
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No portal user account found for this employee' });
    }

    user.passwordHash = await hashPassword(newPassword);
    user.mustChangePassword = Boolean(isTemporary);
    user.lockUntil = undefined;
    user.failedLoginAttempts = 0;
    user.tokenVersion = (user.tokenVersion || 1) + 1; // Immediately revoke previous employee sessions
    await user.save();

    await logAudit({
      userId: req.user?._id,
      action: 'UPDATE',
      module: 'PASSWORD_RESET',
      resourceId: user._id,
      newState: {
        isTemporary: Boolean(isTemporary),
        accountEmail: user.email
      },
      req
    });

    res.json({ 
      success: true, 
      message: `Password for ${user.email} reset successfully.${isTemporary ? ' Employee must set a new password upon first login.' : ''}` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Toggle employee portal login active/inactive
export const toggleEmployeeAccount = async (req, res) => {
  try {
    const { id } = req.params; // employeeId

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const allMockUsers = [mockData.adminUser, mockData.employeeUser, ...(mockData.users || [])];
      const emp = (mockData.employees || []).find(e => e._id === id || e.employeeCode === id);
      const u = allMockUsers.find(user => 
        user.employeeProfileId === id || 
        user._id === id || 
        (emp && (user._id === emp.userId || user.email?.toLowerCase() === emp.email?.toLowerCase() || user.email?.toLowerCase() === emp.personalDetails?.email?.toLowerCase()))
      );
      if (u) {
        u.isActive = !u.isActive;
        if (!u.isActive) u.tokenVersion = (u.tokenVersion || 1) + 1;
        saveStoreToDisk();
        return res.json({ 
          success: true, 
          isActive: u.isActive, 
          message: `Employee portal account ${u.isActive ? 'activated' : 'deactivated'} successfully` 
        });
      }
      return res.status(404).json({ success: false, message: 'No portal user account associated with this employee' });
    }

    const user = await User.findOne({ 
      $or: [{ employeeProfileId: id }, { _id: mongoose.isValidObjectId(id) ? id : null }] 
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No portal user account associated with this employee' });
    }

    user.isActive = !user.isActive;
    if (!user.isActive) {
      user.tokenVersion = (user.tokenVersion || 1) + 1; // Terminate active logins immediately
    }
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

// Delete employee record (Soft-delete by default to protect historical payroll and attendance)
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent, force } = req.query;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const emp = (mockData.employees || []).find(e => e._id === id || e.employeeCode === id);
      if (emp) {
        emp.isDeleted = true;
        if (emp.jobDetails) emp.jobDetails.status = 'DELETED';
      }
      const allMockUsers = [mockData.adminUser, mockData.employeeUser, ...(mockData.users || [])];
      const u = allMockUsers.find(user => 
        user.employeeProfileId === id || 
        user._id === id || 
        (emp && (user._id === emp.userId || user.email?.toLowerCase() === emp.email?.toLowerCase() || user.email?.toLowerCase() === emp.personalDetails?.email?.toLowerCase()))
      );
      if (u) {
        u.isActive = false;
        u.isDeleted = true;
        u.tokenVersion = (u.tokenVersion || 1) + 1;
      }
      mockData.employees = (mockData.employees || []).filter(e => e._id !== id);
      saveStoreToDisk();
      return res.json({ success: true, message: 'Employee record and portal account removed successfully' });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found' });
    }

    // Immediately revoke and invalidate authentication account
    await User.updateMany(
      { employeeProfileId: id },
      { 
        isActive: false, 
        isDeleted: true, 
        deletedAt: new Date(),
        $inc: { tokenVersion: 1 } // Terminate active sessions immediately
      }
    );

    if (permanent === 'true' || force === 'true') {
      await User.deleteMany({ employeeProfileId: id });
      await Employee.findByIdAndDelete(id);
    } else {
      // Soft deletion preserves historical integrity for payroll, attendance, and audit logs
      employee.isDeleted = true;
      employee.deletedAt = new Date();
      employee.deletedBy = req.user?._id;
      employee.jobDetails.status = 'DELETED';
      await employee.save();
    }

    await logAudit({
      userId: req.user?._id,
      action: 'DELETE',
      module: 'EMPLOYEE',
      resourceId: id,
      previousState: {
        employeeCode: employee.employeeCode,
        name: `${employee.personalDetails?.firstName} ${employee.personalDetails?.lastName}`,
        email: employee.email
      },
      req
    });

    res.json({ 
      success: true, 
      message: 'Employee record deactivated and portal access revoked successfully' 
    });
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
    if (!employee || employee.isDeleted) {
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

// Sync client-side employees to ensure zero data loss across ephemeral restarts
export const syncEmployees = async (req, res) => {
  try {
    const { employees } = req.body;
    if (!Array.isArray(employees)) {
      return res.status(400).json({ success: false, message: 'Invalid payload: employees array required' });
    }

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      loadStoreFromDisk();
      const existingCodes = new Set(mockData.employees.map(e => e.employeeCode));
      let added = 0;
      employees.forEach(emp => {
        if (emp && emp.employeeCode && !existingCodes.has(emp.employeeCode)) {
          mockData.employees.unshift(emp);
          existingCodes.add(emp.employeeCode);
          added++;
        }
      });
      if (added > 0) {
        saveStoreToDisk();
      }
      return res.json({ success: true, synced: added, total: mockData.employees.length });
    }

    // In production MongoDB mode:
    let addedCount = 0;
    for (const emp of employees) {
      if (emp.employeeCode && (emp.email || emp.personalDetails?.email)) {
        const empCode = emp.employeeCode.trim().toUpperCase();
        const exists = await Employee.findOne({ employeeCode: empCode, isDeleted: { $ne: true } });
        if (!exists) {
          const emailVal = emp.email || emp.personalDetails?.email;
          await Employee.create({
            employeeCode: empCode,
            email: emailVal,
            personalDetails: emp.personalDetails || { 
              firstName: emp.firstName || 'Employee', 
              lastName: emp.lastName || empCode, 
              email: emailVal 
            },
            jobDetails: emp.jobDetails || { 
              title: emp.title || 'Staff', 
              department: emp.department || 'Operations', 
              status: emp.status || 'ACTIVE',
              joinDate: new Date()
            }
          });
          addedCount++;
        }
      }
    }
    res.json({ success: true, synced: addedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

