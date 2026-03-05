/**
 * useCurrency Hook
 * Provides global preferred currency and formatting helper
 */

import { useCallback } from 'react';
import { useAuth } from './useAuth.js';
import { formatCurrency } from '../utils/helpers.js';

export const useCurrency = () => {
  const { preferredCurrency } = useAuth();
  const currency = preferredCurrency || 'USD';

  const formatAmount = useCallback(
    (amount) => formatCurrency(amount, currency),
    [currency]
  );

  return {
    currency,
    formatAmount,
  };
};

export default useCurrency;
