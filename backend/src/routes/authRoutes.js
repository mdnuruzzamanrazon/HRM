import express from 'express';
import { 
  loginUser, 
  logoutUser, 
  forgotPassword, 
  verifyResetCode, 
  resetPassword, 
  changeFirstLoginPassword, 
  updatePassword,
  getEmailDiagnostics,
  configureEmailService
} from '../controllers/authController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/email-diagnostics', getEmailDiagnostics);
router.post('/configure-email', configureEmailService);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/resend-code', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/change-first-login-password', authenticate, changeFirstLoginPassword);

// Example protected route
router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});
router.get('/profile', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

router.put('/update-password', authenticate, updatePassword);

export default router;

