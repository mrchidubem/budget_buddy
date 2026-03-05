/**
 * Error Handler Middleware
 * Centralized error handling for all routes
 * Must be registered as the last middleware
 */

import logger from '../utils/logger.js';
import HTTP_STATUS from '../constants/httpStatusCodes.js';
import ERROR_MESSAGES from '../constants/errorMessages.js';

/**
 * Global error handler middleware
 * Catches all errors and sends formatted response
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

  // Log error
  logger.error('Request Error', {
    statusCode,
    message,
    path: req.path,
    method: req.method,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_ERROR,
      errors: messages,
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `${field} already exists`,
      statusCode: HTTP_STATUS.CONFLICT,
    });
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Invalid ID format',
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  // Send error response
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Middleware: Handle 404 Not Found
 */
export const notFoundHandler = (req, res) => {
  logger.warn('Route not found', { path: req.path, method: req.method });

  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'Route not found',
    statusCode: HTTP_STATUS.NOT_FOUND,
    path: req.path,
  });
};

export default errorHandler;