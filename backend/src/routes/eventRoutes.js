import express from 'express';
import {
  getEvents,
  getEventStats,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  exportEvents,
  getMetadata,
} from '../controllers/eventController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

const HR_EVENT_ROLES = [
  'SUPER_ADMIN',
  'HR_ADMIN',
  'HR_MANAGER',
  'DEPT_MANAGER',
  'FINANCE_OFFICER',
  'EMPLOYEE'
];

// All event routes require authentication
router.use(authenticate);

// 1. Metadata and Lookup options (event types, themes, SPs, consortium partners, instructions)
router.get('/metadata', getMetadata);

// 2. Summary Statistics for KPI Dashboard Cards
router.get('/stats', authorize(HR_EVENT_ROLES), getEventStats);

// 3. Export Event Records
router.get('/export', authorize(HR_EVENT_ROLES), exportEvents);

// 4. List Events with search, cascading location filters, sort, pagination
router.get('/', authorize(HR_EVENT_ROLES), getEvents);

// 5. Single Event Details
router.get('/:id', authorize(HR_EVENT_ROLES), getEventById);

// 6. Create Event
router.post('/', authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER', 'FINANCE_OFFICER']), createEvent);

// 7. Update Event
router.put('/:id', authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER', 'FINANCE_OFFICER']), updateEvent);

// 8. Soft Delete Event
router.delete('/:id', authorize(['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER']), deleteEvent);

export default router;
