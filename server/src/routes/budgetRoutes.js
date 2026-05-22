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
import {
  validateCreateBudget,
  validateUpdateBudget,
  validateDeleteBudget,
  handleValidationErrors,
} from '../middleware/validationMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// Budget routes
router.get('/', getAllBudgets);
router.get('/:id', (req, res, next) => {
  // Validate ID before controller
  const { id } = req.params;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid budget ID',
      statusCode: 400,
    });
  }
  next();
}, getBudgetById);

router.post('/', validateCreateBudget, handleValidationErrors, createBudget);
router.put(
  '/:id',
  validateUpdateBudget,
  handleValidationErrors,
  updateBudget
);
router.delete(
  '/:id',
  validateDeleteBudget,
  handleValidationErrors,
  deleteBudget
);

export default router;