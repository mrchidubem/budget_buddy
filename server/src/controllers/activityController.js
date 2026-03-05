/**
 * Activity Controller
 * Read endpoints for user activity timeline.
 */

import ActivityLog from '../models/ActivityLog.js';
import HTTP_STATUS from '../constants/httpStatusCodes.js';
import logger from '../utils/logger.js';

export const getRecentActivities = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ActivityLog.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments({ userId: req.userId }),
    ]);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      statusCode: HTTP_STATUS.OK,
      page,
      limit,
      total,
      count: items.length,
      data: items,
    });
  } catch (error) {
    logger.error('Error fetching activity timeline', error);
    next(error);
  }
};

export default {
  getRecentActivities,
};
