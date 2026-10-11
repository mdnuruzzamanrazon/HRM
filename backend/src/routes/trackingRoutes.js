import express from 'express';
import { checkIn, getAllLogs, getMyLogs } from '../controllers/trackingController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

// Employee routes
router.post('/checkin', checkIn);
router.get('/my', getMyLogs);

// Admin routes
router.get('/all', authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER']), getAllLogs);

export default router;
