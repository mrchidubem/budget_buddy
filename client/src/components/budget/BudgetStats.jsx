/**
 * BudgetStats
 * Aggregated KPI row for budget list and report views.
 */

import React from 'react';
import { calculatePercentage } from '../../utils/helpers.js';
import { useCurrency } from '../../hooks/useCurrency.js';
import StatMetric from '../ui/StatMetric.jsx';

const BudgetStats = ({ budgets }) => {
  const { formatAmount } = useCurrency();

  const totalLimit = budgets.reduce((sum, b) => sum + (Number(b.limit) || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (Number(b.spent) || 0), 0);
  const totalRemaining = totalLimit - totalSpent;
  const overBudgetCount = budgets.filter(
    (b) => (Number(b.spent) || 0) > (Number(b.limit) || 0)
  ).length;
  const percentageSpent = calculatePercentage(totalSpent, totalLimit);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatMetric label="Total budget" value={formatAmount(totalLimit)} hint="Allocated across categories" />
      <StatMetric
        label="Total spent"
        value={formatAmount(totalSpent)}
        hint={`${percentageSpent}% of allocation`}
        tone="accent"
      />
      <StatMetric
        label="Available"
        value={formatAmount(Math.max(0, totalRemaining))}
        hint={totalRemaining < 0 ? 'Allocation exceeded' : 'Remaining capacity'}
        tone={totalRemaining < 0 ? 'danger' : 'default'}
      />
      <StatMetric
        label="Over limit"
        value={String(overBudgetCount)}
        hint={overBudgetCount ? 'Categories require attention' : 'All within limits'}
        tone={overBudgetCount ? 'warning' : 'default'}
      />
    </section>
  );
};

export default BudgetStats;
