/**
 * useBudget Hook
 * Custom hook to access budget context
 */

import { useContext } from 'react';
import { BudgetContext } from '../context/BudgetContext.jsx';

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within BudgetProvider');
  }
  return context;
};

export default useBudget;