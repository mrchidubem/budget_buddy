/**
 * Email Service
 * Thin wrapper around an email provider (e.g. SendGrid)
 *
 * NOTE: This implementation logs emails to the server log by default.
 * To actually send email, configure SENDGRID_API_KEY in .env and uncomment
 * the SendGrid-specific code.
 */

import logger from './logger.js';

// Example SendGrid integration (commented out to avoid runtime errors
// when no API key is configured).
// import sgMail from '@sendgrid/mail';
//
// if (process.env.SENDGRID_API_KEY) {
//   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// }

const fromAddress = process.env.EMAIL_FROM || 'no-reply@budget-buddy.local';

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // If you plug in a real provider, send here.
    // if (process.env.SENDGRID_API_KEY) {
    //   await sgMail.send({ to, from: fromAddress, subject, text, html });
    //   return;
    // }

    // Fallback: log the email so you can verify behavior in development.
    logger.info('Email (simulated)', { to, subject, text });
  } catch (error) {
    logger.error('Error sending email', error);
  }
};

export const sendBudgetAlertEmail = async (user, budget) => {
  if (!user?.email || !budget) return;

  const subject = `Budget alert: ${budget.category} is near its limit`;
  const text = `Hi ${user.name || ''}, your ${budget.category} budget has reached ${budget.percentageSpent}% of its limit.`;

  await sendEmail({ to: user.email, subject, text });
};

export const sendMonthlySummaryEmail = async (user, summaryText) => {
  if (!user?.email) return;

  const subject = 'Your Budget Buddy monthly summary';
  const text = summaryText;

  await sendEmail({ to: user.email, subject, text });
};

export default {
  sendEmail,
  sendBudgetAlertEmail,
  sendMonthlySummaryEmail,
};

