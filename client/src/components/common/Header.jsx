/**
 * Header Component
 * Top navigation bar with logo and user menu
 */

import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useNotification } from '../../hooks/useNotification.js';
import { SUPPORTED_CURRENCIES } from '../../utils/constants.js';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, preferredCurrency, updatePreferredCurrency } = useAuth();
  const { addNotification } = useNotification();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isNavOpen, setIsNavOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCurrencyChange = async (event) => {
    const nextCurrency = event.target.value;
    if (!nextCurrency || nextCurrency === preferredCurrency) return;

    const result = await updatePreferredCurrency(nextCurrency);
    if (result.success) {
      addNotification(`Currency updated to ${nextCurrency}.`, 'success');
      return;
    }

    addNotification(result.message || 'Failed to update currency.', 'error');
  };

  const initials =
    (user?.name || '')
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'BB';

  return (
    <header
      className="bg-white/80 text-slate-900 shadow-sm sticky top-0 z-50 backdrop-blur-md border-b border-slate-100"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/dashboard')}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-cyan-400 to-emerald-500 shadow-md group-hover:shadow-lg group-hover:shadow-sky-500/20 transition-all duration-300">
              <span className="text-sm font-black text-white">BB</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-slate-900 uppercase tracking-[0.15em]">
                Budget Buddy
              </span>
              <span className="text-xs text-slate-500 font-medium">Smart personal finance</span>
            </div>
          </div>

          <nav
            className="hidden md:flex items-center gap-8 text-sm font-semibold"
            aria-label="Main navigation"
          >
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `relative pb-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 ${
                  isActive
                    ? 'text-sky-600'
                    : 'text-slate-600 hover:text-slate-900'
                } after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-gradient-to-r after:from-sky-500 after:to-cyan-400 after:scale-x-0 ${isActive ? 'after:scale-x-100' : ''} hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left`
              }
            >
              Overview
            </NavLink>
            <NavLink
              to="/budgets"
              className={({ isActive }) =>
                `relative pb-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 ${
                  isActive
                    ? 'text-sky-600'
                    : 'text-slate-600 hover:text-slate-900'
                } after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-gradient-to-r after:from-sky-500 after:to-cyan-400 after:scale-x-0 ${isActive ? 'after:scale-x-100' : ''} hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left`
              }
            >
              Budgets
            </NavLink>
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `relative pb-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 ${
                  isActive
                    ? 'text-sky-600'
                    : 'text-slate-600 hover:text-slate-900'
                } after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-gradient-to-r after:from-sky-500 after:to-cyan-400 after:scale-x-0 ${isActive ? 'after:scale-x-100' : ''} hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left`
              }
            >
              Reports
            </NavLink>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <label
                htmlFor="quickCurrencyPreference"
                className="text-xs uppercase tracking-wider text-slate-500 font-bold"
              >
                Currency
              </label>
              <select
                id="quickCurrencyPreference"
                value={preferredCurrency || 'USD'}
                onChange={handleCurrencyChange}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 transition-all duration-200 hover:border-slate-400"
              >
                {SUPPORTED_CURRENCIES.map((currencyOption) => (
                  <option key={currencyOption.code} value={currencyOption.code}>
                    {currencyOption.code}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 md:hidden transition-colors duration-200"
              aria-label="Toggle navigation"
              onClick={() => setIsNavOpen((open) => !open)}
            >
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div className="relative">
              <button
                onClick={() => setIsMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 px-3 py-2 shadow-sm hover:shadow-md hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 transition-all duration-200"
                aria-label="Toggle user menu"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 via-cyan-400 to-emerald-500 text-white text-xs font-extrabold shadow-sm">
                  {initials}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-xs font-bold text-slate-900 max-w-[120px] truncate">
                    {user?.name || 'Guest'}
                  </span>
                  <span className="text-[10px] text-slate-500 max-w-[140px] truncate">
                    {user?.email}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 text-slate-600 transition-transform duration-300 ${
                    isMenuOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white text-slate-900 rounded-xl shadow-lg py-2 z-50 border border-slate-200 animate-slideDown">
                  <div className="px-4 py-3 border-b border-slate-200">
                    <p className="text-sm font-bold truncate">
                      {user?.name || 'Logged in'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    aria-label="Logout"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {isNavOpen && (
          <div className="md:hidden border-t border-slate-100 pb-3 animate-slideDown">
            <nav
              className="flex flex-col gap-1 pt-2 text-sm font-semibold"
              aria-label="Mobile navigation"
            >
              <NavLink
                to="/dashboard"
                onClick={() => setIsNavOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 transition-colors duration-200 ${
                    isActive
                      ? 'bg-sky-100 text-sky-700'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                Overview
              </NavLink>
              <NavLink
                to="/budgets"
                onClick={() => setIsNavOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 transition-colors duration-200 ${
                    isActive
                      ? 'bg-sky-100 text-sky-700'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                Budgets
              </NavLink>
              <NavLink
                to="/reports"
                onClick={() => setIsNavOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 transition-colors duration-200 ${
                    isActive
                      ? 'bg-sky-100 text-sky-700'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                Reports
              </NavLink>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
