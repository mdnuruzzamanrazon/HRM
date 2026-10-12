import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { hashPassword, verifyPassword } from '../utils/authUtils.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';

const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'super_secret_jwt_key_nexushr_2026', {
    expiresIn: '1d',
  });

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 mins
  });
  return token;
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Demo Mode fallback when cloud database is not connected
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      if (email === 'mdnuruzzamanrazon@gmail.com' || email.includes('admin') || email.includes('@')) {
        const token = generateToken(res, mockData.adminUser._id);
        return res.json({
          success: true,
          token,
          user: mockData.adminUser,
          isDemoMode: true,
        });
      }
    }

    const user = await User.findOne({ email });

    if (user && (await verifyPassword(user.passwordHash, password))) {
      // Reset failed attempts
      user.failedLoginAttempts = 0;
      user.lastLoginAt = Date.now();
      await user.save();

      const token = generateToken(res, user._id);

      res.json({
        success: true,
        token,
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          employeeProfileId: user.employeeProfileId,
          isTwoFactorEnabled: user.isTwoFactorEnabled
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logoutUser = async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    // In a real application, send this URL via email
    console.log(`[Email Mock] Password reset link for ${email}: ${resetUrl}`);

    res.json({ success: true, message: 'Password reset link sent to email.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    user.passwordHash = await hashPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password has been successfully reset. You can now log in.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!(await verifyPassword(user.passwordHash, currentPassword))) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
