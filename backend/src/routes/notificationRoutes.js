import express from 'express';
import { getMyNotifications, markAsRead, markAllAsRead, pushNotification } from '../controllers/notificationController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

// Personal notifications
router.get('/', getMyNotifications);
router.put('/mark-all-read', markAllAsRead);
router.put('/:id/read', markAsRead);

// Admin push (for testing/system integration)
router.post('/push', authorize(['SUPER_ADMIN']), pushNotification);

export default router;
