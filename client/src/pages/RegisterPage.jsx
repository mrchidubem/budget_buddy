import React from 'react';
/**
 * Register Page
 * Displays registration form for new users
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm.jsx';
import Footer from '../components/common/Footer.jsx';
import { useAuth } from '../hooks/useAuth.js';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bb-grid-bg">
      <div className="px-4 py-10 flex items-center justify-center">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <aside className="hidden lg:flex flex-col justify-between rounded-3xl p-8 bg-gradient-to-br from-slate-900 via-teal-900 to-cyan-900 text-white shadow-2xl">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-300 font-semibold">
                New Account
              </p>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight">
                Start budgeting with structure, not guesswork.
              </h1>
              <p className="mt-4 text-sm text-slate-200 max-w-md">
                Create your workspace once, set your category limits, and track
                every spend with accurate monthly reporting.
              </p>
            </div>

            <ul className="space-y-3 text-sm text-slate-100">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
                Category-level budget controls in minutes.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300" />
                Searchable transaction history and reporting.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-amber-300" />
                Session protection and auto-timeout controls.
              </li>
            </ul>
          </aside>

          <div className="flex items-center justify-center">
            <RegisterForm />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RegisterPage;
