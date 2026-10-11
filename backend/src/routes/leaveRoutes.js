import express from 'express';
import { applyLeave, getMyLeaves, getAllLeaves, updateLeaveStatus } from '../controllers/leaveController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Employee routes
router.post('/apply', authenticate, applyLeave);
router.get('/my', authenticate, getMyLeaves);

// Admin / Manager routes
router.get('/all', authenticate, authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER']), getAllLeaves);
router.put('/:id/status', authenticate, authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER']), updateLeaveStatus);

export default router;
