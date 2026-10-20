import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { isDemoMode } from '../config/db.js';
import { mockData, loadStoreFromDisk } from '../services/mockDataService.js';

export const authenticate = async (req, res, next) => {
  try {
    let token;
    // Check Authorization header first (explicit client token takes precedence over ambient cookies)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_cbdp_2026');

    // If Demo Mode or database not connected, authenticate with demo user corresponding to token
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      loadStoreFromDisk();
      const allMockUsers = [mockData.adminUser, mockData.employeeUser, ...(mockData.users || [])];
      let found = allMockUsers.find(u => 
        (decoded.id && u._id === decoded.id) || 
        (decoded.email && u.email?.toLowerCase() === decoded.email.toLowerCase())
      );

      // If user was created in another worker/session, register into local mock state
      if (!found && decoded.email) {
        found = {
          _id: decoded.id,
          email: decoded.email,
          role: decoded.role || 'EMPLOYEE',
          isActive: true,
          mustChangePassword: false,
          tokenVersion: decoded.tokenVersion || 1
        };
        mockData.users = mockData.users || [];
        mockData.users.push(found);
      }

      if (!found) {
        return res.status(401).json({ success: false, message: 'Not authorized, user session not found' });
      }

      if (!found.isActive || found.isDeleted) {
        return res.status(401).json({ success: false, message: 'Not authorized, account inactive or removed' });
      }

      // Invalidate ONLY if the token was issued before the most recent password reset (tokenVersion < current)
      if (decoded.tokenVersion && found.tokenVersion && decoded.tokenVersion < found.tokenVersion) {
        return res.status(401).json({ 
          success: false, 
          message: 'Session invalidated due to password reset or administrative action. Please log in again.' 
        });
      }

      req.user = found;
      return next();
    }

    // Check if user still exists in database
    let user;
    if (decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
      user = await User.findById(decoded.id).select('-passwordHash').populate('employeeProfileId');
    }
    if (!user && decoded.email) {
      user = await User.findOne({ email: decoded.email.toLowerCase().trim(), isDeleted: { $ne: true } })
        .select('-passwordHash')
        .populate('employeeProfileId');
    }

    if (!user || user.isDeleted) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found or deleted' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Not authorized, account inactive' });
    }

    // Check tokenVersion for immediate session revocation (invalidate ONLY if older than current tokenVersion)
    if (decoded.tokenVersion && user.tokenVersion && decoded.tokenVersion < user.tokenVersion) {
      return res.status(401).json({ 
        success: false, 
        message: 'Session invalidated due to password reset or administrative action. Please log in again.' 
      });
    }

    // If employee role, check linked employee status
    if (user.role === 'EMPLOYEE' && user.employeeProfileId) {
      const emp = user.employeeProfileId;
      if (emp.isDeleted || emp.jobDetails?.status === 'DELETED' || emp.jobDetails?.status === 'TERMINATED') {
        return res.status(401).json({ success: false, message: 'Employee profile is deactivated or terminated.' });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden, you do not have permission to access this resource' 
      });
    }
    next();
  };
};

export const enforceOwnershipOrPermission = (ownerField) => {
  return (req, res, next) => {
    // If Super Admin or HR Admin, bypass
    if (['SUPER_ADMIN', 'HR_ADMIN'].includes(req.user.role)) {
      return next();
    }
    
    // Assuming the resource's owner ID is in the params or body
    const resourceOwnerId = req.params[ownerField] || req.body[ownerField];

    if (req.user.employeeProfileId.toString() !== resourceOwnerId?.toString()) {
       return res.status(403).json({ success: false, message: 'Forbidden, ownership required' });
    }

    next();
  };
};
