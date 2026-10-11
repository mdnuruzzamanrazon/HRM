import express from 'express';
import { createNotice, getActiveNotices, deleteNotice } from '../controllers/noticeController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

// All users can view active notices
router.get('/', getActiveNotices);

// Only Admins / HR can post or delete notices
router.post('/', authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER']), createNotice);
router.delete('/:id', authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER']), deleteNotice);

export default router;
