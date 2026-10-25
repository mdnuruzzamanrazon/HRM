import express from 'express';
import {
  getProjects,
  getProjectById,
  getProjectDashboard,
  createProject,
  updateProject,
  updateProjectStatus,
  assignProjectUsers,
  deleteProject
} from '../controllers/projectController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { checkProjectAccess } from '../middlewares/projectAuth.js';

const router = express.Router();

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_ADMIN'];
const PROJECT_MANAGE_ROLES = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER'];

// All routes require authentication
router.use(authenticate);

// List all accessible projects
router.get('/', getProjects);

// Project details and dashboard
router.get('/:id', checkProjectAccess(), getProjectById);
router.get('/:id/dashboard', checkProjectAccess(), getProjectDashboard);

// Project Management CRUD
router.post('/', authorize(PROJECT_MANAGE_ROLES), createProject);
router.put('/:id', authorize(PROJECT_MANAGE_ROLES), checkProjectAccess(null, 'MANAGER'), updateProject);
router.patch('/:id/status', authorize(PROJECT_MANAGE_ROLES), checkProjectAccess(null, 'MANAGER'), updateProjectStatus);
router.post('/:id/assign', authorize(ADMIN_ROLES), assignProjectUsers);
router.delete('/:id', authorize(ADMIN_ROLES), deleteProject);

export default router;
