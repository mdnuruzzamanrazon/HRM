import express from 'express';
import { 
  createShift, 
  getShifts, 
  assignShift, 
  getShiftAssignments, 
  getMyShift,
  updateShift,
  deleteShift,
  deleteShiftAssignment
} from '../controllers/shiftController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();
const hrRoles = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER'];

router.use(authenticate);

// Employee routes
router.get('/my', getMyShift);

// Get all active shifts & roster
router.get('/', getShifts);
router.get('/assignments', getShiftAssignments);

// Admin / HR only routes
router.post('/', authorize(hrRoles), createShift);
router.put('/:id', authorize(hrRoles), updateShift);
router.delete('/:id', authorize(hrRoles), deleteShift);
router.post('/assign', authorize(hrRoles), assignShift);
router.delete('/assignments/:id', authorize(hrRoles), deleteShiftAssignment);

export default router;
