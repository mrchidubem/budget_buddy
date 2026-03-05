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

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// Transaction routes
router.get('/', getAllTransactions);
router.get('/stats/:budgetId', getTransactionStats);
router.get('/:id', getTransactionById);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;