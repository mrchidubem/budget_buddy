/**
 * Sidebar
 * Desktop-only primary navigation.
 */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

const LINKS = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/goals', label: 'Goals' },
  { to: '/recurring', label: 'Recurring' },
  { to: '/reports', label: 'Reports' },
];

const linkClass = ({ isActive }) =>
  `block px-3 py-2 text-sm font-semibold rounded-[7px] transition-colors ${
    isActive
      ? 'bg-[#9cff6d] text-[#071b16]'
      : 'text-[#9aa8a1] hover:bg-white/8 hover:text-white'
  }`;

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-[var(--bb-sidebar)] lg:shrink-0 lg:border-r lg:border-white/10 lg:bg-[#101513] lg:min-h-screen">
      <div className="px-5 py-6">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9cff6d] rounded-[7px]"
        >
          <span className="w-8 h-8 rounded-[8px] bg-[#9cff6d] flex items-center justify-center shadow-[0_8px_18px_rgba(156,255,109,0.14)]">
            <svg className="w-4 h-4 text-[#071b16]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 8v4m-8 0h16" />
            </svg>
          </span>
          <span className="text-sm font-semibold text-white">Budget Buddy</span>
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Main">
        {LINKS.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4">
        <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
        <p className="text-[11px] text-[#9aa8a1] truncate">{user?.email}</p>
        <button type="button" onClick={handleLogout} className="mt-3 text-xs font-semibold text-red-300 hover:text-red-200">
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
