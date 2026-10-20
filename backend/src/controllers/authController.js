import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { hashPassword, verifyPassword } from '../utils/authUtils.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';
import { logAudit } from '../utils/auditLogger.js';

import { sendVerificationCodeEmail, diagnoseEmailConfiguration, setRuntimeEmailConfig } from '../services/emailService.js';

// GET /api/v1/auth/email-diagnostics
export const getEmailDiagnostics = async (req, res) => {
  try {
    const diagnostic = await diagnoseEmailConfiguration();
    res.json({ success: true, diagnostic });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/auth/configure-email
export const configureEmailService = async (req, res) => {
  try {
    const { resendApiKey, smtpUser, smtpPass } = req.body;
    setRuntimeEmailConfig({ resendApiKey, smtpUser, smtpPass });
    const diagnostic = await diagnoseEmailConfiguration();
    res.json({ success: true, message: 'Email credentials successfully configured for runtime.', diagnostic });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// In-memory reset code cache for resilient operation
const resetCodesCache = new Map();

// Rate limiting & security maps
const forgotPasswordRateLimits = new Map(); // email -> { count, firstAttempt, lastAttempt }
const verifyCodeAttempts = new Map(); // email -> failedAttempts count

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
    let user = await User.findOne({ 
      email: normalizedEmail,
      isDeleted: { $ne: true }
    }).populate('employeeProfileId');

    // Self-healing: If user not found directly by email, check if an employee has this email
    if (!user) {
      const emp = await Employee.findOne({
        $or: [
          { email: normalizedEmail },
          { 'personalDetails.email': normalizedEmail }
        ],
        isDeleted: { $ne: true }
      });

      if (emp && emp.userId) {
        user = await User.findById(emp.userId).populate('employeeProfileId');
        if (user) {
          // Normalize user email to match the official employee email
          user.email = normalizedEmail;
          user.employeeProfileId = emp._id;
          await user.save();
        }
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesRemaining = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minutes or reset your password.`
      });
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
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lock
      }
      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Reset failed attempts & unlock
    user.lockUntil = undefined;

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

// POST /api/v1/auth/forgot-password and POST /api/v1/auth/resend-code
export const forgotPassword = async (req, res) => {
  try {
    const { email, credential, resendApiKey, appPassword } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid official email address format (e.g. employee@cbdp.org)' });
    }

    // Auto-configure runtime credentials if provided in request
    const providedCredential = (credential || resendApiKey || appPassword || '').trim();
    if (providedCredential) {
      if (providedCredential.startsWith('re_')) {
        setRuntimeEmailConfig({ resendApiKey: providedCredential });
      } else {
        setRuntimeEmailConfig({ 
          smtpUser: normalizedEmail, 
          smtpPass: providedCredential.replace(/\s+/g, '') 
        });
      }
    }

    // 1. Rate Limiting & Cooldown Protection
    const now = Date.now();
    const rateData = forgotPasswordRateLimits.get(normalizedEmail) || { count: 0, firstAttempt: now, lastAttempt: 0 };

    // Reset window after 15 minutes
    if (now - rateData.firstAttempt > 15 * 60 * 1000) {
      rateData.count = 0;
      rateData.firstAttempt = now;
    }

    // Cooldown: enforce at least 30 seconds between requests
    if (rateData.lastAttempt && now - rateData.lastAttempt < 30 * 1000) {
      const waitSec = Math.ceil((30 * 1000 - (now - rateData.lastAttempt)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSec} seconds before requesting another verification code.`
      });
    }

    // Maximum 5 requests per 15 minutes
    if (rateData.count >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many password reset requests for this account. Please wait 15 minutes before requesting again.'
      });
    }

    // 2. Locate User / Employee Account
    let user = null;
    let employeeName = '';

    if (!isDemoMode() && mongoose.connection.readyState === 1) {
      user = await User.findOne({ email: normalizedEmail, isDeleted: { $ne: true } }).populate('employeeProfileId');

      if (!user) {
        // Search Employee collection to see if registered
        const employee = await Employee.findOne({
          $or: [
            { email: normalizedEmail },
            { 'personalDetails.email': normalizedEmail }
          ],
          isDeleted: { $ne: true }
        });

        if (employee) {
          if (employee.userId) {
            user = await User.findById(employee.userId).populate('employeeProfileId');
          }
          if (!user) {
            // Provision User account for this employee if missing
            user = new User({
              email: normalizedEmail,
              passwordHash: await hashPassword(crypto.randomBytes(16).toString('hex')),
              role: 'EMPLOYEE',
              employeeProfileId: employee._id,
              isActive: employee.jobDetails?.status !== 'TERMINATED' && employee.jobDetails?.status !== 'INACTIVE',
              mustChangePassword: false,
              tokenVersion: 1
            });
            await user.save();
            employee.userId = user._id;
            await employee.save();
          }
        }
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No registered employee account found with this email address. Please check your email or contact HR.'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'This employee account is deactivated or suspended. Please contact HR administration.'
        });
      }

      employeeName = user.employeeProfileId?.personalDetails?.firstName || '';
    } else {
      // Demo Mode
      const allMockUsers = [mockData.adminUser, mockData.employeeUser, ...(mockData.users || [])];
      user = allMockUsers.find(u => u.email.toLowerCase() === normalizedEmail && !u.isDeleted);
      if (!user) {
        const emp = (mockData.employees || []).find(e => (e.email === normalizedEmail || e.personalDetails?.email === normalizedEmail) && !e.isDeleted);
        if (emp) {
          user = allMockUsers.find(u => u._id === emp.userId || u.employeeProfileId === emp._id);
        }
      }
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No registered employee account found with this email address. Please check your email or contact HR.'
        });
      }
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'This employee account is deactivated. Please contact HR administration.'
        });
      }
      employeeName = user.firstName || 'Team Member';
    }

    // 3. Generate Cryptographically Secure 6-Digit Code & SHA-256 Hash
    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    const codeHash = crypto.createHash('sha256').update(verificationCode).digest('hex');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const EXPIRES_IN_MINUTES = 10;
    const expiresAt = now + EXPIRES_IN_MINUTES * 60 * 1000;

    // 4. Dispatch Email Directly via Email Service
    let emailResult;
    try {
      emailResult = await sendVerificationCodeEmail({
        to: normalizedEmail,
        code: verificationCode,
        expiresInMinutes: EXPIRES_IN_MINUTES,
        employeeName
      });
    } catch (emailError) {
      console.error(`[authController] Failed to dispatch verification email to ${normalizedEmail}:`, emailError.message);
      return res.status(500).json({
        success: false,
        message: "We couldn't send your verification code right now. Please try again later.",
        errorDetail: process.env.NODE_ENV !== 'production' ? emailError.message : undefined
      });
    }

    // 5. Update State only AFTER Successful Email Dispatch
    rateData.count += 1;
    rateData.lastAttempt = now;
    forgotPasswordRateLimits.set(normalizedEmail, rateData);

    // Save in Cache with SHA-256 Hash
    resetCodesCache.set(normalizedEmail, {
      code: verificationCode,
      codeHash,
      token: resetToken,
      expiresAt
    });

    // Save in Database (stores secure hash and verification code)
    if (user && user.save && typeof user.save === 'function') {
      user.resetPasswordCode = verificationCode;
      user.resetPasswordCodeHash = codeHash;
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(expiresAt);
      await user.save();
    } else if (user) {
      user.resetPasswordCode = verificationCode;
      user.resetPasswordCodeHash = codeHash;
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(expiresAt);
    }

    // Invalidate failed attempt counter for fresh code
    verifyCodeAttempts.delete(normalizedEmail);

    res.json({
      success: true,
      message: 'A 6-digit verification code has been sent to your registered email address.',
      email: normalizedEmail,
      expiresInMinutes: EXPIRES_IN_MINUTES,
      deliveryStatus: emailResult?.provider || 'delivered'
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
    const incomingHash = crypto.createHash('sha256').update(normalizedCode).digest('hex');

    // Rate-limit failed verification attempts to prevent brute-forcing
    const failedAttempts = verifyCodeAttempts.get(normalizedEmail) || 0;
    if (failedAttempts >= 5) {
      // Invalidate the code
      resetCodesCache.delete(normalizedEmail);
      if (!isDemoMode() && mongoose.connection.readyState !== 1) {
        await User.updateOne({ email: normalizedEmail }, {
          $unset: { resetPasswordCode: 1, resetPasswordCodeHash: 1, resetPasswordToken: 1, resetPasswordExpires: 1 }
        });
      }
      return res.status(429).json({
        success: false,
        message: 'Too many invalid verification attempts. For security reasons, this code has been revoked. Please request a new code.'
      });
    }

    // Check memory cache first
    const cached = resetCodesCache.get(normalizedEmail);
    if (cached) {
      if (cached.expiresAt <= Date.now()) {
        resetCodesCache.delete(normalizedEmail);
        return res.status(400).json({
          success: false,
          message: 'Your verification code has expired. Please request a new code.'
        });
      }
      if (cached.codeHash === incomingHash || cached.code === normalizedCode) {
        verifyCodeAttempts.delete(normalizedEmail);
        return res.json({ success: true, message: 'Verification code confirmed.' });
      }
    }

    // Check database
    if (!isDemoMode() && mongoose.connection.readyState === 1) {
      const user = await User.findOne({
        email: normalizedEmail,
        $or: [
          { resetPasswordCodeHash: incomingHash },
          { resetPasswordCode: incomingHash },
          { resetPasswordCode: normalizedCode }
        ],
        resetPasswordExpires: { $gt: new Date() }
      });

      if (user) {
        verifyCodeAttempts.delete(normalizedEmail);
        return res.json({ success: true, message: 'Verification code confirmed.' });
      }
    }

    // Increment failed attempt counter
    verifyCodeAttempts.set(normalizedEmail, failedAttempts + 1);

    return res.status(400).json({
      success: false,
      message: 'The verification code is incorrect. Please try again.'
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
    const incomingHash = normalizedCode ? crypto.createHash('sha256').update(normalizedCode).digest('hex') : '';

    let isAuthorized = false;

    // Check cache
    if (normalizedEmail) {
      const cached = resetCodesCache.get(normalizedEmail);
      if (cached) {
        if (cached.expiresAt <= Date.now()) {
          resetCodesCache.delete(normalizedEmail);
          return res.status(400).json({ success: false, message: 'Your verification code has expired. Please request a new code.' });
        }
        if (cached.codeHash === incomingHash || cached.code === normalizedCode || (token && cached.token === token)) {
          isAuthorized = true;
        }
      }
    }

    const newHash = await hashPassword(password);

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      if (!isAuthorized && !token) {
        return res.status(400).json({ success: false, message: 'The verification code is incorrect or has expired. Please request a new code.' });
      }

      // Enforce single-use: purge cache immediately
      resetCodesCache.delete(normalizedEmail);
      verifyCodeAttempts.delete(normalizedEmail);

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

    // Database lookup
    const query = {
      $or: [
        ...(normalizedEmail && normalizedCode ? [
          { email: normalizedEmail, resetPasswordCodeHash: incomingHash },
          { email: normalizedEmail, resetPasswordCode: incomingHash },
          { email: normalizedEmail, resetPasswordCode: normalizedCode }
        ] : []),
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
        message: 'Invalid, expired, or previously used verification code. Please request a new code.' 
      });
    }

    // SINGLE-USE ENFORCEMENT: Clear code and token so it can NEVER be reused
    resetCodesCache.delete(normalizedEmail);
    verifyCodeAttempts.delete(normalizedEmail);

    user.passwordHash = newHash;
    user.resetPasswordCode = undefined;
    user.resetPasswordCodeHash = undefined;
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
      }
      const token = generateToken(res, targetUser || req.user);
      return res.json({ success: true, token, message: 'Password configured successfully. Welcome to CBDP HRM!' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.passwordHash = newHash;
    user.mustChangePassword = false;
    user.tokenVersion = (user.tokenVersion || 1) + 1;
    await user.save();

    // Re-issue fresh token with updated tokenVersion so active session continues seamlessly
    const token = generateToken(res, user);

    res.json({ 
      success: true, 
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        mustChangePassword: false
      },
      message: 'Password configured successfully. Welcome to CBDP HRM!' 
    });
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

