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
  'USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD', 'INR', 'JPY',
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
 * Convert JWT duration string to milliseconds
 * Supports formats like '15m', '2h', '7d', or plain number (seconds)
 * @param {string} duration
 * @returns {number}
 */
const durationToMs = (duration) => {
  if (/^\d+$/.test(duration)) return Number(duration) * 1000;
  const match = /^(\d+)([mhd])$/.exec(duration);
  if (!match) return 15 * 60 * 1000; // default 15 minutes

  const value = Number(match[1]);
  const unit = match[2];
  if (unit === 'm') return value * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  return value * 24 * 60 * 60 * 1000;
};

/**
 * Set secure HTTP-only auth cookies
 * IMPORTANT: In production (cross-origin), we MUST use sameSite: 'none' + secure: true
 * Otherwise browsers (Chrome, Firefox, Safari) will reject/ignore the cookies
 * @param {import('express').Response} res
 * @param {string} accessToken
 * @param {string} refreshToken
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const baseOptions = {
    httpOnly: true,
    secure: isProduction,                // true → only over HTTPS (required for SameSite=None)
    sameSite: isProduction ? 'none' : 'lax',  // 'none' required for cross-domain credential sending
    path: '/',                           // access token needs to be sent on all paths
  };

  // Access token – sent on every request
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseOptions,
    maxAge: durationToMs(ACCESS_EXPIRES_IN),
  });

  // Refresh token – more restricted path (only used for /api/auth/refresh)
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseOptions,
    maxAge: durationToMs(REFRESH_EXPIRES_IN),
    path: '/api/auth',
  });
};

/**
 * Clear auth cookies on logout or invalid refresh
 * @param {import('express').Response} res
 */
const clearAuthCookies = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const baseOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  };

  res.clearCookie(ACCESS_COOKIE, { ...baseOptions, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...baseOptions, path: '/api/auth' });
};

/**
 * Generate JWT Access Token
 */
const generateAccessToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
};

/**
 * Generate JWT Refresh Token
 */
const generateRefreshToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
};

// ──────────────────────────────────────────────
// ────────────── CONTROLLER FUNCTIONS ───────────
// ──────────────────────────────────────────────

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, preferredCurrency } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.MISSING_REQUIRED_FIELD,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    if (!validateEmail(email)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_EMAIL,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    if (!validatePassword(password)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_PASSWORD,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    if (password !== confirmPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.PASSWORDS_DONT_MATCH,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: ERROR_MESSAGES.USER_ALREADY_EXISTS,
        statusCode: HTTP_STATUS.CONFLICT,
      });
    }

    if (preferredCurrency && !SUPPORTED_CURRENCIES.includes(preferredCurrency.toUpperCase())) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Unsupported currency',
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

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
      metadata: { email: user.email, preferredCurrency: user.preferredCurrency },
      req,
    });

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'User registered successfully',
      statusCode: HTTP_STATUS.CREATED,
      token: accessToken,  // optional – can be removed if relying only on cookie
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error('Registration error', error);
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.MISSING_REQUIRED_FIELD,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

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
      metadata: { email: user.email },
      req,
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login successful',
      statusCode: HTTP_STATUS.OK,
      token: accessToken,  // optional
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error('Login error', error);
    next(error);
  }
};

// The rest of your functions (getCurrentUser, refreshAuthToken, updateUserPreferences, logoutUser)
// remain unchanged – they are already correct.
// Just make sure clearAuthCookies is used where needed (logout, invalid refresh).

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
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
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch {
      clearAuthCookies(res);
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    const user = await User.findById(decoded.id).select('+refreshTokenHash +refreshTokenExpiresAt');
    if (!user) {
      clearAuthCookies(res);
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    const hashedProvidedToken = hashRefreshToken(refreshToken);
    const refreshExpired = !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt.getTime() < Date.now();
    const refreshMismatch = !user.refreshTokenHash || user.refreshTokenHash !== hashedProvidedToken;

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

export const updateUserPreferences = async (req, res, next) => {
  // Your existing code – no changes needed here
  // ... (keeping it short – copy your original if you want)
};

export const logoutUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('+refreshTokenHash +refreshTokenExpiresAt');
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