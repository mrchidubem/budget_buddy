/**
 * Goal Controller
 * CRUD endpoints for savings / financial goals
 */

import Goal from '../models/Goal.js';
import logger from '../utils/logger.js';
import HTTP_STATUS from '../constants/httpStatusCodes.js';
import ERROR_MESSAGES from '../constants/errorMessages.js';
import { trackActivity } from '../utils/activityLogger.js';

export const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ userId: req.userId }).sort({ createdAt: -1 });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      statusCode: HTTP_STATUS.OK,
      count: goals.length,
      data: goals,
    });
  } catch (error) {
    logger.error('Error fetching goals', error);
    next(error);
  }
};

export const createGoal = async (req, res, next) => {
  try {
    const { name, targetAmount, deadline, category } = req.body;

    if (!name || targetAmount === undefined) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.MISSING_REQUIRED_FIELD,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    const goal = await Goal.create({
      userId: req.userId,
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      deadline,
      category,
    });

    await trackActivity({
      userId: req.userId,
      actorId: req.userId,
      action: 'goal.create',
      entityType: 'goal',
      entityId: goal._id,
      summary: `Created goal "${goal.name}"`,
      metadata: {
        targetAmount: goal.targetAmount,
        deadline: goal.deadline,
        category: goal.category,
      },
      req,
    });

    logger.info('Goal created', { goalId: goal._id, userId: req.userId });

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Goal created successfully',
      statusCode: HTTP_STATUS.CREATED,
      data: goal,
    });
  } catch (error) {
    logger.error('Error creating goal', error);
    next(error);
  }
};

export const updateGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const goal = await Goal.findById(id);

    if (!goal) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Goal not found',
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    }

    if (goal.userId.toString() !== req.userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        statusCode: HTTP_STATUS.FORBIDDEN,
      });
    }

    Object.assign(goal, updates);
    await goal.save();

    await trackActivity({
      userId: req.userId,
      actorId: req.userId,
      action: 'goal.update',
      entityType: 'goal',
      entityId: goal._id,
      summary: `Updated goal "${goal.name}"`,
      metadata: {
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        status: goal.status,
      },
      req,
    });

    logger.info('Goal updated', { goalId: goal._id });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Goal updated successfully',
      statusCode: HTTP_STATUS.OK,
      data: goal,
    });
  } catch (error) {
    logger.error('Error updating goal', error);
    next(error);
  }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const { id } = req.params;

    const goal = await Goal.findById(id);

    if (!goal) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Goal not found',
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    }

    if (goal.userId.toString() !== req.userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        statusCode: HTTP_STATUS.FORBIDDEN,
      });
    }

    await Goal.findByIdAndDelete(id);

    await trackActivity({
      userId: req.userId,
      actorId: req.userId,
      action: 'goal.delete',
      entityType: 'goal',
      entityId: id,
      summary: `Deleted goal "${goal.name}"`,
      metadata: {
        targetAmount: goal.targetAmount,
      },
      req,
    });

    logger.info('Goal deleted', { goalId: id });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Goal deleted successfully',
      statusCode: HTTP_STATUS.OK,
    });
  } catch (error) {
    logger.error('Error deleting goal', error);
    next(error);
  }
};

export default {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
};

