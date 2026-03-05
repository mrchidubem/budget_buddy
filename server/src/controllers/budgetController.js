/**
 * Budget Controller
 * Handles budget CRUD operations
 */

import Budget from '../models/Budget.js';
import logger from '../utils/logger.js';
import { validateBudgetAmount, validateBudgetCategory } from '../utils/validators.js';
import HTTP_STATUS from '../constants/httpStatusCodes.js';
import ERROR_MESSAGES from '../constants/errorMessages.js';
import { trackActivity } from '../utils/activityLogger.js';

/**
 * Get all budgets for current user
 * GET /api/budgets
 */
export const getAllBudgets = async (req, res, next) => {
  try {
    const budgets = await Budget.find({ userId: req.userId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    logger.debug('Fetched budgets', { count: budgets.length, userId: req.userId });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      statusCode: HTTP_STATUS.OK,
      count: budgets.length,
      data: budgets,
    });
  } catch (error) {
    logger.error('Error fetching budgets', error);
    next(error);
  }
};

/**
 * Get single budget
 * GET /api/budgets/:id
 */
export const getBudgetById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const budget = await Budget.findById(id).populate('userId', 'name email');

    if (!budget) {
      logger.warn('Budget not found', { budgetId: id });
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.BUDGET_NOT_FOUND,
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    }

    // Check ownership
    if (budget.userId._id.toString() !== req.userId) {
      logger.warn('Unauthorized budget access', { userId: req.userId, budgetId: id });
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        statusCode: HTTP_STATUS.FORBIDDEN,
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      statusCode: HTTP_STATUS.OK,
      data: budget,
    });
  } catch (error) {
    logger.error('Error fetching budget', error);
    next(error);
  }
};

/**
 * Create new budget
 * POST /api/budgets
 * Body: { category, limit, description }
 */
export const createBudget = async (req, res, next) => {
  try {
    const { category, limit, description } = req.body;

    // Validate required fields
    if (!category || limit === undefined) {
      logger.warn('Create budget: Missing required fields');
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.MISSING_REQUIRED_FIELD,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Validate category
    if (!validateBudgetCategory(category)) {
      logger.warn('Create budget: Invalid category', { category });
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid budget category',
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Validate amount
    if (!validateBudgetAmount(limit)) {
      logger.warn('Create budget: Invalid limit', { limit });
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_BUDGET_LIMIT,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Check if budget already exists for this category
    const existingBudget = await Budget.findOne({
      userId: req.userId,
      category,
    });

    if (existingBudget) {
      logger.warn('Create budget: Category already has budget', {
        userId: req.userId,
        category,
      });
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: ERROR_MESSAGES.BUDGET_ALREADY_EXISTS,
        statusCode: HTTP_STATUS.CONFLICT,
      });
    }

    // Create budget
    const budget = new Budget({
      category,
      limit: parseFloat(limit),
      description: description?.trim(),
      userId: req.userId,
    });

    await budget.save();
    await budget.populate('userId', 'name email');

    await trackActivity({
      userId: req.userId,
      actorId: req.userId,
      action: 'budget.create',
      entityType: 'budget',
      entityId: budget._id,
      summary: `Created budget "${budget.category}"`,
      metadata: {
        category: budget.category,
        limit: budget.limit,
      },
      req,
    });

    logger.info('Budget created', { budgetId: budget._id, userId: req.userId });

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Budget created successfully',
      statusCode: HTTP_STATUS.CREATED,
      data: budget,
    });
  } catch (error) {
    logger.error('Error creating budget', error);
    next(error);
  }
};

/**
 * Update budget
 * PUT /api/budgets/:id
 * Body: { limit, description, alertThreshold }
 */
export const updateBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit, description, alertThreshold, isActive } = req.body;

    const budget = await Budget.findById(id);

    if (!budget) {
      logger.warn('Update budget: Budget not found', { budgetId: id });
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.BUDGET_NOT_FOUND,
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    }

    // Check ownership
    if (budget.userId.toString() !== req.userId) {
      logger.warn('Update budget: Unauthorized access', { userId: req.userId });
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        statusCode: HTTP_STATUS.FORBIDDEN,
      });
    }

    // Update fields
    if (limit !== undefined) {
      if (!validateBudgetAmount(limit)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.INVALID_BUDGET_LIMIT,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }
      budget.limit = parseFloat(limit);
    }

    if (description !== undefined) {
      if (description === null || description === '') {
        budget.description = undefined;
      } else if (typeof description === 'string') {
        budget.description = description.trim();
      } else {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Description must be a string',
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }
    }

    if (alertThreshold !== undefined) {
      const numericThreshold = Number(alertThreshold);
      if (!Number.isFinite(numericThreshold)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Alert threshold must be a number',
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }
      budget.alertThreshold = Math.min(Math.max(numericThreshold, 0), 100);
    }

    if (isActive !== undefined) {
      if (typeof isActive === 'boolean') {
        budget.isActive = isActive;
      } else if (isActive === 'true' || isActive === 'false') {
        budget.isActive = isActive === 'true';
      } else {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'isActive must be a boolean',
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }
    }

    budget.updatedAt = new Date();
    await budget.save();
    await budget.populate('userId', 'name email');

    await trackActivity({
      userId: req.userId,
      actorId: req.userId,
      action: 'budget.update',
      entityType: 'budget',
      entityId: budget._id,
      summary: `Updated budget "${budget.category}"`,
      metadata: {
        category: budget.category,
        limit: budget.limit,
        alertThreshold: budget.alertThreshold,
        isActive: budget.isActive,
      },
      req,
    });

    logger.info('Budget updated', { budgetId: budget._id });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Budget updated successfully',
      statusCode: HTTP_STATUS.OK,
      data: budget,
    });
  } catch (error) {
    logger.error('Error updating budget', error);
    next(error);
  }
};

/**
 * Delete budget
 * DELETE /api/budgets/:id
 */
export const deleteBudget = async (req, res, next) => {
  try {
    const { id } = req.params;

    const budget = await Budget.findById(id);

    if (!budget) {
      logger.warn('Delete budget: Budget not found', { budgetId: id });
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.BUDGET_NOT_FOUND,
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    }

    // Check ownership
    if (budget.userId.toString() !== req.userId) {
      logger.warn('Delete budget: Unauthorized access', { userId: req.userId });
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        statusCode: HTTP_STATUS.FORBIDDEN,
      });
    }

    await Budget.findByIdAndDelete(id);

    await trackActivity({
      userId: req.userId,
      actorId: req.userId,
      action: 'budget.delete',
      entityType: 'budget',
      entityId: id,
      summary: `Deleted budget "${budget.category}"`,
      metadata: {
        category: budget.category,
        limit: budget.limit,
      },
      req,
    });

    logger.info('Budget deleted', { budgetId: id, userId: req.userId });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Budget deleted successfully',
      statusCode: HTTP_STATUS.OK,
    });
  } catch (error) {
    logger.error('Error deleting budget', error);
    next(error);
  }
};

export default {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
};
