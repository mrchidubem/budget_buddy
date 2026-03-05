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

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshAuthToken);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);
router.put('/preferences', authMiddleware, updateUserPreferences);
router.post('/logout', authMiddleware, logoutUser);

export default router;
