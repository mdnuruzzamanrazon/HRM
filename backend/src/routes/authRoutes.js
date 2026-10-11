import express from 'express';
import { loginUser, logoutUser, forgotPassword, resetPassword, updatePassword } from '../controllers/authController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Example protected route
router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

router.put('/update-password', authenticate, updatePassword);

export default router;
