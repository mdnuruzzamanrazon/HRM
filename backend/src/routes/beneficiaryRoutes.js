import express from 'express';
import {
  getBeneficiaries,
  getBeneficiaryStats,
  getBeneficiaryById,
  createBeneficiary,
  updateBeneficiary,
  deleteBeneficiary,
  exportBeneficiaries,
  batchImportBeneficiaries,
} from '../controllers/beneficiaryController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

const HR_BENEFICIARY_ROLES = [
  'SUPER_ADMIN',
  'HR_ADMIN',
  'HR_MANAGER',
  'DEPT_MANAGER',
  'FINANCE_OFFICER',
  'EMPLOYEE',
];

const WRITE_ROLES = [
  'SUPER_ADMIN',
  'HR_ADMIN',
  'HR_MANAGER',
  'DEPT_MANAGER',
  'FINANCE_OFFICER',
];

// All beneficiary routes require authentication
router.use(authenticate);

// 1. Dynamic Summary Statistics for KPI Cards
router.get('/stats', authorize(HR_BENEFICIARY_ROLES), getBeneficiaryStats);

// 2. Export Beneficiaries (JSON, CSV, XLSX)
router.get('/export', authorize(HR_BENEFICIARY_ROLES), exportBeneficiaries);

// 3. Batch Import Beneficiary Spreadsheet
router.post('/import', authorize(WRITE_ROLES), batchImportBeneficiaries);

// 4. List Beneficiaries with search, cascading location filters, sorting & pagination
router.get('/', authorize(HR_BENEFICIARY_ROLES), getBeneficiaries);

// 5. Single Beneficiary Details
router.get('/:id', authorize(HR_BENEFICIARY_ROLES), getBeneficiaryById);

// 6. Create New Beneficiary
router.post('/', authorize(WRITE_ROLES), createBeneficiary);

// 7. Update Beneficiary
router.put('/:id', authorize(WRITE_ROLES), updateBeneficiary);

// 8. Delete Beneficiary
router.delete('/:id', authorize(['SUPER_ADMIN', 'HR_ADMIN']), deleteBeneficiary);

export default router;
