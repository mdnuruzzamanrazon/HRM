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
  reviewAttendanceCorrection,
  manualRecordAttendance,
  deleteAttendanceRecord
} from '../controllers/attendanceController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

const hrRoles = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER'];

// Employee & Shared Attendance Endpoints
router.post('/clock-in', authenticate, clockIn);
router.post('/clock-out', authenticate, clockOut);
router.get('/today', authenticate, getTodayAttendance);
router.get('/my', authenticate, getMyAttendance);

// Attendance Correction Requests
router.post('/corrections', authenticate, submitAttendanceCorrection);
router.get('/corrections/my', authenticate, getMyAttendanceCorrections);
router.get('/corrections', authenticate, authorize(hrRoles), getAllAttendanceCorrections);
router.put('/corrections/:id', authenticate, authorize(hrRoles), reviewAttendanceCorrection);
router.put('/corrections/:id/review', authenticate, authorize(hrRoles), reviewAttendanceCorrection);

// Admin routes to view & manage attendance
router.get('/daily', authenticate, authorize([...hrRoles, 'DEPT_MANAGER']), getDailyAttendance);
router.post('/manual', authenticate, authorize(hrRoles), manualRecordAttendance);
router.delete('/:id', authenticate, authorize(hrRoles), deleteAttendanceRecord);

export default router;
