/**
 * Authentication Controller
 * Handles user registration, login, and authentication logic
 * All functions are async and use try-catch for error handling
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { validateEmail, validatePassword } from '../utils/validators.js';
import HTTP_STATUS from '../constants/httpStatusCodes.js';
import ERROR_MESSAGES from '../constants/errorMessages.js';
import { trackActivity } from '../utils/activityLogger.js';

/**
 * Auth constants
 */
const ACCESS_COOKIE = 'bb_access_token';
const REFRESH_COOKIE = 'bb_refresh_token';
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRE || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRE || '7d';
const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'NGN',
  'CAD',
  'AUD',
  'INR',
  'JPY',
];

/**
 * Parse cookie value from raw cookie header
 * @param {import('express').Request} req
 * @param {string} cookieName
 * @returns {string|null}
 */
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
 * Hash refresh token for DB storage
 * @param {string} token
 * @returns {string}
 */
const hashRefreshToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Convert JWT duration to cookie maxAge in ms
 * Supports Xm, Xh, Xd and numeric seconds
 * @param {string} duration
 * @returns {number}
 */
const durationToMs = (duration) => {
  if (/^\d+$/.test(duration)) return Number(duration) * 1000;
  const match = /^(\d+)([mhd])$/.exec(duration);
  if (!match) return 15 * 60 * 1000;

  const value = Number(match[1]);
  const unit = match[2];
  if (unit === 'm') return value * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  return value * 24 * 60 * 60 * 1000;
};

/**
 * Set secure auth cookies
 * @param {import('express').Response} res
 * @param {string} accessToken
 * @param {string} refreshToken
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  const secure = process.env.NODE_ENV === 'production';
  const sameSite = secure ? process.env.COOKIE_SAME_SITE || 'none' : 'lax';

  res.cookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: durationToMs(ACCESS_EXPIRES_IN),
    path: '/',
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: durationToMs(REFRESH_EXPIRES_IN),
    path: '/api/auth',
  });
};

/**
 * Clear auth cookies
 * @param {import('express').Response} res
 */
const clearAuthCookies = (res) => {
  const secure = process.env.NODE_ENV === 'production';
  const sameSite = secure ? process.env.COOKIE_SAME_SITE || 'none' : 'lax';
  const cookieBase = { httpOnly: true, sameSite, secure };
  res.clearCookie(ACCESS_COOKIE, { ...cookieBase, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...cookieBase, path: '/api/auth' });
};

/**
 * Generate JWT Access Token
 * @param {string} id - User ID
 * @param {string} email - User email
 * @returns {string} Access token
 */
const generateAccessToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
};

/**
 * Generate JWT Refresh Token
 * @param {string} id
 * @param {string} email
 * @returns {string}
 */
const generateRefreshToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
};

/**
 * Register new user
 * POST /api/auth/register
 * Body: { name, email, password, confirmPassword }
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, preferredCurrency } = req.body;

    // Validate required fields
    if (!name || !email || !password || !confirmPassword) {
      logger.warn('Registration: Missing required fields');
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.MISSING_REQUIRED_FIELD,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      logger.warn('Registration: Invalid email format', { email });
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_EMAIL,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Validate password strength
    if (!validatePassword(password)) {
      logger.warn('Registration: Weak password');
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_PASSWORD,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      logger.warn('Registration: Passwords do not match');
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.PASSWORDS_DONT_MATCH,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      logger.warn('Registration: Email already exists', { email });
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: ERROR_MESSAGES.USER_ALREADY_EXISTS,
        statusCode: HTTP_STATUS.CONFLICT,
      });
    }

    if (
      preferredCurrency &&
      !SUPPORTED_CURRENCIES.includes(preferredCurrency.toUpperCase())
    ) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Unsupported currency',
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      preferredCurrency: preferredCurrency?.toUpperCase() || 'USD',
    });

    const accessToken = generateAccessToken(user._id.toString(), user.email);
    const refreshToken = generateRefreshToken(user._id.toString(), user.email);

    user.refreshTokenHash = hashRefreshToken(refreshToken);
    user.refreshTokenExpiresAt = new Date(Date.now() + durationToMs(REFRESH_EXPIRES_IN));
    await user.save();

    logger.info('User registered successfully', { userId: user._id, email });

    setAuthCookies(res, accessToken, refreshToken);
    await trackActivity({
      userId: user._id,
      actorId: user._id,
      action: 'auth.register',
      entityType: 'session',
      entityId: user._id,
      summary: 'User registered account',
      metadata: {
        email: user.email,
        preferredCurrency: user.preferredCurrency,
      },
      req,
    });

    // Return success response
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'User registered successfully',
      statusCode: HTTP_STATUS.CREATED,
      token: accessToken,
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error('Registration error', error);
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 * Body: { email, password }
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      logger.warn('Login: Missing email or password');
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.MISSING_REQUIRED_FIELD,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Find user and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );

    if (!user) {
      logger.warn('Login: User not found', { email });
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    // Verify password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      logger.warn('Login: Invalid password', { userId: user._id });
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    logger.info('User logged in successfully', { userId: user._id });

    // Generate tokens and store hashed refresh token
    const accessToken = generateAccessToken(user._id.toString(), user.email);
    const refreshToken = generateRefreshToken(user._id.toString(), user.email);
    user.refreshTokenHash = hashRefreshToken(refreshToken);
    user.refreshTokenExpiresAt = new Date(Date.now() + durationToMs(REFRESH_EXPIRES_IN));
    await user.save();
    setAuthCookies(res, accessToken, refreshToken);
    await trackActivity({
      userId: user._id,
      actorId: user._id,
      action: 'auth.login',
      entityType: 'session',
      entityId: user._id,
      summary: 'User logged in',
      metadata: {
        email: user.email,
      },
      req,
    });

    // Return success response
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login successful',
      statusCode: HTTP_STATUS.OK,
      token: accessToken,
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error('Login error', error);
    next(error);
  }
};

/**
 * Get current authenticated user
 * GET /api/auth/me
 * Requires authentication
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    // req.userId is set by authMiddleware
    const user = await User.findById(req.userId);

    if (!user) {
      logger.warn('Get current user: User not found', { userId: req.userId });
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      statusCode: HTTP_STATUS.OK,
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error('Get current user error', error);
    next(error);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshAuthToken = async (req, res, next) => {
  try {
    const refreshToken = getCookieValue(req, REFRESH_COOKIE);
    if (!refreshToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.TOKEN_REQUIRED,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );
    } catch {
      clearAuthCookies(res);
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    const user = await User.findById(decoded.id).select(
      '+refreshTokenHash +refreshTokenExpiresAt'
    );
    if (!user) {
      clearAuthCookies(res);
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    const hashedProvidedToken = hashRefreshToken(refreshToken);
    const refreshExpired =
      !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt.getTime() < Date.now();
    const refreshMismatch =
      !user.refreshTokenHash || user.refreshTokenHash !== hashedProvidedToken;

    if (refreshExpired || refreshMismatch) {
      user.refreshTokenHash = undefined;
      user.refreshTokenExpiresAt = undefined;
      await user.save();
      clearAuthCookies(res);
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    const accessToken = generateAccessToken(user._id.toString(), user.email);
    const nextRefreshToken = generateRefreshToken(user._id.toString(), user.email);
    user.refreshTokenHash = hashRefreshToken(nextRefreshToken);
    user.refreshTokenExpiresAt = new Date(Date.now() + durationToMs(REFRESH_EXPIRES_IN));
    await user.save();
    setAuthCookies(res, accessToken, nextRefreshToken);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Session refreshed',
      statusCode: HTTP_STATUS.OK,
      token: accessToken,
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error('Refresh token error', error);
    next(error);
  }
};

/**
 * Update authenticated user preferences
 * PUT /api/auth/preferences
 */
export const updateUserPreferences = async (req, res, next) => {
  try {
    const { preferredCurrency, alertPreferences } = req.body || {};

    if (preferredCurrency === undefined && alertPreferences === undefined) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No preference fields were provided',
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    }

    const changedValues = {};

    if (preferredCurrency !== undefined) {
      if (typeof preferredCurrency !== 'string') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'preferredCurrency must be a string',
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const normalizedCurrency = preferredCurrency.toUpperCase();
      if (!SUPPORTED_CURRENCIES.includes(normalizedCurrency)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Unsupported currency',
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }

      user.preferredCurrency = normalizedCurrency;
      changedValues.preferredCurrency = normalizedCurrency;
    }

    if (alertPreferences !== undefined) {
      if (
        !alertPreferences ||
        typeof alertPreferences !== 'object' ||
        Array.isArray(alertPreferences)
      ) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'alertPreferences must be an object',
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const nextAlertPreferences = {
        emailEnabled:
          alertPreferences.emailEnabled !== undefined
            ? Boolean(alertPreferences.emailEnabled)
            : Boolean(user.alertPreferences?.emailEnabled),
        dailyThresholdPercent:
          alertPreferences.dailyThresholdPercent !== undefined
            ? Number(alertPreferences.dailyThresholdPercent)
            : Number(user.alertPreferences?.dailyThresholdPercent ?? 85),
        budgetThresholdPercent:
          alertPreferences.budgetThresholdPercent !== undefined
            ? Number(alertPreferences.budgetThresholdPercent)
            : Number(user.alertPreferences?.budgetThresholdPercent ?? 80),
      };

      if (
        !Number.isFinite(nextAlertPreferences.dailyThresholdPercent) ||
        nextAlertPreferences.dailyThresholdPercent < 50 ||
        nextAlertPreferences.dailyThresholdPercent > 100
      ) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'dailyThresholdPercent must be between 50 and 100',
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }

      if (
        !Number.isFinite(nextAlertPreferences.budgetThresholdPercent) ||
        nextAlertPreferences.budgetThresholdPercent < 50 ||
        nextAlertPreferences.budgetThresholdPercent > 100
      ) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'budgetThresholdPercent must be between 50 and 100',
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
      }

      user.alertPreferences = nextAlertPreferences;
      changedValues.alertPreferences = nextAlertPreferences;
    }

    await user.save();
    await trackActivity({
      userId: user._id,
      actorId: user._id,
      action: 'user.preferences.update',
      entityType: 'user',
      entityId: user._id,
      summary: 'Updated user preferences',
      metadata: changedValues,
      req,
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Preferences updated',
      statusCode: HTTP_STATUS.OK,
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error('Update user preferences error', error);
    next(error);
  }
};

/**
 * Logout user (client-side token removal)
 * POST /api/auth/logout
 * Requires authentication
 */
export const logoutUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select(
      '+refreshTokenHash +refreshTokenExpiresAt'
    );
    if (user) {
      user.refreshTokenHash = undefined;
      user.refreshTokenExpiresAt = undefined;
      await user.save();
      await trackActivity({
        userId: user._id,
        actorId: user._id,
        action: 'auth.logout',
        entityType: 'session',
        entityId: user._id,
        summary: 'User logged out',
        req,
      });
    }
    clearAuthCookies(res);

    logger.info('User logged out', { userId: req.userId || 'unknown' });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Logged out successfully',
      statusCode: HTTP_STATUS.OK,
    });
  } catch (error) {
    logger.error('Logout error', error);
    next(error);
  }
};

export default {
  registerUser,
  loginUser,
  getCurrentUser,
  refreshAuthToken,
  updateUserPreferences,
  logoutUser,
};
