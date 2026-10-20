import express from 'express';
import { 
  getEmployees, 
  getEmployeeById, 
  createEmployee, 
  updateEmployee, 
  updateEmployeeStatus, 
  resetEmployeePassword, 
  toggleEmployeeAccount, 
  deleteEmployee, 
  uploadEmployeeDocument, 
  deleteEmployeeDocument,
  syncEmployees 
} from '../controllers/employeeController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

const hrRoles = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER'];
const adminRoles = ['SUPER_ADMIN', 'HR_ADMIN'];

router.get('/', authenticate, getEmployees);
router.post('/sync', authenticate, authorize(adminRoles), syncEmployees);
router.get('/:id', authenticate, getEmployeeById);
router.post('/', authenticate, authorize(adminRoles), createEmployee);
router.put('/:id', authenticate, authorize(hrRoles), updateEmployee);
router.put('/:id/status', authenticate, authorize(hrRoles), updateEmployeeStatus);
router.post('/:id/reset-password', authenticate, authorize(hrRoles), resetEmployeePassword);
router.put('/:id/toggle-account', authenticate, authorize(adminRoles), toggleEmployeeAccount);
router.delete('/:id', authenticate, authorize(adminRoles), deleteEmployee);
router.post('/:id/documents', authenticate, authorize(hrRoles), uploadEmployeeDocument);
router.delete('/:id/documents/:docId', authenticate, authorize(hrRoles), deleteEmployeeDocument);

export default router;
