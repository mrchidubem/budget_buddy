/**
 * NotificationToast
 * Transient feedback surfaced from NotificationContext.
 */

import React from 'react';
import { useNotification } from '../../hooks/useNotification.js';

const STYLES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-[#dce3ed] bg-white text-brand-900',
};

const NotificationToast = ({ notification }) => {
  const { removeNotification } = useNotification();
  const tone = STYLES[notification.type] || STYLES.info;

  return (
    <div
      className={`${tone} border rounded-[10px] px-4 py-3 shadow-elevated flex items-start gap-3 max-w-sm animate-slideUp pointer-events-auto`}
      role="status"
    >
      <p className="flex-1 text-sm font-medium leading-snug">{notification.message}</p>
      <button
        type="button"
        onClick={() => removeNotification(notification.id)}
        className="text-[#6b7c8f] hover:text-brand-900 text-lg leading-none p-0.5"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
};

export default NotificationToast;
