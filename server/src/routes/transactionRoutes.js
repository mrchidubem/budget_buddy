/**
 * Transaction Routes
 * Handles all transaction-related endpoints
 * All routes are protected and require authentication
 * GET /api/transactions - Get all transactions
 * GET /api/transactions/:id - Get single transaction
 * POST /api/transactions - Create transaction
 * PUT /api/transactions/:id - Update transaction
 * DELETE /api/transactions/:id - Delete transaction
 * GET /api/transactions/stats/:budgetId - Get statistics
 */

import express from 'express';
import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
} from '../controllers/transactionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  validateCreateTransaction,
  validateUpdateTransaction,
  validateDeleteTransaction,
  validateTransactionQuery,
  handleValidationErrors,
} from '../middleware/validationMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// Transaction routes
router.get(
  '/',
  validateTransactionQuery,
  handleValidationErrors,
  getAllTransactions
);
router.post(
  '/',
  validateCreateTransaction,
  handleValidationErrors,
  createTransaction
);

router.get('/stats/:budgetId', (req, res, next) => {
  const { budgetId } = req.params;
  if (!budgetId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid budget ID',
      statusCode: 400,
    });
  }
  next();
}, getTransactionStats);

router.get('/:id', (req, res, next) => {
  const { id } = req.params;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid transaction ID',
      statusCode: 400,
    });
  }
  next();
}, getTransactionById);

router.put(
  '/:id',
  validateUpdateTransaction,
  handleValidationErrors,
  updateTransaction
);

router.delete(
  '/:id',
  validateDeleteTransaction,
  handleValidationErrors,
  deleteTransaction
);

export default router;