/**
 * Authentication Context
 * Global auth/session state with cookie-based refresh support
 */

import React, { createContext, useReducer, useCallback, useEffect } from 'react';
import * as authService from '../services/authService.js';
import { STORAGE_KEYS } from '../utils/constants.js';
import { AUTH_EXPIRED_EVENT } from '../services/api.js';

export const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

const ACTIONS = {
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_ERROR: 'REGISTER_ERROR',
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  VERIFY_SESSION_SUCCESS: 'VERIFY_SESSION_SUCCESS',
  VERIFY_SESSION_ERROR: 'VERIFY_SESSION_ERROR',
  UPDATE_PREFERENCES_SUCCESS: 'UPDATE_PREFERENCES_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
};

const authReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.REGISTER_START:
    case ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case ACTIONS.REGISTER_SUCCESS:
    case ACTIONS.LOGIN_SUCCESS:
    case ACTIONS.VERIFY_SESSION_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

    case ACTIONS.UPDATE_PREFERENCES_SUCCESS:
      return {
        ...state,
        user: action.payload,
        error: null,
      };

    case ACTIONS.REGISTER_ERROR:
    case ACTIONS.LOGIN_ERROR:
    case ACTIONS.VERIFY_SESSION_ERROR:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };

    case ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };

    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    default:
      return state;
  }
};

const clearLocalAuthCache = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.SESSION_STARTED_AT);
  } catch {
    // Ignore storage failures
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const verifySession = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });

    try {
      const response = await authService.getCurrentUser();
      dispatch({
        type: ACTIONS.VERIFY_SESSION_SUCCESS,
        payload: response.user,
      });
      return;
    } catch {
      // Fall through and try refresh
    }

    try {
      const refreshed = await authService.refreshAuthToken();
      dispatch({
        type: ACTIONS.VERIFY_SESSION_SUCCESS,
        payload: refreshed.user,
      });
    } catch (error) {
      clearLocalAuthCache();
      dispatch({
        type: ACTIONS.VERIFY_SESSION_ERROR,
        payload: null,
      });
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  useEffect(() => {
    const handleAuthExpired = () => {
      clearLocalAuthCache();
      dispatch({ type: ACTIONS.LOGOUT });
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  const register = useCallback(
    async (name, email, password, confirmPassword, preferredCurrency = 'USD') => {
      try {
        dispatch({ type: ACTIONS.REGISTER_START });

        const response = await authService.registerUser(
          name,
          email,
          password,
          confirmPassword,
          preferredCurrency
        );
        clearLocalAuthCache();

        dispatch({
          type: ACTIONS.REGISTER_SUCCESS,
          payload: response.user,
        });

        return { success: true };
      } catch (error) {
        const message = error.message || 'Registration failed';
        dispatch({ type: ACTIONS.REGISTER_ERROR, payload: message });
        return { success: false, message };
      }
    },
    []
  );

  const login = useCallback(async (email, password) => {
    try {
      dispatch({ type: ACTIONS.LOGIN_START });

      const response = await authService.loginUser(email, password);
      clearLocalAuthCache();

      dispatch({
        type: ACTIONS.LOGIN_SUCCESS,
        payload: response.user,
      });

      return { success: true };
    } catch (error) {
      const message = error.message || 'Login failed';
      dispatch({ type: ACTIONS.LOGIN_ERROR, payload: message });
      return { success: false, message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logoutUser();
    } catch {
      // Ignore server logout errors and clear client state anyway
    } finally {
      clearLocalAuthCache();
      dispatch({ type: ACTIONS.LOGOUT });
    }
  }, []);

  const updatePreferredCurrency = useCallback(async (preferredCurrency) => {
    try {
      const response = await authService.updateUserPreferences({
        preferredCurrency,
      });

      dispatch({
        type: ACTIONS.UPDATE_PREFERENCES_SUCCESS,
        payload: response.user,
      });

      return { success: true, user: response.user };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update currency preference',
      };
    }
  }, []);

  const updateAlertPreferences = useCallback(async (alertPreferences) => {
    try {
      const response = await authService.updateUserPreferences({
        alertPreferences,
      });

      dispatch({
        type: ACTIONS.UPDATE_PREFERENCES_SUCCESS,
        payload: response.user,
      });

      return { success: true, user: response.user };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update alert preferences',
      };
    }
  }, []);

  const value = {
    ...state,
    preferredCurrency: state.user?.preferredCurrency || 'USD',
    alertPreferences: state.user?.alertPreferences || {
      emailEnabled: false,
      dailyThresholdPercent: 85,
      budgetThresholdPercent: 80,
    },
    register,
    login,
    logout,
    verifySession,
    updatePreferredCurrency,
    updateAlertPreferences,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
