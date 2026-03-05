/**
 * Validators Utility
 * Input validation functions for the application
 */

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // Minimum 8 characters, at least one uppercase letter and one number
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

export const validateMongoId = (id) => {
  const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
  return mongoIdRegex.test(id);
};

export const validateBudgetAmount = (amount) => {
  return !isNaN(amount) && parseFloat(amount) > 0;
};

export const validateTransactionType = (type) => {
  return ['income', 'expense'].includes(type);
};

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
  return validCategories.includes(category);
};

export default {
  validateEmail,
  validatePassword,
  validateMongoId,
  validateBudgetAmount,
  validateTransactionType,
  validateBudgetCategory,
};
