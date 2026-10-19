import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';

export const authenticate = async (req, res, next) => {
  try {
    let token;
    // Check if token exists in cookies or Authorization header
    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_cbdp_2026');

    // If Demo Mode or database not connected, authenticate with demo user corresponding to token
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const allMockUsers = [mockData.adminUser, mockData.employeeUser, ...(mockData.users || [])];
      const found = allMockUsers.find(u => u._id === decoded.id || u.email === decoded.email);
      if (found) {
        if (!found.isActive || found.isDeleted) {
          return res.status(401).json({ success: false, message: 'Not authorized, account inactive or removed' });
        }
        req.user = found;
        return next();
      }
      req.user = decoded.id === mockData.employeeUser?._id ? mockData.employeeUser : mockData.adminUser;
      return next();
    }

    // Check if user still exists in database
    const user = await User.findById(decoded.id).select('-passwordHash').populate('employeeProfileId');
    if (!user || user.isDeleted) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found or deleted' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Not authorized, account inactive' });
    }

    // Check tokenVersion for immediate session revocation
    if (decoded.tokenVersion && user.tokenVersion && decoded.tokenVersion !== user.tokenVersion) {
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
