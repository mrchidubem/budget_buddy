/**
 * LoginForm
 * Credential capture and submission for existing users.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useNotification } from '../../hooks/useNotification.js';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const { addNotification } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!email.trim() || !password) {
      setFormError('Enter your email and password.');
      return;
    }

    const result = await login(email.trim(), password);
    if (result.success) {
      addNotification('Signed in successfully.', 'success');
      navigate('/dashboard');
      return;
    }

    const message = result.message || 'Sign in failed.';
    setFormError(message);
    addNotification(message, 'error');
  };

  return (
    <section className="bb-auth-card">
      <header className="mb-8">
        <h2 className="text-xl font-semibold text-brand-900">Sign in</h2>
        <p className="mt-1 text-sm text-[#6b7c8f]">Access your budgets and transaction history.</p>
      </header>

      {(formError || error) && (
        <div className="bb-alert-error mb-6" role="alert">
          {formError || error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
        <div>
          <label htmlFor="email" className="bb-label">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="bb-input"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFormError('');
            }}
            placeholder="name@company.com"
            disabled={loading}
            required
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="password" className="bb-label">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="bb-input pr-16"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFormError('');
              }}
              placeholder="Your password"
              disabled={loading}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#6b7c8f] hover:text-brand-900"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="bb-btn-primary w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[#6b7c8f]">
        New here?{' '}
        <Link to="/register" className="font-semibold text-accent-700 hover:text-accent-800">
          Create an account
        </Link>
      </p>
    </section>
  );
};

export default LoginForm;
