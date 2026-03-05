/**
 * Footer Component
 * Shared enterprise-style footer for app pages.
 */

import React from 'react';

const Footer = () => {
  return (
    <footer className="mt-10 border-t border-slate-200/80 bg-white/70 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
        <p className="font-semibold text-slate-600">Budget Buddy Command Center</p>
        <p>
          Live tracking, alerting, and performance insights for disciplined money
          operations.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
