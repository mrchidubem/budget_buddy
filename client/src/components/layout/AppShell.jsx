/**
 * AppShell
 * Responsive chrome: sidebar, mobile header, content, and bottom navigation.
 */

import React from 'react';
import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx';

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.mobileTitle]
 * @param {string} [props.mobileSubtitle]
 */
const AppShell = ({ children, mobileTitle = 'Budget Buddy', mobileSubtitle }) => {
  return (
    <div className="bb-app-canvas min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {mobileTitle && (
          <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur shadow-[0_1px_18px_rgba(7,27,22,0.06)] px-4 py-3">
            <h1 className="bb-page-title truncate">{mobileTitle}</h1>
            {mobileSubtitle && <p className="bb-page-sub truncate">{mobileSubtitle}</p>}
          </header>
        )}
        <main className="bb-page-shell bb-page-pad flex-1">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
};

export default AppShell;
