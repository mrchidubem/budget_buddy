import React from 'react';
/**
 * Budgets Page
 * Dedicated view for managing all budgets
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header.jsx';
import BudgetStats from '../components/budget/BudgetStats.jsx';
import BudgetList from '../components/budget/BudgetList.jsx';
import BudgetForm from '../components/budget/BudgetForm.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import Footer from '../components/common/Footer.jsx';
import { useBudget } from '../hooks/useBudget.js';
import { useNotification } from '../hooks/useNotification.js';
import { BUDGET_CATEGORIES, STORAGE_KEYS } from '../utils/constants.js';

const BudgetsPage = () => {
  const navigate = useNavigate();
  const {
    budgets,
    loading,
    error,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
  } = useBudget();

  const { addNotification } = useNotification();

  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleCreateBudget = async (data) => {
    const result = await createBudget(data);
    if (result.success) {
      addNotification('Budget created successfully.', 'success');
      setShowBudgetForm(false);
      setEditingBudget(null);
    } else {
      addNotification(result.message || 'Failed to create budget', 'error');
    }
  };

  const handleUpdateBudget = async (data) => {
    const result = await updateBudget(editingBudget._id, data);
    if (result.success) {
      addNotification('Budget updated successfully.', 'success');
      setShowBudgetForm(false);
      setEditingBudget(null);
    } else {
      addNotification(result.message || 'Failed to update budget', 'error');
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!window.confirm('Delete this budget and all related transactions?')) return;
    const result = await deleteBudget(budgetId);
    if (result.success) {
      addNotification('Budget deleted successfully.', 'success');
    } else {
      addNotification(result.message || 'Failed to delete budget', 'error');
    }
  };

  const filteredBudgets = budgets.filter((b) => {
    const matchesCategory =
      categoryFilter === 'all' || b.category === categoryFilter;
    const matchesSearch = b.category
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const existingCategories = budgets.map((b) => b.category);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="bb-page-shell space-y-6">
        <section className="bb-surface-strong rounded-3xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_left,_#0f766e_0,_transparent_45%),radial-gradient(circle_at_bottom_right,_#0c4a6e_0,_transparent_45%)]" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Budget Management
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">
              Category Budgets
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Build clear spending limits per category and keep every month
              intentional.
            </p>
          </div>
        </section>

        {error && (
          <div className="p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <BudgetStats budgets={budgets} />

        <section className="bb-surface rounded-2xl p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                Search Category
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Food, Utilities, Education..."
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 outline-none text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                Filter
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 outline-none text-sm bg-white"
              >
                <option value="all">All categories</option>
                {BUDGET_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.label}>
                    {cat.icon} - {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setEditingBudget(null);
                  setShowBudgetForm(true);
                }}
                className="w-full px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 transition"
              >
                New Budget
              </button>
            </div>
          </div>
        </section>

        {loading && budgets.length === 0 ? (
          <LoadingSpinner fullScreen={false} message="Loading budgets..." />
        ) : (
          <BudgetList
            budgets={filteredBudgets}
            loading={loading}
            onEdit={(budget) => {
              setEditingBudget(budget);
              setShowBudgetForm(true);
            }}
            onDelete={handleDeleteBudget}
            onSelectTransaction={(budget) => {
              try {
                localStorage.setItem(
                  STORAGE_KEYS.PENDING_TX_BUDGET_ID,
                  budget._id
                );
              } catch {
                // ignore storage errors
              }
              navigate('/dashboard');
            }}
          />
        )}
      </main>

      <Footer />

      <BudgetForm
        isOpen={showBudgetForm}
        budget={editingBudget}
        onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget}
        onClose={() => {
          setShowBudgetForm(false);
          setEditingBudget(null);
        }}
        existingCategories={existingCategories}
      />
    </div>
  );
};

export default BudgetsPage;
