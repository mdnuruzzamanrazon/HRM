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

    // If Demo Mode or database not connected, authenticate with demo admin user
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      req.user = mockData.adminUser;
      return next();
    }

    // Check if user still exists in database
    const user = await User.findById(decoded.id).select('-passwordHash').populate('employeeProfileId');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Not authorized, account inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
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
