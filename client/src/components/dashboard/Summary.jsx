import React from 'react';
/**
 * Dashboard Summary Component
 * Displays overview and quick stats
 */

import { calculatePercentage } from '../../utils/helpers.js';
import { useCurrency } from '../../hooks/useCurrency.js';

const Summary = ({ budgets, transactions }) => {
  const { formatAmount } = useCurrency();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalLimit = budgets.reduce((sum, b) => sum + (Number(b.limit) || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (Number(b.spent) || 0), 0);
  const percentageSpent = calculatePercentage(totalSpent, totalLimit);

  const topBudget =
    budgets.length > 0 ? [...budgets].sort((a, b) => b.spent - a.spent)[0] : null;

  const latestTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const monthExpenses = transactions.filter((transaction) => {
    if (transaction.type !== 'expense') return false;
    const date = new Date(transaction.date);
    return !Number.isNaN(date.getTime()) && date >= startOfMonth && date <= now;
  });

  const averageExpenseAmount =
    monthExpenses.length > 0
      ? monthExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) /
        monthExpenses.length
      : 0;

  const largestExpense = [...monthExpenses].sort(
    (a, b) => Number(b.amount) - Number(a.amount)
  )[0];

  const alertBudgets = budgets.filter((b) => {
    const spentPct = calculatePercentage(Number(b.spent) || 0, Number(b.limit) || 0);
    return spentPct >= (b.alertThreshold || 80);
  });

  const atRiskBudgets = [...budgets]
    .map((budget) => {
      const spentPct = calculatePercentage(
        Number(budget.spent) || 0,
        Number(budget.limit) || 0
      );
      return { ...budget, spentPct };
    })
    .filter((budget) => budget.spentPct >= 60)
    .sort((a, b) => b.spentPct - a.spentPct)
    .slice(0, 3);

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <article className="bb-surface rounded-2xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Monthly Limit
          </p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {formatAmount(totalLimit)}
          </p>
        </article>

        <article className="bb-surface rounded-2xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Spent
          </p>
          <p className="mt-2 text-2xl font-extrabold text-amber-700">
            {formatAmount(totalSpent)}
          </p>
          <p className="mt-1 text-xs text-slate-500">{percentageSpent}% of budget</p>
        </article>

        <article className="bb-surface rounded-2xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Remaining
          </p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-700">
            {formatAmount(Math.max(0, totalLimit - totalSpent))}
          </p>
        </article>

        <article className="rounded-2xl p-5 bg-slate-900 text-slate-50 shadow-lg">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Top Spend Category
          </p>
          {topBudget ? (
            <>
              <p className="mt-2 text-lg font-bold">{topBudget.category}</p>
              <p className="mt-1 text-xs text-slate-300">
                {formatAmount(topBudget.spent)} spent (
                {calculatePercentage(topBudget.spent, totalSpent)}% of total)
              </p>
            </>
          ) : (
            <p className="mt-2 text-xs text-slate-300">
              Add budgets and transactions to unlock this insight.
            </p>
          )}
        </article>
      </div>

      {alertBudgets.length > 0 && (
        <article className="rounded-2xl border border-danger-200 bg-danger-50 p-4">
          <h3 className="text-sm font-bold text-danger-800 mb-2">
            Budget Alerts ({alertBudgets.length})
          </h3>
          <div className="space-y-1.5">
            {alertBudgets.map((budget) => {
              const spentPct = calculatePercentage(
                Number(budget.spent) || 0,
                Number(budget.limit) || 0
              );

              return (
                <div key={budget._id} className="text-sm text-danger-700">
                  <span className="font-semibold">{budget.category}</span> - {spentPct}
                  % used
                </div>
              );
            })}
          </div>
        </article>
      )}

      <article className="bb-surface rounded-2xl p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Smart Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Average Expense (This Month)
            </p>
            <p className="mt-1 text-lg font-extrabold text-slate-900">
              {formatAmount(averageExpenseAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Largest Expense (This Month)
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {largestExpense
                ? `${largestExpense.description || 'Expense'} - ${formatAmount(
                    largestExpense.amount
                  )}`
                : 'No expenses recorded'}
            </p>
          </div>
        </div>

        {atRiskBudgets.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Highest Risk Categories
            </p>
            {atRiskBudgets.map((budget) => (
              <p key={budget._id} className="text-sm text-slate-700">
                <span className="font-semibold text-slate-900">{budget.category}</span>{' '}
                at {budget.spentPct}% used
              </p>
            ))}
          </div>
        )}
      </article>

      {latestTransactions.length > 0 && (
        <article className="bb-surface rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">
            Recent Transactions
          </h3>
          <div className="space-y-3">
            {latestTransactions.map((transaction) => (
              <div
                key={transaction._id}
                className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {transaction.budgetId?.category || 'Unassigned'}
                  </p>
                </div>
                <p
                  className={`text-sm font-bold ${
                    transaction.type === 'income'
                      ? 'text-emerald-700'
                      : 'text-slate-900'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatAmount(transaction.amount)}
                </p>
              </div>
            ))}
          </div>
        </article>
      )}
    </section>
  );
};

export default Summary;
