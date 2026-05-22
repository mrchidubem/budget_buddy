import React from 'react';
/**
 * Loading Spinner Component
 * Displays a centered loading spinner
 */

const LoadingSpinner = ({ fullScreen = false, message = 'Loading...' }) => {
  const wrapperClass = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-[#080c0a]/80 backdrop-blur-md z-50'
    : 'flex items-center justify-center py-16';

  return (
    <div className={wrapperClass}>
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-3 border-white/10 border-t-[#9cff6d] border-r-[#d7f86f] animate-spin" />
          {/* Inner pulsing circle */}
          <div className="absolute inset-2 rounded-full bg-[#9cff6d]/10 animate-pulse" />
          {/* Center dot */}
          <div className="absolute inset-4 rounded-full bg-[#9cff6d]" />
        </div>
        <p className="text-[#9aa8a1] text-sm font-bold uppercase tracking-wider">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
