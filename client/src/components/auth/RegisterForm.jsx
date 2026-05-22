/**
 * RegisterForm
 * Collects profile and credential data for new user onboarding.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  /** Client-side hint aligned with API password policy */
  const validatePasswordStrength = (password) => {
    if (password.length < 8) return 'Minimum 8 characters required.';
    if (!/[A-Z]/.test(password)) return 'Include an uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Include a lowercase letter.';
    if (!/[0-9]/.test(password)) return 'Include a number.';
    if (!/[@$!%*?&]/.test(password)) return 'Include a special character (@$!%*?&).';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const { name, email, password, confirmPassword, preferredCurrency } = formData;
    if (!name || !email || !password || !confirmPassword) {
      setFormError('Complete all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    const strengthError = validatePasswordStrength(password);
    if (strengthError) {
      setFormError(strengthError);
      return;
    }

    const result = await register(name, email, password, confirmPassword, preferredCurrency);
    if (result.success) {
      addNotification('Account created successfully.', 'success');
      navigate('/dashboard');
      return;
    }

    const message = result.message || 'Registration failed.';
    setFormError(message);
    addNotification(message, 'error');
  };

  const strengthHint = formData.password ? validatePasswordStrength(formData.password) : '';

  return (
    <section className="bb-auth-card">
      <header className="mb-8">
        <h2 className="text-xl font-semibold text-brand-900">Create account</h2>
        <p className="mt-1 text-sm text-[#6b7c8f]">Configure your workspace and default currency.</p>
      </header>

      {(formError || error) && (
        <div className="bb-alert-error mb-6" role="alert">
          {formError || error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
        <div>
          <label htmlFor="name" className="bb-label">Full name</label>
          <input id="name" name="name" type="text" className="bb-input" value={formData.name} onChange={handleChange} required disabled={loading} />
        </div>

        <div>
          <label htmlFor="email" className="bb-label">Email address</label>
          <input id="email" name="email" type="email" className="bb-input" value={formData.email} onChange={handleChange} required disabled={loading} />
        </div>

        <div>
          <label htmlFor="password" className="bb-label">Password</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="bb-input pr-16"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#6b7c8f]" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {formData.password && (
            <p className={`mt-1.5 text-xs ${strengthHint ? 'text-amber-700' : 'text-accent-700'}`}>
              {strengthHint || 'Password meets requirements.'}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="bb-label">Confirm password</label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              className="bb-input pr-16"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#6b7c8f]" onClick={() => setShowConfirmPassword((v) => !v)}>
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="preferredCurrency" className="bb-label">Display currency</label>
          <select id="preferredCurrency" name="preferredCurrency" className="bb-select" value={formData.preferredCurrency} onChange={handleChange} disabled={loading}>
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading} className="bb-btn-primary w-full mt-2">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[#6b7c8f]">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-accent-700 hover:text-accent-800">
          Sign in
        </Link>
      </p>
    </section>
  );
};

export default RegisterForm;
