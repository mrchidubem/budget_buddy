/**
 * BottomNav
 * Mobile-only tab bar with sharp active indicator.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/dashboard', label: 'Home' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/goals', label: 'Goals' },
  { to: '/recurring', label: 'Auto' },
  { to: '/reports', label: 'Reports' },
];

const BottomNav = () => (
  <nav
    className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#101513]/95 backdrop-blur border-t border-white/10 pb-[env(safe-area-inset-bottom)]"
    aria-label="Mobile"
  >
    <div className="grid grid-cols-5 h-14">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center text-[11px] font-medium ${
              isActive ? 'text-[#9cff6d]' : 'text-[#9aa8a1]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 left-3 right-3 h-0.5 bg-[#9cff6d] rounded-full" />
              )}
              {tab.label}
            </>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
);

export default BottomNav;
