import express from 'express';
import { 
  generatePayroll, 
  getAllPayslips, 
  getMyPayslips, 
  updatePayslipStatus,
  updatePayslipDetails,
  createPayslipManual,
  deletePayslip
} from '../controllers/payrollController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();
const financeRoles = ['SUPER_ADMIN', 'FINANCE_OFFICER', 'HR_ADMIN'];

// Employee routes
router.get('/my', authenticate, getMyPayslips);

// Admin / Finance routes
router.post('/generate', authenticate, authorize(financeRoles), generatePayroll);
router.post('/manual', authenticate, authorize(financeRoles), createPayslipManual);
router.get('/all', authenticate, authorize(financeRoles), getAllPayslips);
router.put('/:id', authenticate, authorize(financeRoles), updatePayslipDetails);
router.put('/:id/status', authenticate, authorize(financeRoles), updatePayslipStatus);
router.delete('/:id', authenticate, authorize(financeRoles), deletePayslip);

export default router;
