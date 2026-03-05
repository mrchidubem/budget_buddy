import React from 'react';
/**
 * Reports Page
 * High-level overview and insights
 */

import { useEffect, useState } from 'react';
import Header from '../components/common/Header.jsx';
import BudgetStats from '../components/budget/BudgetStats.jsx';
import Summary from '../components/dashboard/Summary.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import Footer from '../components/common/Footer.jsx';
import { useBudget } from '../hooks/useBudget.js';

const ReportsPage = () => {
  const {
    budgets,
    transactions,
    loading,
    error,
    fetchBudgets,
    fetchTransactions,
  } = useBudget();

  const [type, setType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const load = async () => {
      const loadedBudgets = await fetchBudgets();
      if (loadedBudgets.length > 0) {
        await fetchTransactions();
      }
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

  const resetFilters = async () => {
    setType('all');
    setStartDate('');
    setEndDate('');
    await fetchTransactions();
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="bb-page-shell space-y-6">
        <section className="bb-surface-strong rounded-3xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-45 bg-[radial-gradient(circle_at_top_left,_#0c4a6e_0,_transparent_45%),radial-gradient(circle_at_bottom_right,_#0f766e_0,_transparent_45%)]" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Reporting
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">
              Performance Insights
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Analyze budget usage and spending behavior over custom time windows.
            </p>
          </div>
        </section>

        {error && (
          <div className="p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <section className="bb-surface rounded-2xl p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 outline-none text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 outline-none text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 outline-none text-sm bg-white"
              >
                <option value="all">All</option>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={applyFilters}
                className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 transition"
              >
                Apply
              </button>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 transition"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        {loading && budgets.length === 0 ? (
          <LoadingSpinner fullScreen={false} message="Loading reports..." />
        ) : budgets.length === 0 ? (
          <div className="bb-surface rounded-2xl p-10 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">No data yet</h2>
            <p className="text-sm text-slate-600">
              Create budgets and transactions to populate reports.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <BudgetStats budgets={budgets} />
            <div className="bb-surface rounded-2xl p-5">
              <Summary budgets={budgets} transactions={transactions} />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ReportsPage;
