/**
 * RegisterPage
 * Public route for new account provisioning.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import RegisterForm from '../components/auth/RegisterForm.jsx';
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
    <AuthLayout
      eyebrow="Account opening"
      title="Set up your financial workspace in minutes"
      description="Define category budgets, log transactions, and measure progress toward goals with the same rigor you would expect from a corporate treasury tool."
      bullets={[
        'Multi-currency display preferences',
        'Automated budget utilization from transactions',
        'Goals and recurring payment templates',
      ]}
    >
      <RegisterForm />
    </AuthLayout>
  );
};

export default RegisterPage;
