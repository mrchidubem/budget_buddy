import React from 'react';
/**
 * Register Form Component
 * Handles user registration
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useNotification } from '../../hooks/useNotification.js';
import { SUPPORTED_CURRENCIES } from '../../utils/constants.js';

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();
  const { addNotification } = useNotification();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    preferredCurrency: 'USD',
  });

  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError('');
  };

  const validatePasswordStrength = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return 'Password must include one uppercase letter and one number.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    const strengthError = validatePasswordStrength(formData.password);
    if (strengthError) {
      setFormError(strengthError);
      return;
    }

    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.confirmPassword,
      formData.preferredCurrency
    );

    if (result.success) {
      addNotification('Registration successful. Welcome aboard.', 'success');
      navigate('/dashboard');
    } else {
      const message = result.message || 'Registration failed';
      setFormError(message);
      addNotification(message, 'error');
    }
  };

  return (
    <section className="w-full max-w-md rounded-3xl bb-surface-strong p-7 sm:p-8 animate-fadeIn">
      <header className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Create Account
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">
          Start Tracking
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Set up your workspace and build a clear monthly plan.
        </p>
      </header>

      {(formError || error) && (
        <div
          className="mb-5 p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-xl text-sm font-medium"
          role="alert"
        >
          {formError || error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
        <div>
          <label
            htmlFor="name"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2"
          >
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Alex Morgan"
            disabled={loading}
            required
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 outline-none transition disabled:bg-slate-100 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2"
          >
            Email
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
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 outline-none transition disabled:bg-slate-100 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2"
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
              placeholder="Create a strong password"
              disabled={loading}
              required
              className="w-full px-4 py-2.5 pr-16 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 outline-none transition disabled:bg-slate-100 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-3 text-xs font-semibold text-slate-600 hover:text-slate-900"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {formData.password && (
            <p className="mt-1 text-xs text-slate-500">
              {validatePasswordStrength(formData.password) || 'Password strength looks good.'}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="preferredCurrency"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2"
          >
            Preferred Currency
          </label>
          <select
            id="preferredCurrency"
            name="preferredCurrency"
            value={formData.preferredCurrency}
            onChange={handleChange}
            disabled={loading}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 outline-none transition disabled:bg-slate-100 text-sm bg-white"
          >
            {SUPPORTED_CURRENCIES.map((currencyOption) => (
              <option key={currencyOption.code} value={currencyOption.code}>
                {currencyOption.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              disabled={loading}
              required
              className="w-full px-4 py-2.5 pr-16 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 outline-none transition disabled:bg-slate-100 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute inset-y-0 right-3 text-xs font-semibold text-slate-600 hover:text-slate-900"
              aria-label={
                showConfirmPassword ? 'Hide password' : 'Show password'
              }
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-slate-900 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <footer className="mt-6 text-center">
        <p className="text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="text-slate-900 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </footer>
    </section>
  );
};

export default RegisterForm;
