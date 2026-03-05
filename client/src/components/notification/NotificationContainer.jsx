import React from 'react';
/**
 * Notification Container Component
 * Displays toast notifications from the notification context
 */

import { useNotification } from '../../hooks/useNotification.js';
import NotificationToast from './NotificationToast.jsx';

const NotificationContainer = () => {
  const { notifications } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;