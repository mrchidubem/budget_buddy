/**
 * Notification Context
 * Manages toast notifications across the application
 */

import React, { createContext, useReducer, useCallback, useState } from 'react';

// Create context
export const NotificationContext = createContext();

// Initial state
const initialState = {
  notifications: [],
};

// Action types
const ACTIONS = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_ALL: 'CLEAR_ALL',
};

// Reducer function
const notificationReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };

    case ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          (n) => n.id !== action.payload
        ),
      };

    case ACTIONS.CLEAR_ALL:
      return {
        ...state,
        notifications: [],
      };

    default:
      return state;
  }
};

/**
 * Notification Provider Component
 */
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const [browserPermission, setBrowserPermission] = useState(() => {
    if (typeof window === 'undefined') return 'denied';
    if (!('Notification' in window)) return 'unsupported';
    return window.Notification.permission;
  });

  const browserSupported =
    typeof window !== 'undefined' && 'Notification' in window;

  const pushBrowserNotification = useCallback((title, options = {}) => {
    if (!browserSupported) return false;
    if (window.Notification.permission !== 'granted') return false;

    try {
      new window.Notification(title, options);
      return true;
    } catch {
      return false;
    }
  }, [browserSupported]);

  const requestBrowserPermission = useCallback(async () => {
    if (!browserSupported) {
      return { success: false, status: 'unsupported' };
    }

    try {
      const permission = await window.Notification.requestPermission();
      setBrowserPermission(permission);
      return { success: permission === 'granted', status: permission };
    } catch {
      setBrowserPermission(window.Notification.permission || 'denied');
      return { success: false, status: 'denied' };
    }
  }, [browserSupported]);

  // Add notification
  const addNotification = useCallback(
    (message, type = 'info', duration = 3000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          id,
          message,
          type, // 'success', 'error', 'warning', 'info'
        },
      });

      // Auto remove after duration
      if (duration > 0) {
        setTimeout(() => {
          dispatch({
            type: ACTIONS.REMOVE_NOTIFICATION,
            payload: id,
          });
        }, duration);
      }

      const shouldPushToBrowser =
        browserSupported &&
        window.Notification.permission === 'granted' &&
        (type === 'warning' || type === 'error') &&
        document.visibilityState !== 'visible';

      if (shouldPushToBrowser) {
        pushBrowserNotification('Budget Buddy Alert', {
          body: message,
          tag: `bb-alert-${type}`,
        });
      }

      return id;
    },
    [browserSupported, pushBrowserNotification]
  );

  // Remove notification
  const removeNotification = useCallback((id) => {
    dispatch({
      type: ACTIONS.REMOVE_NOTIFICATION,
      payload: id,
    });
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ALL });
  }, []);

  const value = {
    notifications: state.notifications,
    addNotification,
    removeNotification,
    clearAll,
    browserSupported,
    browserPermission,
    requestBrowserPermission,
    pushBrowserNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
