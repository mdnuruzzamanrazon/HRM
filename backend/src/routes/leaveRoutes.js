import express from 'express';
import { 
  applyLeave, 
  getMyLeaves, 
  getLeaveBalances, 
  cancelLeave, 
  getAllLeaves, 
  updateLeaveStatus,
  adminCreateLeave,
  deleteLeave
} from '../controllers/leaveController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();
const hrRoles = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER'];

// Employee routes
router.post('/apply', authenticate, applyLeave);
router.get('/my', authenticate, getMyLeaves);
router.get('/balances', authenticate, getLeaveBalances);
router.put('/:id/cancel', authenticate, cancelLeave);

// Admin / Manager routes
router.get('/', authenticate, authorize([...hrRoles, 'DEPT_MANAGER']), getAllLeaves);
router.get('/all', authenticate, authorize([...hrRoles, 'DEPT_MANAGER']), getAllLeaves);
router.post('/admin-create', authenticate, authorize(hrRoles), adminCreateLeave);
router.put('/:id/status', authenticate, authorize([...hrRoles, 'DEPT_MANAGER']), updateLeaveStatus);
router.delete('/:id', authenticate, authorize(hrRoles), deleteLeave);

export default router;
