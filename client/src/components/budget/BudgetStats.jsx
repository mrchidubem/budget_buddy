import React from 'react';
/**
 * Budget Stats Component
 * Displays summary statistics for all budgets
 */

import { calculatePercentage } from '../../utils/helpers.js';
import { useCurrency } from '../../hooks/useCurrency.js';

const StatCard = ({ label, value, note, tone = 'slate' }) => {
  const toneMap = {
    slate: 'from-slate-50 to-white border-slate-200 text-slate-900',
    teal: 'from-teal-50 to-white border-teal-200 text-teal-900',
    amber: 'from-amber-50 to-white border-amber-200 text-amber-900',
    rose: 'from-rose-50 to-white border-rose-200 text-rose-900',
  };

  return (
    <article
      className={`rounded-2xl border bg-gradient-to-b p-5 shadow-sm ${toneMap[tone] || toneMap.slate}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </article>
  );
};

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
      <StatCard
        label="Budget Pool"
        value={formatAmount(totalLimit)}
        note="Across all categories"
        tone="teal"
      />

      <StatCard
        label="Spent"
        value={formatAmount(totalSpent)}
        note={`${percentageSpent}% of your total budget`}
        tone="amber"
      />

      <StatCard
        label="Remaining"
        value={formatAmount(Math.max(0, totalRemaining))}
        note={totalRemaining < 0 ? 'Overall budget exceeded' : 'Still available'}
        tone={totalRemaining < 0 ? 'rose' : 'slate'}
      />

      <StatCard
        label="Over-Limit"
        value={String(overBudgetCount)}
        note={
          overBudgetCount > 0
            ? 'Categories currently over limit'
            : 'All categories on track'
        }
        tone={overBudgetCount > 0 ? 'rose' : 'slate'}
      />
    </section>
  );
};

export default BudgetStats;
