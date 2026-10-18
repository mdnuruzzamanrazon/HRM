import express from 'express';
import { 
  applyLeave, 
  getMyLeaves, 
  getLeaveBalances, 
  cancelLeave, 
  getAllLeaves, 
  updateLeaveStatus 
} from '../controllers/leaveController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Employee routes
router.post('/apply', authenticate, applyLeave);
router.get('/my', authenticate, getMyLeaves);
router.get('/balances', authenticate, getLeaveBalances);
router.put('/:id/cancel', authenticate, cancelLeave);

// Admin / Manager routes
router.get('/all', authenticate, authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER']), getAllLeaves);
router.put('/:id/status', authenticate, authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER']), updateLeaveStatus);

export default router;
