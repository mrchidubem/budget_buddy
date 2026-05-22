/**
 * ReportsPage — filtered analytics view.
 */

import React, { useEffect, useState } from 'react';
import AppShell from '../components/layout/AppShell.jsx';
import BudgetStats from '../components/budget/BudgetStats.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { useBudget } from '../hooks/useBudget.js';

const ReportsPage = () => {
  const { budgets, transactions, loading, error, fetchBudgets, fetchTransactions } = useBudget();
  const [type, setType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const load = async () => {
      const loaded = await fetchBudgets();
      if (loaded.length > 0) await fetchTransactions();
    };
    load();
  }, [fetchBudgets, fetchTransactions]);

  const applyFilters = async () => {
    await fetchTransactions(null, {
      ...(type !== 'all' ? { type } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    });
  };

  return (
    <AppShell mobileTitle="Reports" mobileSubtitle="Insights">
      <div className="space-y-4">
        <h1 className="bb-page-title hidden lg:block">Reports</h1>

        {error && <div className="bb-alert-error">{error}</div>}

        <section className="bb-panel p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="date" className="bb-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" className="bb-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <select className="bb-select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">All types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <div className="flex gap-2">
            <button type="button" className="bb-btn-primary flex-1" onClick={applyFilters}>
              Apply
            </button>
            <button
              type="button"
              className="bb-btn-secondary flex-1"
              onClick={async () => {
                setType('all');
                setStartDate('');
                setEndDate('');
                await fetchTransactions();
              }}
            >
              Reset
            </button>
          </div>
        </section>

        {loading && budgets.length === 0 ? (
          <LoadingSpinner message="Loading…" />
        ) : budgets.length === 0 ? (
          <div className="bb-panel p-8 text-center text-sm text-[#71717a]">No data yet.</div>
        ) : (
          <BudgetStats budgets={budgets} />
        )}
      </div>
    </AppShell>
  );
};

export default ReportsPage;
