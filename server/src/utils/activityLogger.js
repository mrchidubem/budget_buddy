/**
 * Activity logger helper
 * Best-effort persistence of user action logs.
 */

import ActivityLog from '../models/ActivityLog.js';
import logger from './logger.js';

const resolveIpAddress = (req) => {
  if (!req) return undefined;
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip;
};

export const trackActivity = async ({
  userId,
  actorId,
  action,
  entityType,
  entityId,
  summary,
  metadata = {},
  req,
}) => {
  if (!userId || !action || !entityType || !summary) return;

  try {
    await ActivityLog.create({
      userId,
      actorId: actorId || userId,
      action,
      entityType,
      entityId: entityId ? String(entityId) : undefined,
      summary,
      metadata,
      ipAddress: resolveIpAddress(req),
      userAgent: req?.headers?.['user-agent'],
    });
  } catch (error) {
    logger.warn('Failed to write activity log', {
      action,
      userId,
      error: error.message,
    });
  }
};

export default {
  trackActivity,
};
