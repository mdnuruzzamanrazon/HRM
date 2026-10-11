import express from 'express';
import { generatePayroll, getAllPayslips, getMyPayslips, updatePayslipStatus } from '../controllers/payrollController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Employee routes
router.get('/my', authenticate, getMyPayslips);

// Admin / Finance routes
router.post('/generate', authenticate, authorize(['SUPER_ADMIN', 'FINANCE_OFFICER']), generatePayroll);
router.get('/all', authenticate, authorize(['SUPER_ADMIN', 'FINANCE_OFFICER', 'HR_ADMIN']), getAllPayslips);
router.put('/:id/status', authenticate, authorize(['SUPER_ADMIN', 'FINANCE_OFFICER']), updatePayslipStatus);

export default router;
