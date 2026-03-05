import React from 'react';
/**
 * Notification Toast Component
 * Individual toast notification display
 */

import { useNotification } from '../../hooks/useNotification.js';

const NotificationToast = ({ notification }) => {
  const { removeNotification } = useNotification();

  const getIcon = (type) => {
    const icons = {
      success: '✓',
      error: '⚠',
      warning: '⚡',
      info: 'ⓘ',
    };
    return icons[type] || 'ⓘ';
  };

  const getStyles = (type) => {
    const styles = {
      success: {
        bg: 'bg-success-50',
        border: 'border-success-200',
        text: 'text-success-900',
        icon: 'bg-success-100 text-success-700',
        accent: 'from-success-500 to-emerald-500',
      },
      error: {
        bg: 'bg-danger-50',
        border: 'border-danger-200',
        text: 'text-danger-900',
        icon: 'bg-danger-100 text-danger-700',
        accent: 'from-danger-500 to-red-500',
      },
      warning: {
        bg: 'bg-warning-50',
        border: 'border-warning-200',
        text: 'text-warning-900',
        icon: 'bg-warning-100 text-warning-700',
        accent: 'from-warning-500 to-amber-500',
      },
      info: {
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        text: 'text-sky-900',
        icon: 'bg-sky-100 text-sky-700',
        accent: 'from-sky-500 to-cyan-500',
      },
    };
    return styles[type] || styles.info;
  };

  const styles = getStyles(notification.type);

  return (
    <div
      className={`${styles.bg} ${styles.border} ${styles.text} border rounded-xl p-4 shadow-lg flex items-start gap-4 animate-slideUp pointer-events-auto max-w-sm overflow-hidden relative`}
    >
      <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${styles.accent}`} />
      <span
        className={`${styles.icon} text-lg font-black flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center`}
      >
        {getIcon(notification.type)}
      </span>
      <div className="flex-1 pt-0.5">
        <p className="text-sm font-bold leading-snug">{notification.message}</p>
      </div>
      <button
        onClick={() => removeNotification(notification.id)}
        className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 flex-shrink-0 font-bold text-lg leading-none p-1 rounded-md transition-colors duration-200"
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
};

export default NotificationToast;
