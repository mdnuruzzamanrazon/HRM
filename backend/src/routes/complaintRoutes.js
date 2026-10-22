import express from 'express';
import {
  getComplaintStats,
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  updateComplaintStatus,
  manageComplaintAppeal,
  deleteComplaint,
  exportComplaints
} from '../controllers/complaintController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

const HR_MANAGEMENT_ROLES = [
  'SUPER_ADMIN',
  'HR_ADMIN',
  'HR_MANAGER',
  'DEPT_MANAGER',
  'FINANCE_OFFICER'
];

// All Complaints & Feedback Register routes require authentication
router.use(authenticate);

// -------------------------------------------------------------
// COMPLAINT REGISTER ROUTES
// -------------------------------------------------------------

// Summary Statistics for KPI Dashboard Cards
router.get('/stats', authorize(HR_MANAGEMENT_ROLES), getComplaintStats);

// Export / Print Full Register
router.get('/export', authorize(HR_MANAGEMENT_ROLES), exportComplaints);

// List Complaints with search, filter, sort, pagination
router.get('/', authorize(HR_MANAGEMENT_ROLES), getComplaints);

// Single Record Details
router.get('/:id', authorize(HR_MANAGEMENT_ROLES), getComplaintById);

// Create Record
router.post('/', authorize(HR_MANAGEMENT_ROLES), createComplaint);

// Update Record
router.put('/:id', authorize(HR_MANAGEMENT_ROLES), updateComplaint);

// Quick Status Toggle / Close
router.patch('/:id/status', authorize(HR_MANAGEMENT_ROLES), updateComplaintStatus);

// Manage Appeal Details
router.post('/:id/appeal', authorize(HR_MANAGEMENT_ROLES), manageComplaintAppeal);

// Soft Delete (Restricted to Super Admin & HR Admin)
router.delete('/:id', authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER']), deleteComplaint);

export default router;
