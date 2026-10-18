import express from 'express';
import { 
  getEmployeeDashboardData, 
  getEmployeeProfile, 
  updateEmployeeProfile 
} from '../controllers/employeePortalController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', getEmployeeDashboardData);
router.get('/profile', getEmployeeProfile);
router.put('/profile', updateEmployeeProfile);

export default router;
