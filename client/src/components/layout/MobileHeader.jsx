/**
 * MobileHeader
 * Compact top bar for viewports below lg (desktop uses Sidebar).
 */

import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';

const MobileHeader = ({ title, subtitle }) => {
  const { user } = useAuth();
  const initial = (user?.name || 'U').charAt(0).toUpperCase();

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-[#e4e4e7] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="bb-page-title truncate">{title}</h1>
          {subtitle && <p className="bb-page-sub truncate">{subtitle}</p>}
        </div>
        <div
          className="w-9 h-9 rounded-[6px] bg-[#09090b] text-white text-sm font-semibold flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          {initial}
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
