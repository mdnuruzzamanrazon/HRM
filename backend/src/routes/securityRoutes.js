import express from 'express';
import { getActiveSessions, revokeSession, getSecurityPolicy, updateSecurityPolicy, setup2FA, verify2FA, disable2FA } from '../controllers/securityController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

// Session routes
router.get('/sessions', getActiveSessions);
router.delete('/sessions/:id', revokeSession);

// 2FA routes
router.post('/2fa/setup', setup2FA);
router.post('/2fa/verify', verify2FA);
router.post('/2fa/disable', disable2FA);

// Global Policy routes (Admin only)
router.get('/policies', authorize(['SUPER_ADMIN', 'HR_ADMIN']), getSecurityPolicy);
router.put('/policies', authorize(['SUPER_ADMIN', 'HR_ADMIN']), updateSecurityPolicy);

export default router;
