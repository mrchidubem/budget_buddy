/**
 * Validators Utility
 * Comprehensive input validation functions for the application
 * All validators return boolean for type safety
 */

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  // RFC 5322 simplified email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) && trimmed.length <= 254;
};

/**
 * Validate password strength
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * @param {string} password
 * @returns {boolean}
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  // Minimum 8 chars, uppercase, lowercase, number, special char
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,128}$/;
  return passwordRegex.test(password);
};

/**
 * Validate MongoDB ObjectId format
 * @param {string} id
 * @returns {boolean}
 */
export const validateMongoId = (id) => {
  if (!id || typeof id !== 'string') return false;
  const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
  return mongoIdRegex.test(id);
};

/**
 * Validate budget amount (positive decimal)
 * @param {any} amount
 * @returns {boolean}
 */
export const validateBudgetAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 999999999;
};

/**
 * Validate transaction amount (positive decimal)
 * @param {any} amount
 * @returns {boolean}
 */
export const validateTransactionAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 999999999;
};

/**
 * Validate transaction type
 * @param {string} type
 * @returns {boolean}
 */
export const validateTransactionType = (type) => {
  return ['income', 'expense'].includes(type?.toLowerCase());
};

/**
 * Validate budget category
 * @param {string} category
 * @returns {boolean}
 */
export const validateBudgetCategory = (category) => {
  const validCategories = [
    'Food',
    'Transportation',
    'Entertainment',
    'Shopping',
    'Utilities',
    'Health',
    'Education',
    'Other',
  ];
  return validCategories.includes(category?.trim());
};

/**
 * Validate payment method
 * @param {string} method
 * @returns {boolean}
 */
export const validatePaymentMethod = (method) => {
  const validMethods = [
    'cash',
    'credit_card',
    'debit_card',
    'bank_transfer',
    'digital_wallet',
  ];
  return validMethods.includes(method?.toLowerCase());
};

/**
 * Validate string length
 * @param {string} str
 * @param {number} minLength
 * @param {number} maxLength
 * @returns {boolean}
 */
export const validateStringLength = (str, minLength = 1, maxLength = 500) => {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
};

/**
 * Sanitize string input (remove XSS attempts)
 * @param {string} str
 * @returns {string}
 */
export const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .substring(0, 500); // Limit length
};

/**
 * Validate ISO date format
 * @param {string} dateString
 * @returns {boolean}
 */
export const validateISODate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
};

/**
 * Validate date is not in the future
 * @param {Date|string} date
 * @returns {boolean}
 */
export const validateDateNotInFuture = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return false;
  return dateObj <= new Date();
};

/**
 * Validate currency code
 * @param {string} code
 * @returns {boolean}
 */
export const validateCurrencyCode = (code) => {
  const validCurrencies = ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD', 'INR', 'JPY'];
  return validCurrencies.includes(code?.toUpperCase());
};

/**
 * Validate user name
 * @param {string} name
 * @returns {boolean}
 */
export const validateUserName = (name) => {
  return validateStringLength(name, 2, 50) && !/[0-9]/.test(name.trim()[0]);
};

export default {
  validateEmail,
  validatePassword,
  validateMongoId,
  validateBudgetAmount,
  validateTransactionAmount,
  validateTransactionType,
  validateBudgetCategory,
  validatePaymentMethod,
  validateStringLength,
  sanitizeString,
  validateISODate,
  validateDateNotInFuture,
  validateCurrencyCode,
  validateUserName,
};
