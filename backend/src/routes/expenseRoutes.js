import express from 'express';
import { submitExpense, getMyExpenses, getAllExpenses, updateExpenseStatus } from '../controllers/expenseController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

// Employee routes
router.post('/submit', submitExpense);
router.get('/my', getMyExpenses);

// Admin / Manager / Finance routes
router.get('/all', authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER', 'FINANCE_OFFICER']), getAllExpenses);
router.put('/:id/status', authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER', 'FINANCE_OFFICER']), updateExpenseStatus);

export default router;
