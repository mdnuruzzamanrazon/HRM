import express from 'express';
import {
  getAllWorkplaces,
  getActiveWorkplaces,
  getWorkplaceById,
  createWorkplace,
  updateWorkplace,
  toggleWorkplaceStatus,
  deleteWorkplace,
} from '../controllers/workplaceLocationController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();
const hrRoles = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER'];

// Authenticate all workplace routes
router.use(authenticate);

// Publicly active workplaces for all authenticated users (e.g. employee check-in verification)
router.get('/active', getActiveWorkplaces);

// Admin-only endpoints
router.get('/', authorize(hrRoles), getAllWorkplaces);
router.get('/:id', getWorkplaceById);
router.post('/', authorize(hrRoles), createWorkplace);
router.put('/:id', authorize(hrRoles), updateWorkplace);
router.patch('/:id/status', authorize(hrRoles), toggleWorkplaceStatus);
router.delete('/:id', authorize(hrRoles), deleteWorkplace);

export default router;
