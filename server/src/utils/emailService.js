/**
 * Email Service
 * Supports free-friendly providers:
 * - Brevo API
 * - Resend API
 * - SendGrid API
 * - SMTP/Gmail via Nodemailer
 *
 * If no provider is configured, emails are logged in development.
 */

import nodemailer from 'nodemailer';
import logger from './logger.js';

const fromAddress = process.env.EMAIL_FROM || 'no-reply@budget-buddy.local';

export const getEmailProvider = () => {
  if (process.env.BREVO_API_KEY) return 'brevo';
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SENDGRID_API_KEY) return 'sendgrid';
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return 'smtp';
  }
  return 'simulated-log';
};

const assertSuccessfulResponse = async (response, provider) => {
  if (response.ok) return;

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = await response.text();
  }

  const error = new Error(`${provider} email request failed`);
  error.statusCode = response.status;
  error.providerResponse = body;
  throw error;
};

const sendWithBrevo = async ({ to, subject, text, html }) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        email: fromAddress,
        name: process.env.EMAIL_FROM_NAME || 'Budget Buddy',
      },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });

  await assertSuccessfulResponse(response, 'Brevo');
};

const sendWithResend = async ({ to, subject, text, html }) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: `${process.env.EMAIL_FROM_NAME || 'Budget Buddy'} <${fromAddress}>`,
      to,
      subject,
      text,
      html,
    }),
  });

  await assertSuccessfulResponse(response, 'Resend');
};

const sendWithSendGrid = async ({ to, subject, text, html }) => {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: {
        email: fromAddress,
        name: process.env.EMAIL_FROM_NAME || 'Budget Buddy',
      },
      subject,
      content: [
        { type: 'text/plain', value: text || '' },
        ...(html ? [{ type: 'text/html', value: html }] : []),
      ],
    }),
  });

  await assertSuccessfulResponse(response, 'SendGrid');
};

const sendWithSmtp = async ({ to, subject, text, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `${process.env.EMAIL_FROM_NAME || 'Budget Buddy'} <${fromAddress}>`,
    to,
    subject,
    text,
    html,
  });
};

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) {
    throw new Error('Email recipient is required');
  }

  const provider = getEmailProvider();

  try {
    if (provider === 'brevo') {
      await sendWithBrevo({ to, subject, text, html });
    } else if (provider === 'resend') {
      await sendWithResend({ to, subject, text, html });
    } else if (provider === 'sendgrid') {
      await sendWithSendGrid({ to, subject, text, html });
    } else if (provider === 'smtp') {
      await sendWithSmtp({ to, subject, text, html });
    } else {
      logger.info('Email (simulated)', { to, subject, text });
      return { provider, sent: false };
    }

    logger.info('Email sent', { to, subject, provider });
    return { provider, sent: true };
  } catch (error) {
    logger.error('Error sending email', {
      message: error.message,
      provider,
      statusCode: error.statusCode,
      providerResponse: error.providerResponse,
    });
    throw error;
  }
};

export const sendBudgetAlertEmail = async (user, budget) => {
  if (!user?.email || !budget) return { sent: false };

  const subject = `Budget alert: ${budget.category} is near its limit`;
  const text = `Hi ${user.name || ''}, your ${budget.category} budget has reached ${budget.percentageSpent}% of its limit.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #10201b;">
      <h2 style="margin: 0 0 12px;">Budget Buddy alert</h2>
      <p>Hi ${user.name || ''},</p>
      <p>Your <strong>${budget.category}</strong> budget has reached <strong>${budget.percentageSpent}%</strong> of its limit.</p>
      <p>Open Budget Buddy to review spending and adjust your plan.</p>
    </div>
  `;

  return sendEmail({ to: user.email, subject, text, html });
};

export const sendMonthlySummaryEmail = async (user, summaryText) => {
  if (!user?.email) return { sent: false };

  return sendEmail({
    to: user.email,
    subject: 'Your Budget Buddy monthly summary',
    text: summaryText,
  });
};

export default {
  sendEmail,
  sendBudgetAlertEmail,
  sendMonthlySummaryEmail,
  getEmailProvider,
};
