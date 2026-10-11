import express from 'express';
import { createTask, getTasks, updateTaskStatus, deleteTask } from '../controllers/taskController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

// Get tasks (filtered automatically by role in controller)
router.get('/', getTasks);

// Update task status (anyone can update status of tasks they have access to)
router.put('/:id/status', updateTaskStatus);

// Only Admins / Managers can create or delete tasks
router.post('/', authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER']), createTask);
router.delete('/:id', authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER']), deleteTask);

export default router;
