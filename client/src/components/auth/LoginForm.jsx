import React from 'react';
/**
 * Login Form Component
 * Handles user login with email and password
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useNotification } from '../../hooks/useNotification.js';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const { addNotification } = useNotification();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.email || !formData.password) {
      setFormError('Please fill in all required fields.');
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      addNotification('Login successful. Welcome back.', 'success');
      navigate('/dashboard');
    } else {
      const message = result.message || 'Login failed';
      setFormError(message);
      addNotification(message, 'error');
    }
  };

  return (
    <section className="w-full max-w-md rounded-2xl bg-white p-8 sm:p-10 animate-slideUp shadow-2xl border border-slate-200">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 via-cyan-400 to-emerald-500 shadow-lg">
            <span className="text-lg font-black text-white">BB</span>
          </div>
          <h1 className="text-sm font-black uppercase tracking-[0.15em] text-slate-900">
            Budget Buddy
          </h1>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600 mb-2">
          Sign In
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
          Welcome Back
        </h2>
        <p className="text-sm text-slate-600 font-medium leading-relaxed">
          Continue to your dashboard and keep your plan on track.
        </p>
      </header>

      {(formError || error) && (
        <div
          className="mb-6 p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg text-sm font-semibold flex items-start gap-3"
          role="alert"
        >
          <span className="text-lg flex-shrink-0">⚠️</span>
          <div>{formError || error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@company.com"
            disabled={loading}
            required
            autoFocus
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition disabled:bg-slate-50 disabled:text-slate-500 text-sm font-medium hover:border-slate-400"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              disabled={loading}
              required
              className="w-full px-4 py-3 pr-16 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition disabled:bg-slate-50 disabled:text-slate-500 text-sm font-medium hover:border-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-3 text-xs font-bold text-slate-500 hover:text-slate-700 transition"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-cyan-600 text-white text-sm font-bold uppercase tracking-wide rounded-lg shadow-md hover:shadow-lg hover:from-sky-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <footer className="mt-7 text-center">
        <p className="text-sm text-slate-600 font-medium">
          Need an account?{' '}
          <Link to="/register" className="text-sky-600 font-bold hover:text-sky-700 transition">
            Create one
          </Link>
        </p>
      </footer>
    </section>
  );
};

export default LoginForm;
