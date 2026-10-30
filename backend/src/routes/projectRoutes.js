import express from 'express';
import {
  getProjects,
  getProjectById,
  getProjectDashboard,
  createProject,
  updateProject,
  updateProjectStatus,
  assignProjectUsers,
  deleteProject,
  triggerProjectMigration,
  getUnassignedRecords,
  resolveUnassignedRecord
} from '../controllers/projectController.js';
import { getProjectAssignedEmployees } from '../controllers/employeeAssignmentController.js';
import { getProjectAssignedAssets } from '../controllers/assetAssignmentController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { checkProjectAccess } from '../middlewares/projectAuth.js';

const router = express.Router();

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_ADMIN'];
const PROJECT_MANAGE_ROLES = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER'];

// All routes require authentication
router.use(authenticate);

// Trigger project migration & inspect/resolve flagged legacy records
router.post('/migrate', authorize(ADMIN_ROLES), triggerProjectMigration);
router.get('/unassigned-records', authorize(ADMIN_ROLES), getUnassignedRecords);
router.post('/resolve-unassigned', authorize(ADMIN_ROLES), resolveUnassignedRecord);

// List all accessible projects
router.get('/', getProjects);

// Project details, dashboard, and explicit independent resource assignment views
router.get('/:id', checkProjectAccess(null, 'VIEWER', { fromParamId: true }), getProjectById);
router.get('/:id/dashboard', checkProjectAccess(null, 'VIEWER', { fromParamId: true }), getProjectDashboard);
router.get('/:id/employees', checkProjectAccess(null, 'VIEWER', { fromParamId: true }), getProjectAssignedEmployees);
router.get('/:id/assets', checkProjectAccess(null, 'VIEWER', { fromParamId: true }), getProjectAssignedAssets);

// Project Management CRUD
router.post('/', authorize(PROJECT_MANAGE_ROLES), createProject);
router.put('/:id', authorize(PROJECT_MANAGE_ROLES), checkProjectAccess(null, 'MANAGER', { fromParamId: true }), updateProject);
router.patch('/:id/status', authorize(PROJECT_MANAGE_ROLES), checkProjectAccess(null, 'MANAGER', { fromParamId: true }), updateProjectStatus);
router.post('/:id/assign', authorize(ADMIN_ROLES), assignProjectUsers);
router.delete('/:id', authorize(ADMIN_ROLES), deleteProject);

export default router;
