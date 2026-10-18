import express from 'express';
import { createShift, getShifts, assignShift, getShiftAssignments, getMyShift } from '../controllers/shiftController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

// Employee routes
router.get('/my', getMyShift);

// Get all active shifts
router.get('/', getShifts);
router.get('/assignments', getShiftAssignments);

// Admin / HR only routes
router.post('/', authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER']), createShift);
router.post('/assign', authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER']), assignShift);

export default router;
