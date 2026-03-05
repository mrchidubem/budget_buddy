/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 * Implements standard Bearer token authorization
 */

import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import HTTP_STATUS from '../constants/httpStatusCodes.js';
import ERROR_MESSAGES from '../constants/errorMessages.js';

const ACCESS_COOKIE = 'bb_access_token';

const getCookieValue = (req, cookieName) => {
  const raw = req.headers.cookie;
  if (!raw) return null;

  const parts = raw.split(';');
  for (const part of parts) {
    const [name, ...rest] = part.trim().split('=');
    if (name === cookieName) {
      return decodeURIComponent(rest.join('='));
    }
  }

  return null;
};

/**
 * Middleware: Verify JWT token and attach user to request
 * Token should be in Authorization header: Bearer <token>
 */
export const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header or secure cookie
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;
    const cookieToken = getCookieValue(req, ACCESS_COOKIE);
    const token = bearerToken || cookieToken;

    if (!token) {
      logger.warn('Missing or invalid Authorization header');
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.TOKEN_REQUIRED,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };
    req.userId = decoded.id;

    logger.debug('Token verified', { userId: req.user.id });

    next();
  } catch (error) {
    logger.warn('Token verification failed', { error: error.message });

    if (error.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Token has expired',
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_TOKEN,
      statusCode: HTTP_STATUS.UNAUTHORIZED,
    });
  }
};

/**
 * Middleware: Optional authentication
 * Attaches user info if token is valid, but doesn't require it
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;
    const cookieToken = getCookieValue(req, ACCESS_COOKIE);
    const token = bearerToken || cookieToken;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = {
        id: decoded.id,
        email: decoded.email,
      };
      req.userId = decoded.id;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

export default authMiddleware;
