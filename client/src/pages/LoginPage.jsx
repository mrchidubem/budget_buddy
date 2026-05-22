/**
 * LoginPage
 * Public route: redirects authenticated users; renders sign-in flow.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import LoginForm from '../components/auth/LoginForm.jsx';
import { useAuth } from '../hooks/useAuth.js';

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <AuthLayout
      eyebrow="Secure access"
      title="Institutional-grade control of your personal finances"
      description="Monitor budgets, cash flow, and savings targets from one workspace built for clarity and compliance-minded habits."
      bullets={[
        'Real-time spend tracking against category limits',
        'Exportable transaction history and reporting',
        'Configurable alerts before limits are exceeded',
      ]}
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;
