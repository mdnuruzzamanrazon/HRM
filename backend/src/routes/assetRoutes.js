import express from 'express';
import {
  getAssetDashboard,
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  updateQrPrintStatus,
  getFieldKits,
  createFieldKit,
  adjustKitStock,
  getVehicleLogs,
  createVehicleLog,
  getHandovers,
  createHandover,
  createConsumableHandover,
  getWorkflows,
  createWorkflow,
  updateWorkflowStage,
  getReferences,
  updateReferences,
  syncFromGoogleSheets,
} from '../controllers/assetController.js';
import {
  getAssetAssignmentHistory,
  assignAsset,
  unassignAsset,
} from '../controllers/assetAssignmentController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

const HR_READ_ROLES = [
  'SUPER_ADMIN',
  'HR_ADMIN',
  'HR_MANAGER',
  'DEPT_MANAGER',
  'FINANCE_OFFICER',
  'EMPLOYEE',
];

const HR_WRITE_ROLES = [
  'SUPER_ADMIN',
  'HR_ADMIN',
  'HR_MANAGER',
  'DEPT_MANAGER',
  'FINANCE_OFFICER',
];

// All routes require authentication
router.use(authenticate);

// 1. Dashboard Metrics (Worksheet 1 / GID 1754930862)
router.get('/dashboard', authorize(HR_READ_ROLES), getAssetDashboard);

// 2. Reference Categories & Validation Lists (Worksheet 9 / GID 671339665)
router.get('/references', authorize(HR_READ_ROLES), getReferences);
router.put('/references', authorize(HR_WRITE_ROLES), updateReferences);

// 3. Google Sheets Live Synchronization
router.post('/sync-google-sheet', authorize(HR_WRITE_ROLES), syncFromGoogleSheets);

// 4. Batch QR Tagging & Printing (Worksheet 3 / GID 861206349)
router.put('/qr-status', authorize(HR_WRITE_ROLES), updateQrPrintStatus);

// 5. Field Kit Inventory APIs (Worksheet 4 / GID 1726563914)
router.get('/kits', authorize(HR_READ_ROLES), getFieldKits);
router.post('/kits', authorize(HR_WRITE_ROLES), createFieldKit);
router.put('/kits/:id/stock', authorize(HR_WRITE_ROLES), adjustKitStock);

// 6. Vehicle Fleet & Logbook APIs (Worksheet 6 / GID 1933684115)
router.get('/vehicles', authorize(HR_READ_ROLES), getVehicleLogs);
router.post('/vehicles', authorize(HR_WRITE_ROLES), createVehicleLog);

// 7. Handover Deeds & Consumables (Worksheets 7 & 5 / GIDs 2011906547 & 1510015205)
router.get('/handovers', authorize(HR_READ_ROLES), getHandovers);
router.post('/handovers', authorize(HR_WRITE_ROLES), createHandover);
router.post('/consumables', authorize(HR_WRITE_ROLES), createConsumableHandover);

// 8. Lifecycle Workflows (Worksheet 8 / GID 1017327203)
router.get('/workflows', authorize(HR_READ_ROLES), getWorkflows);
router.post('/workflows', authorize(HR_WRITE_ROLES), createWorkflow);
router.put('/workflows/:id/stage', authorize(HR_WRITE_ROLES), updateWorkflowStage);

// 9. Explicit Asset -> Project / Department / Custodian Allocation APIs (Independent of Global Project Context)
router.get('/:id/assignments', authorize(HR_READ_ROLES), getAssetAssignmentHistory);
router.post('/:id/assign', authorize(HR_WRITE_ROLES), assignAsset);
router.post('/:id/unassign', authorize(HR_WRITE_ROLES), unassignAsset);

// 10. Master Asset Register CRUD (Worksheet 2 / GID 1517243350)
router.get('/', authorize(HR_READ_ROLES), getAssets);
router.get('/:id', authorize(HR_READ_ROLES), getAssetById);
router.post('/', authorize(HR_WRITE_ROLES), createAsset);
router.put('/:id', authorize(HR_WRITE_ROLES), updateAsset);
router.delete('/:id', authorize(HR_WRITE_ROLES), deleteAsset);

export default router;
