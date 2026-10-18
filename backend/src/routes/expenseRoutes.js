import express from 'express';
import { 
  submitExpense, 
  getMyExpenses, 
  getAllExpenses, 
  updateExpenseStatus,
  adminCreateExpense,
  deleteExpense
} from '../controllers/expenseController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();
const hrAndFinanceRoles = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER', 'FINANCE_OFFICER'];

router.use(authenticate);

// Employee routes
router.post('/submit', submitExpense);
router.get('/my', getMyExpenses);

// Admin / Manager / Finance routes
router.get('/all', authorize(hrAndFinanceRoles), getAllExpenses);
router.post('/admin-create', authorize(hrAndFinanceRoles), adminCreateExpense);
router.put('/:id/status', authorize(hrAndFinanceRoles), updateExpenseStatus);
router.delete('/:id', authorize(hrAndFinanceRoles), deleteExpense);

export default router;
