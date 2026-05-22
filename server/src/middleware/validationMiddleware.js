/**
 * Validation Middleware
 * Comprehensive input validation middleware for all routes
 * Follows express-validator patterns for consistency
 */

import { body, param, query, validationResult } from 'express-validator';
import logger from '../utils/logger.js';
import HTTP_STATUS from '../constants/httpStatusCodes.js';
import {
  validateEmail,
  validatePassword,
  validateMongoId,
  validateBudgetAmount,
  validateTransactionAmount,
  validateBudgetCategory,
  validatePaymentMethod,
  validateTransactionType,
  sanitizeString,
  validateCurrencyCode,
  validateUserName,
  validateISODate,
} from '../utils/validators.js';

/**
 * Middleware to handle validation errors
 * Must be called after validation chains
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.param,
      message: err.msg,
      value: err.value,
    }));

    logger.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors: formattedErrors,
    });

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      statusCode: HTTP_STATUS.BAD_REQUEST,
      errors: formattedErrors,
    });
  }
  next();
};

/**
 * Authentication validation rules
 */
export const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters')
    .custom((value) => {
      if (!validateUserName(value)) {
        throw new Error('Name must contain only letters and spaces');
      }
      return true;
    }),

  body('email')
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage('Email is required')
    .custom((value) => {
      if (!validateEmail(value)) {
        throw new Error('Invalid email format');
      }
      return true;
    }),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .custom((value) => {
      if (!validatePassword(value)) {
        throw new Error(
          'Password must be 8+ chars with uppercase, lowercase, number, and special character (@$!%*?&)'
        );
      }
      return true;
    }),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  body('preferredCurrency')
    .optional()
    .custom((value) => {
      if (!validateCurrencyCode(value)) {
        throw new Error('Invalid currency code');
      }
      return true;
    }),
];

export const validateLogin = [
  body('email')
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage('Email is required')
    .custom((value) => {
      if (!validateEmail(value)) {
        throw new Error('Invalid email format');
      }
      return true;
    }),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Invalid credentials'),
];

/**
 * Budget validation rules
 */
export const validateCreateBudget = [
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .custom((value) => {
      if (!validateBudgetCategory(value)) {
        throw new Error('Invalid budget category');
      }
      return true;
    }),

  body('limit')
    .notEmpty()
    .withMessage('Budget limit is required')
    .isNumeric()
    .withMessage('Limit must be a number')
    .custom((value) => {
      if (!validateBudgetAmount(value)) {
        throw new Error('Limit must be a positive number');
      }
      return true;
    }),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters')
    .customSanitizer((value) => sanitizeString(value)),

  body('alertThreshold')
    .optional()
    .isNumeric()
    .withMessage('Alert threshold must be a number')
    .isInt({ min: 1, max: 100 })
    .withMessage('Alert threshold must be between 1-100'),
];

export const validateUpdateBudget = [
  param('id')
    .custom((value) => {
      if (!validateMongoId(value)) {
        throw new Error('Invalid budget ID');
      }
      return true;
    }),

  body('category')
    .optional()
    .trim()
    .custom((value) => {
      if (!validateBudgetCategory(value)) {
        throw new Error('Invalid budget category');
      }
      return true;
    }),

  body('limit')
    .optional()
    .isNumeric()
    .withMessage('Limit must be a number')
    .custom((value) => {
      if (!validateBudgetAmount(value)) {
        throw new Error('Limit must be a positive number');
      }
      return true;
    }),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters')
    .customSanitizer((value) => sanitizeString(value)),

  body('alertThreshold')
    .optional()
    .isNumeric()
    .isInt({ min: 1, max: 100 })
    .withMessage('Alert threshold must be between 1-100'),
];

export const validateDeleteBudget = [
  param('id')
    .custom((value) => {
      if (!validateMongoId(value)) {
        throw new Error('Invalid budget ID');
      }
      return true;
    }),
];

/**
 * Transaction validation rules
 */
export const validateCreateTransaction = [
  body('budgetId')
    .notEmpty()
    .withMessage('Budget ID is required')
    .custom((value) => {
      if (!validateMongoId(value)) {
        throw new Error('Invalid budget ID');
      }
      return true;
    }),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom((value) => {
      if (!validateTransactionAmount(value)) {
        throw new Error('Amount must be a positive number');
      }
      return true;
    }),

  body('type')
    .notEmpty()
    .withMessage('Transaction type is required')
    .custom((value) => {
      if (!validateTransactionType(value)) {
        throw new Error('Type must be income or expense');
      }
      return true;
    }),

  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description is required and must be 1-200 characters')
    .customSanitizer((value) => sanitizeString(value)),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .toDate(),

  body('paymentMethod')
    .optional()
    .trim()
    .custom((value) => {
      if (!validatePaymentMethod(value)) {
        throw new Error('Invalid payment method');
      }
      return true;
    }),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
    .customSanitizer((value) => sanitizeString(value)),
];

export const validateUpdateTransaction = [
  param('id')
    .custom((value) => {
      if (!validateMongoId(value)) {
        throw new Error('Invalid transaction ID');
      }
      return true;
    }),

  body('amount')
    .optional()
    .isNumeric()
    .custom((value) => {
      if (!validateTransactionAmount(value)) {
        throw new Error('Amount must be a positive number');
      }
      return true;
    }),

  body('type')
    .optional()
    .custom((value) => {
      if (!validateTransactionType(value)) {
        throw new Error('Type must be income or expense');
      }
      return true;
    }),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be 1-200 characters')
    .customSanitizer((value) => sanitizeString(value)),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .toDate(),

  body('paymentMethod')
    .optional()
    .trim()
    .custom((value) => {
      if (!validatePaymentMethod(value)) {
        throw new Error('Invalid payment method');
      }
      return true;
    }),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
    .customSanitizer((value) => sanitizeString(value)),
];

export const validateDeleteTransaction = [
  param('id')
    .custom((value) => {
      if (!validateMongoId(value)) {
        throw new Error('Invalid transaction ID');
      }
      return true;
    }),
];

/**
 * Query parameter validation
 */
export const validateTransactionQuery = [
  query('budgetId')
    .optional()
    .custom((value) => {
      if (!validateMongoId(value)) {
        throw new Error('Invalid budget ID');
      }
      return true;
    }),

  query('type')
    .optional()
    .custom((value) => {
      if (!validateTransactionType(value)) {
        throw new Error('Type must be income or expense');
      }
      return true;
    }),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
];

/**
 * User preference validation
 */
export const validateUpdatePreferences = [
  body('preferredCurrency')
    .optional()
    .custom((value) => {
      if (!validateCurrencyCode(value)) {
        throw new Error('Invalid currency code');
      }
      return true;
    }),

  body('alertPreferences')
    .optional()
    .isObject()
    .withMessage('Alert preferences must be an object'),

  body('alertPreferences.emailEnabled')
    .optional()
    .isBoolean()
    .withMessage('Email enabled must be a boolean'),

  body('alertPreferences.dailyThresholdPercent')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Daily threshold must be 1-100'),

  body('alertPreferences.budgetThresholdPercent')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Budget threshold must be 1-100'),
];

export default {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateCreateBudget,
  validateUpdateBudget,
  validateDeleteBudget,
  validateCreateTransaction,
  validateUpdateTransaction,
  validateDeleteTransaction,
  validateTransactionQuery,
  validateUpdatePreferences,
};
