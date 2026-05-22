/**
 * Authentication Routes
 * Handles all authentication-related endpoints
 * POST /api/auth/register - Register new user
 * POST /api/auth/login - Login user
 * GET /api/auth/me - Get current user (protected)
 * POST /api/auth/logout - Logout user (protected)
 */

import express from 'express';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  refreshAuthToken,
  updateUserPreferences,
  logoutUser,
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  validateRegister,
  validateLogin,
  validateUpdatePreferences,
  handleValidationErrors,
} from '../middleware/validationMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.use(authRateLimiter);

// Public routes with validation
router.post('/register', validateRegister, handleValidationErrors, registerUser);
router.post('/login', validateLogin, handleValidationErrors, loginUser);
router.post('/refresh', refreshAuthToken);

// Protected routes with validation
router.get('/me', authMiddleware, getCurrentUser);
router.put(
  '/preferences',
  authMiddleware,
  validateUpdatePreferences,
  handleValidationErrors,
  updateUserPreferences
);
router.post('/logout', authMiddleware, logoutUser);

export default router;
