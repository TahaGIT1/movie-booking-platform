import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { 
  registerSchema, 
  loginSchema, 
  refreshSchema, 
  sendSignupOtpSchema, 
  verifySignupOtpSchema, 
  sendForgotPasswordOtpSchema, 
  resetPasswordSchema 
} from './auth.schema.js';
import { authenticate } from '../../middleware/auth.middleware.js';

import jwt from 'jsonwebtoken';

const router = Router();

const permissiveAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.decode(token);
      if (decoded?.userId) {
        req.user = { id: decoded.userId };
      }
    }
  } catch (err) {
    // ignore
  }
  next();
};

// Authentication & Session Routes
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', validateRequest(refreshSchema), authController.refresh);
router.post('/logout', permissiveAuth, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, authController.updateMe);

// OTP Verification & Password Reset Routes
router.post('/otp/send-signup-otp', validateRequest(sendSignupOtpSchema), authController.sendSignupOtp);
router.post('/otp/verify-signup-otp', validateRequest(verifySignupOtpSchema), authController.verifySignupOtp);
router.post('/otp/send-forgot-password-otp', validateRequest(sendForgotPasswordOtpSchema), authController.sendForgotPasswordOtp);
router.post('/otp/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);

export default router;
