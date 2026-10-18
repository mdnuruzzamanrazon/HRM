import express from 'express';
import { 
  clockIn, 
  clockOut, 
  getDailyAttendance, 
  getTodayAttendance, 
  getMyAttendance, 
  submitAttendanceCorrection, 
  getMyAttendanceCorrections, 
  getAllAttendanceCorrections, 
  reviewAttendanceCorrection 
} from '../controllers/attendanceController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Employee & Shared Attendance Endpoints
router.post('/clock-in', authenticate, clockIn);
router.post('/clock-out', authenticate, clockOut);
router.get('/today', authenticate, getTodayAttendance);
router.get('/my', authenticate, getMyAttendance);

// Attendance Correction Requests
router.post('/corrections', authenticate, submitAttendanceCorrection);
router.get('/corrections/my', authenticate, getMyAttendanceCorrections);
router.get('/corrections', authenticate, authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER']), getAllAttendanceCorrections);
router.put('/corrections/:id', authenticate, authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER']), reviewAttendanceCorrection);
router.put('/corrections/:id/review', authenticate, authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER']), reviewAttendanceCorrection);

// Admin route to view everyone's attendance
router.get('/daily', authenticate, authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER']), getDailyAttendance);

export default router;
