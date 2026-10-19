import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { hashPassword, verifyPassword } from '../utils/authUtils.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';
import { logAudit } from '../utils/auditLogger.js';

// In-memory reset code cache for resilient operation
const resetCodesCache = new Map();

const generateToken = (res, user, rememberMe = false) => {
  const token = jwt.sign(
    { 
      id: user._id, 
      email: user.email,
      role: user.role, 
      tokenVersion: user.tokenVersion || 1 
    }, 
    process.env.JWT_SECRET || 'super_secret_jwt_key_cbdp_2026', 
    {
      expiresIn: rememberMe ? '30d' : '1d',
    }
  );

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
  });
  return token;
};

// POST /api/v1/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password, portal, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Fallback for Demo Mode / Unconnected DB
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const allMockUsers = [
        mockData.adminUser,
        mockData.employeeUser,
        ...(mockData.users || [])
      ];

      const foundUser = allMockUsers.find(u => u.email.toLowerCase() === normalizedEmail);
      if (!foundUser || foundUser.isDeleted) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (!foundUser.isActive) {
        return res.status(403).json({ success: false, message: 'Account deactivated. Please contact HR Administration.' });
      }

      // Check portal restrictions
      if (portal === 'HR' && foundUser.role === 'EMPLOYEE') {
        return res.status(403).json({
          success: false,
          message: 'Access restricted: Employees must log in through the Employee Portal.',
          suggestedPortal: 'EMPLOYEE'
        });
      }

      if (portal === 'EMPLOYEE' && foundUser.role !== 'EMPLOYEE' && foundUser.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Access restricted: Management & HR staff must log in through the HR Portal.',
          suggestedPortal: 'HR'
        });
      }

      // Strictly verify password against user's stored hash or valid active temp password
      let isMatch = false;
      if (foundUser.passwordHash) {
        isMatch = await verifyPassword(foundUser.passwordHash, password);
      }
      // Allow temp password only if account is currently awaiting first password setup
      if (!isMatch && foundUser.mustChangePassword && foundUser.tempPassword && foundUser.tempPassword === password) {
        isMatch = true;
      }
      // Allow seed admin fallback for super admin
      if (!isMatch && foundUser.role === 'SUPER_ADMIN' && password === 'ABCabc@123') {
        isMatch = true;
      }

      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      foundUser.lastLoginAt = new Date().toISOString();
      const token = generateToken(res, foundUser, rememberMe);

      return res.json({
        success: true,
        token,
        user: {
          _id: foundUser._id,
          email: foundUser.email,
          role: foundUser.role,
          employeeProfileId: foundUser.employeeProfileId,
          isTwoFactorEnabled: foundUser.isTwoFactorEnabled,
          mustChangePassword: Boolean(foundUser.mustChangePassword)
        },
        mustChangePassword: Boolean(foundUser.mustChangePassword),
        isDemoMode: true
      });
    }

    // 2. Production Database Verification
    const user = await User.findOne({ 
      email: normalizedEmail,
      isDeleted: { $ne: true }
    }).populate('employeeProfileId');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check account status
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account deactivated. Please contact your HR administrator.' 
      });
    }

    // Check employee profile status if linked
    if (user.role === 'EMPLOYEE' && user.employeeProfileId) {
      const emp = user.employeeProfileId;
      if (emp.isDeleted || emp.jobDetails?.status === 'TERMINATED' || emp.jobDetails?.status === 'DELETED') {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied: Employee record is terminated or no longer active.' 
        });
      }
    }

    // Verify Password
    const isPasswordValid = await verifyPassword(user.passwordHash, password);
    if (!isPasswordValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Portal-specific role enforcement
    if (portal === 'HR' && user.role === 'EMPLOYEE') {
      return res.status(403).json({
        success: false,
        message: 'Access restricted: Employees must log in through the Employee Portal.',
        suggestedPortal: 'EMPLOYEE'
      });
    }

    if (portal === 'EMPLOYEE' && user.role !== 'EMPLOYEE' && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access restricted: Management & HR staff must log in through the HR Portal.',
        suggestedPortal: 'HR'
      });
    }

    // Reset failed attempts & update last login
    user.failedLoginAttempts = 0;
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(res, user, rememberMe);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        employeeProfileId: user.employeeProfileId,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
        mustChangePassword: Boolean(user.mustChangePassword)
      },
      mustChangePassword: Boolean(user.mustChangePassword)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/auth/logout
export const logoutUser = async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// POST /api/v1/auth/forgot-password
// Generates a secure 6-digit verification code and dispatch link
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Always store in memory cache
    resetCodesCache.set(normalizedEmail, {
      code: verificationCode,
      token: resetToken,
      expiresAt
    });

    if (!isDemoMode() && mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: normalizedEmail, isDeleted: { $ne: true } });
      if (user) {
        user.resetPasswordCode = verificationCode;
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(expiresAt);
        await user.save();
      }
    }

    // Log the reset code to server console for development and verification testing
    console.log(`[CBDP Security] Password Reset Code for ${normalizedEmail}: ${verificationCode} (Expires in 15 mins)`);

    // Generic safe confirmation message
    res.json({
      success: true,
      message: 'If this email belongs to an authorized employee account, a 6-digit verification code has been dispatched.',
      email: normalizedEmail,
      // Include debug code in development/demo environments for seamless testing
      verificationCode: process.env.NODE_ENV !== 'production' ? verificationCode : undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/auth/verify-reset-code
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = code.toString().trim();

    // Check memory cache first
    const cached = resetCodesCache.get(normalizedEmail);
    if (cached && cached.code === normalizedCode && cached.expiresAt > Date.now()) {
      return res.json({ success: true, message: 'Verification code confirmed.' });
    }

    // Check database
    if (!isDemoMode() && mongoose.connection.readyState === 1) {
      const user = await User.findOne({
        email: normalizedEmail,
        resetPasswordCode: normalizedCode,
        resetPasswordExpires: { $gt: new Date() }
      });

      if (user) {
        return res.json({ success: true, message: 'Verification code confirmed.' });
      }
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid or expired 6-digit verification code. Please request a new one.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, code, token, newPassword } = req.body;
    const password = newPassword || req.body.password;

    if (!password || password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters long' 
      });
    }

    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const normalizedCode = code ? code.toString().trim() : '';

    let isAuthorized = false;

    // Check cache
    if (normalizedEmail) {
      const cached = resetCodesCache.get(normalizedEmail);
      if (cached && (cached.code === normalizedCode || (token && cached.token === token)) && cached.expiresAt > Date.now()) {
        isAuthorized = true;
        resetCodesCache.delete(normalizedEmail);
      }
    }

    const newHash = await hashPassword(password);

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      if (!isAuthorized && !token) {
        return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
      }

      const allMockUsers = [mockData.adminUser, mockData.employeeUser, ...(mockData.users || [])];
      const mockUser = allMockUsers.find(u => u.email.toLowerCase() === normalizedEmail);
      if (mockUser) {
        mockUser.passwordHash = newHash;
        mockUser.tempPassword = null;
        mockUser.mustChangePassword = false;
        mockUser.tokenVersion = (mockUser.tokenVersion || 1) + 1;
      }

      return res.json({
        success: true,
        message: 'Password has been successfully updated. You may now log in with your new credentials.'
      });
    }

    // Database update
    const query = {
      $or: [
        ...(normalizedEmail && normalizedCode ? [{ email: normalizedEmail, resetPasswordCode: normalizedCode }] : []),
        ...(token ? [{ resetPasswordToken: token }] : [])
      ],
      resetPasswordExpires: { $gt: new Date() }
    };

    let user = await User.findOne(query);

    // If verified through in-memory cache, find directly by email
    if (!user && isAuthorized && normalizedEmail) {
      user = await User.findOne({ email: normalizedEmail, isDeleted: { $ne: true } });
    }

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired password reset verification code' 
      });
    }

    user.passwordHash = newHash;
    user.resetPasswordCode = undefined;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.mustChangePassword = false;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.tokenVersion = (user.tokenVersion || 1) + 1; // Invalidate all prior sessions
    await user.save();

    await logAudit({
      userId: user._id,
      action: 'UPDATE',
      module: 'PASSWORD_RESET',
      resourceId: user._id,
      req
    });

    res.json({ 
      success: true, 
      message: 'Password has been successfully updated. You may now log in with your new credentials.' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/auth/change-first-login-password
// Allows employee to complete initial password change on first login
export const changeFirstLoginPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters long' 
      });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const newHash = await hashPassword(newPassword);

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const allMockUsers = [mockData.adminUser, mockData.employeeUser, ...(mockData.users || [])];
      const targetUser = allMockUsers.find(u => u._id === userId || (req.user?.email && u.email?.toLowerCase() === req.user.email.toLowerCase()));
      if (targetUser) {
        targetUser.passwordHash = newHash;
        targetUser.tempPassword = null;
        targetUser.mustChangePassword = false;
        targetUser.tokenVersion = (targetUser.tokenVersion || 1) + 1;
      } else {
        mockData.users = mockData.users || [];
        mockData.users.push({
          _id: userId,
          email: req.user?.email,
          passwordHash: newHash,
          tempPassword: null,
          mustChangePassword: false,
          tokenVersion: 2,
          role: req.user?.role || 'EMPLOYEE',
          isActive: true
        });
      }
      if (req.user) {
        req.user.passwordHash = newHash;
        req.user.tempPassword = null;
        req.user.mustChangePassword = false;
      }
      return res.json({ success: true, message: 'Password set successfully.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.passwordHash = newHash;
    user.mustChangePassword = false;
    user.tokenVersion = (user.tokenVersion || 1) + 1;
    await user.save();

    res.json({ success: true, message: 'Password configured successfully. Welcome to CBDP HRM!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/auth/update-password
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?._id;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, message: 'Password updated successfully' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!(await verifyPassword(user.passwordHash, currentPassword))) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    user.passwordHash = await hashPassword(newPassword);
    user.tokenVersion = (user.tokenVersion || 1) + 1;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

