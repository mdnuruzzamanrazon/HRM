import express from 'express';
import { getEmployees, getEmployeeById, createEmployee } from '../controllers/employeeController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, getEmployees);
router.get('/:id', authenticate, getEmployeeById);
router.post('/', authenticate, authorize(['SUPER_ADMIN', 'HR_ADMIN']), createEmployee);

export default router;
