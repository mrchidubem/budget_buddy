import React from 'react';
/**
 * Loading Spinner Component
 * Displays a centered loading spinner
 */

const LoadingSpinner = ({ fullScreen = false, message = 'Loading...' }) => {
  const wrapperClass = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white/60 backdrop-blur-md z-50'
    : 'flex items-center justify-center py-16';

  return (
    <div className={wrapperClass}>
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-3 border-slate-200 border-t-sky-600 border-r-cyan-500 animate-spin" />
          {/* Inner pulsing circle */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-r from-sky-100 to-cyan-100 animate-pulse" />
          {/* Center dot */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-sky-600 to-cyan-600" />
        </div>
        <p className="text-slate-600 text-sm font-bold uppercase tracking-wider">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
