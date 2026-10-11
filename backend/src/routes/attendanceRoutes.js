import express from 'express';
import { clockIn, clockOut, getDailyAttendance } from '../controllers/attendanceController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.post('/clock-in', authenticate, clockIn);
router.post('/clock-out', authenticate, clockOut);
// Admin route to view everyone's attendance
router.get('/daily', authenticate, authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER']), getDailyAttendance);

export default router;
