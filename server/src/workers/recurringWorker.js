/**
 * Recurring Transactions Worker
 * Runs on an interval to materialize recurring transaction templates
 * into real Transaction documents.
 *
 * Run with: node src/workers/recurringWorker.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDatabase from '../config/database.js';
import logger from '../utils/logger.js';
import RecurringTransaction from '../models/RecurringTransaction.js';
import Transaction from '../models/Transaction.js';
import { trackActivity } from '../utils/activityLogger.js';

dotenv.config();

const shouldRunToday = (template, today) => {
  if (!template.isActive) return false;

  const { recurrence, lastRunAt } = template;
  if (!recurrence || !recurrence.frequency) return false;

  const start = recurrence.startDate ? new Date(recurrence.startDate) : null;
  const end = recurrence.endDate ? new Date(recurrence.endDate) : null;

  if (start && today < start) return false;
  if (end && today > end) return false;

  // Avoid running more than once per day
  if (lastRunAt) {
    const last = new Date(lastRunAt);
    if (
      last.getFullYear() === today.getFullYear() &&
      last.getMonth() === today.getMonth() &&
      last.getDate() === today.getDate()
    ) {
      return false;
    }
  }

  const weekday = today.getDay(); // 0-6
  const dayOfMonth = today.getDate(); // 1-31

  switch (recurrence.frequency) {
    case 'daily':
      return true;
    case 'weekly':
      return recurrence.weekday === weekday;
    case 'monthly':
      return recurrence.dayOfMonth === dayOfMonth;
    case 'yearly':
      // Simple yearly: same month/day as startDate
      if (!start) return false;
      return (
        today.getMonth() === start.getMonth() &&
        today.getDate() === start.getDate()
      );
    default:
      return false;
  }
};

const runOnce = async () => {
  const today = new Date();
  logger.info('Recurring worker run started', { today: today.toISOString() });

  const templates = await RecurringTransaction.find({ isActive: true }).exec();

  for (const tmpl of templates) {
    if (!shouldRunToday(tmpl, today)) continue;

    try {
      const tx = await Transaction.create({
        userId: tmpl.userId,
        budgetId: tmpl.budgetId,
        description: tmpl.description,
        amount: tmpl.amount,
        type: tmpl.type,
        paymentMethod: tmpl.paymentMethod,
        notes: tmpl.notes,
        date: today,
      });

      tmpl.lastRunAt = today;
      await tmpl.save();
      await trackActivity({
        userId: tmpl.userId,
        actorId: tmpl.userId,
        action: 'recurring.materialize',
        entityType: 'transaction',
        entityId: tx._id,
        summary: `Auto-posted recurring ${tmpl.type} transaction "${tmpl.description}"`,
        metadata: {
          amount: tmpl.amount,
          templateId: tmpl._id,
          budgetId: tmpl.budgetId,
        },
      });

      logger.info('Recurring transaction materialized', {
        templateId: tmpl._id,
        transactionId: tx._id,
      });
    } catch (error) {
      logger.error('Error materializing recurring transaction', {
        templateId: tmpl._id,
        error,
      });
    }
  }

  logger.info('Recurring worker run completed');
};

const startWorker = async () => {
  try {
    await connectDatabase();
    logger.info('Recurring worker connected to database');

    // Run once on start
    await runOnce();

    // Then run every 24 hours
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    setInterval(runOnce, ONE_DAY_MS);
  } catch (error) {
    logger.error('Recurring worker failed to start', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

startWorker();

