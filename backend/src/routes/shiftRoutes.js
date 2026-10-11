import express from 'express';
import { createShift, getShifts, assignShift, getShiftAssignments } from '../controllers/shiftController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

// Get all active shifts
router.get('/', getShifts);
// Get all active shift assignments
router.get('/assignments', getShiftAssignments);

// Admin / HR only routes
router.post('/', authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER']), createShift);
router.post('/assign', authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER']), assignShift);

export default router;
