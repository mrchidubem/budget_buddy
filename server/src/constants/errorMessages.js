/**
 * Error Messages
 * Standardized error messages used throughout the application
 */

export const ERROR_MESSAGES = {
    // Auth Errors
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_NOT_FOUND: 'User not found',
    USER_ALREADY_EXISTS: 'Email already registered',
    INVALID_TOKEN: 'Invalid or expired token',
    TOKEN_REQUIRED: 'Authorization token required',
    UNAUTHORIZED: 'Unauthorized access',
  
    // Validation Errors
    VALIDATION_ERROR: 'Validation error',
    MISSING_REQUIRED_FIELD: 'Missing required field',
    INVALID_EMAIL: 'Invalid email format',
    INVALID_PASSWORD:
      'Password must be at least 8 characters and include one uppercase letter and one number',
    PASSWORDS_DONT_MATCH: 'Passwords do not match',
  
    // Budget Errors
    BUDGET_NOT_FOUND: 'Budget not found',
    BUDGET_ALREADY_EXISTS: 'Budget for this category already exists',
    INVALID_BUDGET_LIMIT: 'Budget limit must be greater than 0',
  
    // Transaction Errors
    TRANSACTION_NOT_FOUND: 'Transaction not found',
    INVALID_TRANSACTION_AMOUNT: 'Transaction amount must be greater than 0',
  
    // Server Errors
    INTERNAL_SERVER_ERROR: 'Internal server error',
    DATABASE_ERROR: 'Database error occurred',
    UNKNOWN_ERROR: 'An unknown error occurred',
  };
  
  export default ERROR_MESSAGES;
