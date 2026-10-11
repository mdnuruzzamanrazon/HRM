import express from 'express';
import { createTaxRule, getTaxRules, toggleTaxRule } from '../controllers/taxController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

// Finance & Admin routes only for configuration
router.get('/', authorize(['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE_OFFICER']), getTaxRules);
router.post('/', authorize(['SUPER_ADMIN', 'FINANCE_OFFICER']), createTaxRule);
router.put('/:id/toggle', authorize(['SUPER_ADMIN', 'FINANCE_OFFICER']), toggleTaxRule);

export default router;
