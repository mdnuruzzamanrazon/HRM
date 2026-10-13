import mongoose from 'mongoose';
import { Session } from '../models/Session.js';
import { SecurityPolicy } from '../models/SecurityPolicy.js';
import { User } from '../models/User.js';
import * as otplib from 'otplib';
import qrcode from 'qrcode';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';

// --- Session Management ---

export const getActiveSessions = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: mockData.security.sessions });
    }
    const sessions = await Session.find({ userId: req.user._id, isActive: true })
      .sort({ lastActive: -1 });
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const revokeSession = async (req, res) => {
  try {
    const { id } = req.params;
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, message: 'Session revoked successfully' });
    }
    const session = await Session.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, message: 'Session revoked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Global Security Policies ---

export const getSecurityPolicy = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: mockData.security.policies });
    }
    let policy = await SecurityPolicy.findOne();
    if (!policy) {
      policy = new SecurityPolicy();
      await policy.save();
    }
    res.json({ success: true, data: policy });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSecurityPolicy = async (req, res) => {
  try {
    const { enforceStrongPasswords, sessionTimeout, require2FA } = req.body;
    let policy = await SecurityPolicy.findOne();
    if (!policy) {
      policy = new SecurityPolicy();
    }
    
    if (enforceStrongPasswords !== undefined) policy.enforceStrongPasswords = enforceStrongPasswords;
    if (sessionTimeout !== undefined) policy.sessionTimeout = sessionTimeout;
    if (require2FA !== undefined) policy.require2FA = require2FA;

    await policy.save();
    res.json({ success: true, data: policy, message: 'Security policies updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Two-Factor Authentication ---

export const setup2FA = async (req, res) => {
  try {
    const secret = otplib.authenticator.generateSecret();
    const email = req.user?.email || 'admin@cbdp.org';

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      mockData.adminUser.twoFactorSecret = secret;
      const otpauth = otplib.authenticator.keyuri(email, 'CBDP HR', secret);
      const qrCodeUrl = await qrcode.toDataURL(otpauth);
      return res.json({ success: true, data: { qrCodeUrl, secret } });
    }

    const user = await User.findById(req.user._id);
    user.twoFactorSecret = secret;
    await user.save();

    const otpauth = otplib.authenticator.keyuri(user.email, 'CBDP HR', secret);
    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    res.json({ success: true, data: { qrCodeUrl, secret } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const secret = mockData.adminUser.twoFactorSecret;
      if (!secret) {
        return res.status(400).json({ success: false, message: '2FA secret not found. Setup 2FA first.' });
      }
      const isValid = otplib.authenticator.check(token, secret);
      if (isValid || token === '123456') {
        mockData.adminUser.isTwoFactorEnabled = true;
        return res.json({ success: true, message: '2FA enabled successfully (Demo Mode)' });
      } else {
        return res.status(400).json({ success: false, message: 'Invalid 2FA token' });
      }
    }

    const user = await User.findById(req.user._id);

    if (!user.twoFactorSecret) {
      return res.status(400).json({ success: false, message: '2FA secret not found. Setup 2FA first.' });
    }

    const isValid = otplib.authenticator.check(token, user.twoFactorSecret);

    if (isValid) {
      user.isTwoFactorEnabled = true;
      await user.save();
      res.json({ success: true, message: '2FA enabled successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid 2FA token' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const disable2FA = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      mockData.adminUser.isTwoFactorEnabled = false;
      mockData.adminUser.twoFactorSecret = undefined;
      return res.json({ success: true, message: '2FA disabled successfully' });
    }

    const user = await User.findById(req.user._id);
    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();
    res.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
