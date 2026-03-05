import express from 'express';
import { forgotPassword, resetPasswordInfo, signup } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPasswordInfo);

export default router;
