/**
 * Recurring Transaction Controller
 * CRUD endpoints for recurring transaction templates
 */

import RecurringTransaction from '../models/RecurringTransaction.js';
import Budget from '../models/Budget.js';
import logger from '../utils/logger.js';
import HTTP_STATUS from '../constants/httpStatusCodes.js';
import ERROR_MESSAGES from '../constants/errorMessages.js';
import { validateBudgetAmount, validateMongoId, validateTransactionType } from '../utils/validators.js';
import { trackActivity } from '../utils/activityLogger.js';

export const getRecurringTransactions = async (req, res, next) => {
  try {
    const templates = await RecurringTransaction.find({ userId: req.userId })
      .populate('budgetId', 'category')
      .sort({ createdAt: -1 });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      statusCode: HTTP_STATUS.OK,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    logger.error('Error fetching recurring transactions', error);
    next(error);
  }
};

export const createRecurringTransaction = async (req, res, next) => {
  try {
    const {
      description,
      amount,
      budgetId,
      type = 'expense',
      paymentMethod,
      notes,
      recurrence,
    } = req.body;

    if (!description || amount === undefined || !budgetId || !recurrence?.frequency) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.MISSING_REQUIRED_FIELD,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    if (!validateBudgetAmount(amount)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_TRANSACTION_AMOUNT,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    if (!validateMongoId(budgetId)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid budget ID',
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    if (!validateTransactionType(type)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid transaction type',
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    const budget = await Budget.findById(budgetId);
    if (!budget || budget.userId.toString() !== req.userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        statusCode: HTTP_STATUS.FORBIDDEN,
      });
    }

    const template = await RecurringTransaction.create({
      userId: req.userId,
      budgetId,
      description: description.trim(),
      amount: parseFloat(amount),
      type,
      paymentMethod,
      notes: notes?.trim(),
      recurrence,
    });

    await template.populate('budgetId', 'category');
    await trackActivity({
      userId: req.userId,
      actorId: req.userId,
      action: 'recurring.create',
      entityType: 'recurringTransaction',
      entityId: template._id,
      summary: `Created recurring ${template.type} template "${template.description}"`,
      metadata: {
        amount: template.amount,
        recurrence: template.recurrence,
        budgetId: template.budgetId?._id || template.budgetId,
      },
      req,
    });

    logger.info('Recurring transaction template created', {
      templateId: template._id,
      userId: req.userId,
    });

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Recurring transaction created successfully',
      statusCode: HTTP_STATUS.CREATED,
      data: template,
    });
  } catch (error) {
    logger.error('Error creating recurring transaction', error);
    next(error);
  }
};

export const updateRecurringTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const template = await RecurringTransaction.findById(id);

    if (!template) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recurring transaction not found',
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    }

    if (template.userId.toString() !== req.userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        statusCode: HTTP_STATUS.FORBIDDEN,
      });
    }

    if (updates.amount !== undefined && !validateBudgetAmount(updates.amount)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_TRANSACTION_AMOUNT,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    if (updates.type && !validateTransactionType(updates.type)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid transaction type',
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    if (updates.budgetId !== undefined) {
      if (!validateMongoId(updates.budgetId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid budget ID',
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const budget = await Budget.findById(updates.budgetId);
      if (!budget || budget.userId.toString() !== req.userId) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: ERROR_MESSAGES.UNAUTHORIZED,
          statusCode: HTTP_STATUS.FORBIDDEN,
        });
      }

      template.budgetId = updates.budgetId;
    }

    if (updates.description !== undefined) {
      if (typeof updates.description !== 'string') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Description must be a string',
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }
      template.description = updates.description.trim();
    }

    if (updates.amount !== undefined) {
      template.amount = parseFloat(updates.amount);
    }

    if (updates.type !== undefined) {
      template.type = updates.type;
    }

    if (updates.paymentMethod !== undefined) {
      template.paymentMethod = updates.paymentMethod;
    }

    if (updates.notes !== undefined) {
      template.notes =
        typeof updates.notes === 'string' ? updates.notes.trim() : undefined;
    }

    if (updates.isActive !== undefined) {
      if (typeof updates.isActive === 'boolean') {
        template.isActive = updates.isActive;
      } else if (updates.isActive === 'true' || updates.isActive === 'false') {
        template.isActive = updates.isActive === 'true';
      } else {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'isActive must be a boolean',
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }
    }

    if (updates.recurrence !== undefined) {
      if (
        !updates.recurrence ||
        typeof updates.recurrence !== 'object' ||
        Array.isArray(updates.recurrence)
      ) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid recurrence payload',
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const currentRecurrence =
        typeof template.recurrence?.toObject === 'function'
          ? template.recurrence.toObject()
          : template.recurrence || {};

      template.recurrence = {
        ...currentRecurrence,
        ...updates.recurrence,
      };
    }

    await template.save();
    await template.populate('budgetId', 'category');
    await trackActivity({
      userId: req.userId,
      actorId: req.userId,
      action: 'recurring.update',
      entityType: 'recurringTransaction',
      entityId: template._id,
      summary: `Updated recurring template "${template.description}"`,
      metadata: {
        amount: template.amount,
        recurrence: template.recurrence,
        isActive: template.isActive,
      },
      req,
    });

    logger.info('Recurring transaction template updated', {
      templateId: template._id,
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Recurring transaction updated successfully',
      statusCode: HTTP_STATUS.OK,
      data: template,
    });
  } catch (error) {
    logger.error('Error updating recurring transaction', error);
    next(error);
  }
};

export const deleteRecurringTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await RecurringTransaction.findById(id);

    if (!template) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recurring transaction not found',
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    }

    if (template.userId.toString() !== req.userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        statusCode: HTTP_STATUS.FORBIDDEN,
      });
    }

    await RecurringTransaction.findByIdAndDelete(id);

    await trackActivity({
      userId: req.userId,
      actorId: req.userId,
      action: 'recurring.delete',
      entityType: 'recurringTransaction',
      entityId: id,
      summary: `Deleted recurring template "${template.description}"`,
      metadata: {
        amount: template.amount,
        recurrence: template.recurrence,
      },
      req,
    });

    logger.info('Recurring transaction template deleted', { templateId: id });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Recurring transaction deleted successfully',
      statusCode: HTTP_STATUS.OK,
    });
  } catch (error) {
    logger.error('Error deleting recurring transaction', error);
    next(error);
  }
};

export default {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
};

