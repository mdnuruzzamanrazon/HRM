import express from 'express';
import { 
  createTask, 
  getTasks, 
  getTaskById,
  acceptTask,
  startTask,
  submitTask,
  reviewTask,
  addTaskMessage,
  downloadTaskFile,
  updateTaskStatus, 
  updateTask,
  deleteTask 
} from '../controllers/taskController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { taskUpload } from '../utils/fileUpload.js';

const router = express.Router();

const HR_ROLES = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER'];

// All task routes require authentication
router.use(authenticate);

// 1. Get tasks (Strictly filtered by role in controller)
router.get('/', getTasks);

// 2. Get single task by ID
router.get('/:id', getTaskById);

// 3. Create task (HR/Admin only, supports file attachments)
router.post('/', authorize(HR_ROLES), taskUpload.array('attachments', 10), createTask);

// 4. Update task details (HR/Admin only)
router.put('/:id', authorize(HR_ROLES), updateTask);

// 5. Quick status update
router.put('/:id/status', updateTaskStatus);

// 6. Employee accepts task
router.put('/:id/accept', acceptTask);

// 7. Employee starts task
router.put('/:id/start', startTask);

// 8. Employee submits deliverable (supports multiple file formats + notes)
router.post('/:id/submit', taskUpload.array('files', 10), submitTask);

// 9. HR reviews submission (Under review, request revision, approve)
router.put('/:id/review', authorize(HR_ROLES), reviewTask);

// 10. Threaded task messaging / feedback
router.post('/:id/messages', addTaskMessage);

// 11. Secure authenticated file download (HR or assigned employee only)
router.get('/:id/files/:fileId/download', downloadTaskFile);

// 12. Delete / cancel task (HR/Admin only)
router.delete('/:id', authorize(HR_ROLES), deleteTask);

export default router;
