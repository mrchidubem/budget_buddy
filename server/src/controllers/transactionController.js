/**
 * Transaction Controller
 * Handles transaction CRUD operations and statistics
 */

import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import {
  validateBudgetAmount,
  validateTransactionType,
  validateMongoId,
} from '../utils/validators.js';
import HTTP_STATUS from '../constants/httpStatusCodes.js';
import ERROR_MESSAGES from '../constants/errorMessages.js';
import { trackActivity } from '../utils/activityLogger.js';

const parseOptionalDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const VALID_PAYMENT_METHODS = [
  'cash',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'digital_wallet',
];

/**
 * Get all transactions for current user
 * GET /api/transactions
 * Query params: budgetId, type, startDate, endDate
 */
export const getAllTransactions = async (req, res, next) => {
  try {
    const { budgetId, type, startDate, endDate } = req.query;
    const query = { userId: req.userId };

    // Filter by budget
    if (budgetId) {
      if (!validateMongoId(budgetId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid budget ID',
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }
      query.budgetId = budgetId;
    }

    // Filter by type
    if (type) {
      if (!validateTransactionType(type)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid transaction type',
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }
      query.type = type;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};

      if (startDate) {
        const parsedStartDate = parseOptionalDate(startDate);
        if (!parsedStartDate) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Invalid start date',
            statusCode: HTTP_STATUS.BAD_REQUEST,
          });
        }

        query.date.$gte = parsedStartDate;
      }

      if (endDate) {
        const parsedEndDate = parseOptionalDate(endDate);
        if (!parsedEndDate) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Invalid end date',
            statusCode: HTTP_STATUS.BAD_REQUEST,
          });
        }

        parsedEndDate.setHours(23, 59, 59, 999);
        query.date.$lte = parsedEndDate;
      }
    }

    const transactions = await Transaction.find(query)
      .populate('budgetId', 'category')
      .sort({ date: -1 });

    logger.debug('Fetched transactions', { count: transactions.length });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      statusCode: HTTP_STATUS.OK,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    logger.error('Error fetching transactions', error);
    next(error);
  }
};

/**
 * Get single transaction
 * GET /api/transactions/:id
 */
export const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id).populate('budgetId');

    if (!transaction) {
      logger.warn('Transaction not found', { transactionId: id });
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.TRANSACTION_NOT_FOUND,
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    }

    // Check ownership
    if (transaction.userId.toString() !== req.userId) {
      logger.warn('Unauthorized transaction access', { userId: req.userId });
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        statusCode: HTTP_STATUS.FORBIDDEN,
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      statusCode: HTTP_STATUS.OK,
      data: transaction,
    });
  } catch (error) {
    logger.error('Error fetching transaction', error);
    next(error);
  }
};

/**
 * Create new transaction
 * POST /api/transactions
 * Body: { description, amount, budgetId, type, notes, paymentMethod, date }
 */
export const createTransaction = async (req, res, next) => {
  try {
    const { description, amount, budgetId, type, notes, paymentMethod, date } =
      req.body;
    const normalizedDescription =
      typeof description === 'string' ? description.trim() : '';

    // Validate required fields
    if (!normalizedDescription || amount === undefined || !budgetId) {
      logger.warn('Create transaction: Missing required fields');
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.MISSING_REQUIRED_FIELD,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Validate amount
    if (!validateBudgetAmount(amount)) {
      logger.warn('Create transaction: Invalid amount', { amount });
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_TRANSACTION_AMOUNT,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Check if budget exists and belongs to user
    const budget = await Budget.findById(budgetId);
    if (!budget) {
      logger.warn('Create transaction: Budget not found', { budgetId });
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.BUDGET_NOT_FOUND,
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    }

    if (budget.userId.toString() !== req.userId) {
      logger.warn('Create transaction: Unauthorized budget access');
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        statusCode: HTTP_STATUS.FORBIDDEN,
      });
    }

    const parsedDate = parseOptionalDate(date);
    if (date && !parsedDate) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid transaction date',
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    if (paymentMethod && !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid payment method',
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Create transaction
    const transaction = new Transaction({
      description: normalizedDescription,
      amount: parseFloat(amount),
      type: type || 'expense',
      budgetId,
      userId: req.userId,
      notes: notes?.trim(),
      paymentMethod: paymentMethod || 'cash',
      ...(parsedDate ? { date: parsedDate } : {}),
    });

    await transaction.save();
    await transaction.populate('budgetId', 'category');

    await trackActivity({
      userId: req.userId,
      actorId: req.userId,
      action: 'transaction.create',
      entityType: 'transaction',
      entityId: transaction._id,
      summary: `Added ${transaction.type} transaction "${transaction.description}"`,
      metadata: {
        amount: transaction.amount,
        type: transaction.type,
        budgetId: transaction.budgetId?._id || transaction.budgetId,
        date: transaction.date,
      },
      req,
    });

    logger.info('Transaction created', {
      transactionId: transaction._id,
      userId: req.userId,
    });

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Transaction created successfully',
      statusCode: HTTP_STATUS.CREATED,
      data: transaction,
    });
  } catch (error) {
    logger.error('Error creating transaction', error);
    next(error);
  }
};

/**
 * Update transaction
 * PUT /api/transactions/:id
 * Body: { description, amount, type, notes, paymentMethod, date }
 */
export const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, amount, type, notes, paymentMethod, date } = req.body;

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      logger.warn('Update transaction: Transaction not found', { transactionId: id });
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.TRANSACTION_NOT_FOUND,
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    }

    // Check ownership
    if (transaction.userId.toString() !== req.userId) {
      logger.warn('Update transaction: Unauthorized access');
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        statusCode: HTTP_STATUS.FORBIDDEN,
      });
    }

    // Update fields
    if (description !== undefined) {
      if (typeof description !== 'string' || !description.trim()) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Description must be a non-empty string',
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }
      transaction.description = description.trim();
    }

    if (amount !== undefined) {
      if (!validateBudgetAmount(amount)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.INVALID_TRANSACTION_AMOUNT,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }
      transaction.amount = parseFloat(amount);
    }

    if (type !== undefined) {
      if (!validateTransactionType(type)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid transaction type',
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }
      transaction.type = type;
    }

    if (notes !== undefined) {
      if (notes === null || notes === '') {
        transaction.notes = undefined;
      } else if (typeof notes === 'string') {
        transaction.notes = notes.trim();
      } else {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Notes must be a string',
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }
    }

    if (paymentMethod !== undefined) {
      if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid payment method',
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }
      transaction.paymentMethod = paymentMethod;
    }

    if (date !== undefined) {
      const parsedDate = parseOptionalDate(date);
      if (!parsedDate) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid transaction date',
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }
      transaction.date = parsedDate;
    }

    transaction.updatedAt = new Date();
    await transaction.save();
    await transaction.populate('budgetId', 'category');

    await trackActivity({
      userId: req.userId,
      actorId: req.userId,
      action: 'transaction.update',
      entityType: 'transaction',
      entityId: transaction._id,
      summary: `Updated transaction "${transaction.description}"`,
      metadata: {
        amount: transaction.amount,
        type: transaction.type,
        budgetId: transaction.budgetId?._id || transaction.budgetId,
        date: transaction.date,
      },
      req,
    });

    logger.info('Transaction updated', { transactionId: transaction._id });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Transaction updated successfully',
      statusCode: HTTP_STATUS.OK,
      data: transaction,
    });
  } catch (error) {
    logger.error('Error updating transaction', error);
    next(error);
  }
};

/**
 * Delete transaction
 * DELETE /api/transactions/:id
 */
export const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      logger.warn('Delete transaction: Transaction not found', { transactionId: id });
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.TRANSACTION_NOT_FOUND,
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    }

    // Check ownership
    if (transaction.userId.toString() !== req.userId) {
      logger.warn('Delete transaction: Unauthorized access');
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        statusCode: HTTP_STATUS.FORBIDDEN,
      });
    }

    await Transaction.findByIdAndDelete(id);

    await trackActivity({
      userId: req.userId,
      actorId: req.userId,
      action: 'transaction.delete',
      entityType: 'transaction',
      entityId: id,
      summary: `Deleted transaction "${transaction.description}"`,
      metadata: {
        amount: transaction.amount,
        type: transaction.type,
        budgetId: transaction.budgetId,
        date: transaction.date,
      },
      req,
    });

    logger.info('Transaction deleted', { transactionId: id });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Transaction deleted successfully',
      statusCode: HTTP_STATUS.OK,
    });
  } catch (error) {
    logger.error('Error deleting transaction', error);
    next(error);
  }
};

/**
 * Get transaction statistics
 * GET /api/transactions/stats/:budgetId
 */
export const getTransactionStats = async (req, res, next) => {
  try {
    const { budgetId } = req.params;

    if (!validateMongoId(budgetId)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid budget ID',
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Check if budget exists and belongs to user
    const budget = await Budget.findById(budgetId);
    if (!budget || budget.userId.toString() !== req.userId) {
      logger.warn('Stats: Unauthorized access');
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        statusCode: HTTP_STATUS.FORBIDDEN,
      });
    }

    // Get statistics
    const stats = await Transaction.aggregate([
      {
        $match: {
          budgetId: new mongoose.Types.ObjectId(budgetId),
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          average: { $avg: '$amount' },
        },
      },
    ]);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      statusCode: HTTP_STATUS.OK,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching statistics', error);
    next(error);
  }
};

export default {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
};
