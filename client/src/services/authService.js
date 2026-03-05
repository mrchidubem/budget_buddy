/**
 * Authentication Service
 * Handles API calls related to authentication
 */

import api from './api.js';

/**
 * Register new user
 * @param {string} name - User's full name
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} confirmPassword - Password confirmation
 * @param {string} preferredCurrency - Currency code
 * @returns {Promise} Response with token and user data
 */
export const registerUser = async (
  name,
  email,
  password,
  confirmPassword,
  preferredCurrency = 'USD'
) => {
  try {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      confirmPassword,
      preferredCurrency,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Login user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} Response with token and user data
 */
export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get current authenticated user
 * @returns {Promise} Response with user data
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me', {
      skipAuthRefresh: true,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Refresh access token using secure refresh cookie
 * @returns {Promise} Response with fresh auth context
 */
export const refreshAuthToken = async () => {
  try {
    const response = await api.post('/auth/refresh', null, {
      skipAuthRefresh: true,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update authenticated user preferences
 * @param {object} payload
 * @param {string} payload.preferredCurrency
 * @returns {Promise}
 */
export const updateUserPreferences = async (payload) => {
  try {
    const response = await api.put('/auth/preferences', payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Logout user
 * @returns {Promise} Response
 */
export const logoutUser = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (error) {
    throw error;
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
