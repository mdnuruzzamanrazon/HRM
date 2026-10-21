import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getRiskRecords,
  getRiskRecordById,
  createRiskRecord,
  updateRiskRecord,
  deleteRiskRecord,
  getCategories,
  createCategoryOrSub,
  getRiskStats
} from '../controllers/riskController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

const HR_MANAGEMENT_ROLES = [
  'SUPER_ADMIN',
  'HR_ADMIN',
  'HR_MANAGER',
  'DEPT_MANAGER',
  'FINANCE_OFFICER'
];

// All Risk Register routes require authentication
router.use(authenticate);

// -------------------------------------------------------------
// PROJECT ROUTES
// -------------------------------------------------------------
router.get('/projects', getProjects);
router.get('/projects/:id', getProjectById);
router.post('/projects', authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER']), createProject);
router.put('/projects/:id', authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER']), updateProject);
router.delete('/projects/:id', authorize(['SUPER_ADMIN', 'HR_ADMIN']), deleteProject);

// -------------------------------------------------------------
// RISK RECORD ROUTES
// -------------------------------------------------------------
router.get('/records', getRiskRecords);
router.get('/records/:id', getRiskRecordById);
router.post('/records', authorize(HR_MANAGEMENT_ROLES), createRiskRecord);
router.put('/records/:id', authorize(HR_MANAGEMENT_ROLES), updateRiskRecord);
router.delete('/records/:id', authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER']), deleteRiskRecord);

// -------------------------------------------------------------
// CATEGORIES & METADATA ROUTES
// -------------------------------------------------------------
router.get('/categories', getCategories);
router.post('/categories', authorize(HR_MANAGEMENT_ROLES), createCategoryOrSub);

// -------------------------------------------------------------
// AGGREGATED STATS & HEATMAP MATRIX
// -------------------------------------------------------------
router.get('/stats', getRiskStats);

export default router;
