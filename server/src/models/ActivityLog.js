/**
 * Activity Log Model
 * Tracks user actions for auditability and timeline views.
 */

import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: [120, 'Action cannot exceed 120 characters'],
    },
    entityType: {
      type: String,
      required: true,
      trim: true,
      maxlength: [60, 'Entity type cannot exceed 60 characters'],
    },
    entityId: {
      type: String,
      trim: true,
      maxlength: [120, 'Entity id cannot exceed 120 characters'],
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: [220, 'Summary cannot exceed 220 characters'],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: [120, 'IP address cannot exceed 120 characters'],
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: [400, 'User agent cannot exceed 400 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },
  },
  {
    versionKey: false,
  }
);

activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, entityType: 1, entityId: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
