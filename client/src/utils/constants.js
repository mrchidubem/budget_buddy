/**
 * Client Constants
 * Application-wide constants and configuration values
 */

// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const HTTP_TIMEOUT = 10000; // 10 seconds

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'NGN', label: 'Nigerian Naira (NGN)' },
  { code: 'CAD', label: 'Canadian Dollar (CAD)' },
  { code: 'AUD', label: 'Australian Dollar (AUD)' },
  { code: 'INR', label: 'Indian Rupee (INR)' },
  { code: 'JPY', label: 'Japanese Yen (JPY)' },
];

// Budget Categories
export const BUDGET_CATEGORIES = [
  { id: 'food', label: 'Food', icon: 'FD' },
  { id: 'transportation', label: 'Transportation', icon: 'TR' },
  { id: 'entertainment', label: 'Entertainment', icon: 'EN' },
  { id: 'shopping', label: 'Shopping', icon: 'SH' },
  { id: 'utilities', label: 'Utilities', icon: 'UT' },
  { id: 'health', label: 'Health', icon: 'HL' },
  { id: 'education', label: 'Education', icon: 'ED' },
  { id: 'other', label: 'Other', icon: 'OT' },
];

// Transaction Types
export const TRANSACTION_TYPES = [
  { id: 'expense', label: 'Expense', color: 'danger' },
  { id: 'income', label: 'Income', color: 'success' },
];

// Payment Methods
export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'credit_card', label: 'Credit Card' },
  { id: 'debit_card', label: 'Debit Card' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'digital_wallet', label: 'Digital Wallet' },
];

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  THEME: 'theme_preference',
  SESSION_STARTED_AT: 'auth_session_started_at',
  HAS_CREATED_BUDGET: 'has_created_budget',
  PENDING_TX_BUDGET_ID: 'pending_transaction_budget_id',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized. Please login again.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNKNOWN_ERROR: 'An unknown error occurred.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully!',
  REGISTER_SUCCESS: 'Registration successful! Please login.',
  BUDGET_CREATED: 'Budget created successfully!',
  BUDGET_UPDATED: 'Budget updated successfully!',
  BUDGET_DELETED: 'Budget deleted successfully!',
  TRANSACTION_CREATED: 'Transaction added successfully!',
  TRANSACTION_UPDATED: 'Transaction updated successfully!',
  TRANSACTION_DELETED: 'Transaction deleted successfully!',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
};

export default {
  API_BASE_URL,
  HTTP_TIMEOUT,
  SUPPORTED_CURRENCIES,
  BUDGET_CATEGORIES,
  TRANSACTION_TYPES,
  PAYMENT_METHODS,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PAGINATION,
};
