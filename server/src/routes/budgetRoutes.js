/**
 * Budget Routes
 * Handles all budget-related endpoints
 * All routes are protected and require authentication
 * GET /api/budgets - Get all budgets
 * GET /api/budgets/:id - Get single budget
 * POST /api/budgets - Create budget
 * PUT /api/budgets/:id - Update budget
 * DELETE /api/budgets/:id - Delete budget
 */

import express from 'express';
import {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../controllers/budgetController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// Budget routes
router.get('/', getAllBudgets);
router.get('/:id', getBudgetById);
router.post('/', createBudget);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;