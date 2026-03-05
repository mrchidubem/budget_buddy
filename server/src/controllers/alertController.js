/**
 * Alert Controller
 * Handles email alert endpoints and test notifications.
 */

import User from '../models/User.js';
import Budget from '../models/Budget.js';
import logger from '../utils/logger.js';
import HTTP_STATUS from '../constants/httpStatusCodes.js';
import ERROR_MESSAGES from '../constants/errorMessages.js';
import { sendBudgetAlertEmail, sendEmail } from '../utils/emailService.js';
import { validateMongoId } from '../utils/validators.js';
import { trackActivity } from '../utils/activityLogger.js';

const resolveEmailProvider = () => {
  return 'simulated-log';
};

export const sendTestAlertEmail = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    }

    if (!user.alertPreferences?.emailEnabled) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email alerts are disabled in your preferences',
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    await sendEmail({
      to: user.email,
      subject: 'Budget Buddy: Alert Channel Test',
      text: `Hi ${user.name || ''}, your email alert channel is working.`,
    });

    await trackActivity({
      userId: user._id,
      actorId: user._id,
      action: 'alert.email.test',
      entityType: 'alert',
      entityId: user._id,
      summary: 'Sent alert email test',
      metadata: { provider: resolveEmailProvider() },
      req,
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Test email alert recorded',
      statusCode: HTTP_STATUS.OK,
      channel: 'email',
      provider: resolveEmailProvider(),
    });
  } catch (error) {
    logger.error('Error sending test alert email', error);
    next(error);
  }
};

export const sendBudgetThresholdAlertEmail = async (req, res, next) => {
  try {
    const { budgetId, spentPercent, overBy, dailyExceeded } = req.body || {};

    if (!budgetId || !validateMongoId(budgetId)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Valid budgetId is required',
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    const [user, budget] = await Promise.all([
      User.findById(req.userId),
      Budget.findById(budgetId),
    ]);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    }

    if (!budget || budget.userId.toString() !== req.userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        statusCode: HTTP_STATUS.FORBIDDEN,
      });
    }

    if (!user.alertPreferences?.emailEnabled) {
      return res.status(HTTP_STATUS.ACCEPTED).json({
        success: true,
        message: 'Email alerts are disabled for this user',
        statusCode: HTTP_STATUS.ACCEPTED,
        sent: false,
      });
    }

    const numericSpentPercent = Number(spentPercent) || budget.percentageSpent || 0;
    await sendBudgetAlertEmail(user, {
      category: budget.category,
      percentageSpent: numericSpentPercent,
    });

    if (dailyExceeded) {
      await sendEmail({
        to: user.email,
        subject: 'Budget Buddy: Daily spending cap exceeded',
        text: `Your daily spending cap has been exceeded. Over amount: ${Number(overBy) || 0}.`,
      });
    }

    await trackActivity({
      userId: user._id,
      actorId: user._id,
      action: 'alert.email.budget-threshold',
      entityType: 'alert',
      entityId: budget._id,
      summary: `Sent budget threshold email for ${budget.category}`,
      metadata: {
        spentPercent: numericSpentPercent,
        dailyExceeded: Boolean(dailyExceeded),
      },
      req,
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Budget threshold email alert recorded',
      statusCode: HTTP_STATUS.OK,
      sent: true,
      provider: resolveEmailProvider(),
    });
  } catch (error) {
    logger.error('Error sending budget threshold email alert', error);
    next(error);
  }
};

export default {
  sendTestAlertEmail,
  sendBudgetThresholdAlertEmail,
};
