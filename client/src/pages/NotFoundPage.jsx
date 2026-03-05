import React from 'react';
/**
 * Not Found Page (404)
 * Displayed when user navigates to non-existent routes
 */

import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 bb-grid-bg">
      <div className="w-full max-w-xl rounded-3xl bb-surface-strong p-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          404
        </p>
        <h1 className="mt-2 text-4xl font-extrabold text-slate-900">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          The page you requested does not exist or may have been moved.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-7 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 transition"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
