/**
 * Header
 * Primary application chrome: brand, desktop navigation, currency selector, account menu.
 */

import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useNotification } from '../../hooks/useNotification.js';
import { SUPPORTED_CURRENCIES } from '../../utils/constants.js';

const NAV = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/goals', label: 'Goals' },
  { to: '/recurring', label: 'Recurring' },
  { to: '/reports', label: 'Reports' },
];

const navClass = ({ isActive }) =>
  isActive ? 'bb-nav-link bb-nav-link-active' : 'bb-nav-link';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, preferredCurrency, updatePreferredCurrency } = useAuth();
  const { addNotification } = useNotification();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCurrencyChange = async (event) => {
    const next = event.target.value;
    if (!next || next === preferredCurrency) return;
    const result = await updatePreferredCurrency(next);
    if (result.success) {
      addNotification(`Display currency set to ${next}.`, 'success');
    } else {
      addNotification(result.message || 'Could not update currency.', 'error');
    }
  };

  const initials = (user?.name || 'U')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-[0_1px_18px_rgba(7,27,22,0.06)]" role="banner">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[60px]">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a86b] rounded-[8px]"
          >
            <span className="w-9 h-9 rounded-[8px] bg-[#071b16] flex items-center justify-center shadow-[0_8px_18px_rgba(7,27,22,0.16)]">
              <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4m8 0c0-2.21-1.79-4-4-4m0 8v4m-6 0h12" />
              </svg>
            </span>
            <span className="hidden sm:block text-left">
              <span className="block text-sm font-semibold text-[#10201b] leading-tight">Budget Buddy</span>
              <span className="block text-[11px] text-[#64716d] font-normal">Personal finance</span>
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-6" aria-label="Main">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <label className="hidden md:flex items-center gap-2 text-xs text-[#64716d]">
              <span className="font-medium">Currency</span>
              <select
                value={preferredCurrency || 'USD'}
                onChange={handleCurrencyChange}
                className="h-9 pl-2 pr-7 text-sm font-medium text-[#10201b] border border-[#e3e9e5] rounded-[7px] bg-white focus:border-[#00a86b] focus:ring-2 focus:ring-[#00a86b]/15 outline-none"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </label>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 h-10 pl-1.5 pr-2.5 rounded-[8px] border border-[#e3e9e5] hover:bg-[#f8faf6] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a86b]"
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <span className="w-8 h-8 rounded-[7px] bg-[#071b16] text-white text-xs font-semibold flex items-center justify-center">
                  {initials}
                </span>
                <span className="hidden sm:block text-left max-w-[100px]">
                  <span className="block text-xs font-semibold text-[#10201b] truncate">{user?.name}</span>
                </span>
              </button>

              {menuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Close menu"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bb-card-flat py-1 z-50 shadow-elevated animate-slideDown">
                    <div className="px-4 py-3">
                      <p className="text-sm font-semibold text-[#10201b] truncate">{user?.name}</p>
                      <p className="text-xs text-[#64716d] truncate">{user?.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
