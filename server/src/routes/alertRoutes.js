/**
 * Alert Routes
 * Email alert operations.
 */

import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  sendTestAlertEmail,
  sendBudgetThresholdAlertEmail,
} from '../controllers/alertController.js';

const router = express.Router();

router.use(authMiddleware);
router.post('/email/test', sendTestAlertEmail);
router.post('/email/budget-threshold', sendBudgetThresholdAlertEmail);

export default router;
