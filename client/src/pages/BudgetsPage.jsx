/**
 * BudgetsPage — dedicated budget management (row list, not card grid).
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import BudgetList from '../components/budget/BudgetList.jsx';
import BudgetForm from '../components/budget/BudgetForm.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { useBudget } from '../hooks/useBudget.js';
import { useNotification } from '../hooks/useNotification.js';
import { BUDGET_CATEGORIES, STORAGE_KEYS } from '../utils/constants.js';

const BudgetsPage = () => {
  const navigate = useNavigate();
  const { budgets, loading, error, fetchBudgets, createBudget, updateBudget, deleteBudget } = useBudget();
  const { addNotification } = useNotification();
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const filteredBudgets = budgets.filter((b) => {
    const matchSearch = b.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'all' || b.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleDeleteBudget = async (budgetId) => {
    if (!window.confirm('Delete this budget and its transactions?')) return;
    const result = await deleteBudget(budgetId);
    if (result.success) addNotification('Budget deleted.', 'success');
    else addNotification(result.message || 'Delete failed', 'error');
  };

  return (
    <AppShell mobileTitle="Budgets" mobileSubtitle="Category limits">
      <div className="space-y-4">
        <div className="hidden lg:flex lg:justify-between lg:items-center">
          <h1 className="bb-page-title">Budgets</h1>
          <button
            type="button"
            className="bb-btn-primary"
            onClick={() => {
              setEditingBudget(null);
              setShowBudgetForm(true);
            }}
          >
            New budget
          </button>
        </div>

        <section className="bb-panel p-4 space-y-3">
          <input
            className="bb-input"
            placeholder="Search category"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select className="bb-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All categories</option>
            {BUDGET_CATEGORIES.map((c) => (
              <option key={c.id} value={c.label}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="bb-btn-primary w-full lg:hidden"
            onClick={() => {
              setEditingBudget(null);
              setShowBudgetForm(true);
            }}
          >
            New budget
          </button>
        </section>

        {error && <div className="bb-alert-error">{error}</div>}

        {loading && budgets.length === 0 ? (
          <LoadingSpinner message="Loading…" />
        ) : (
          <BudgetList
            budgets={filteredBudgets}
            loading={loading}
            onEdit={(b) => {
              setEditingBudget(b);
              setShowBudgetForm(true);
            }}
            onDelete={handleDeleteBudget}
            onSelectTransaction={(budget) => {
              try {
                localStorage.setItem(STORAGE_KEYS.PENDING_TX_BUDGET_ID, budget._id);
              } catch {
                /* ignore */
              }
              navigate('/dashboard');
            }}
          />
        )}
      </div>

      <BudgetForm
        isOpen={showBudgetForm}
        budget={editingBudget}
        onSubmit={async (data) => {
          const result = editingBudget
            ? await updateBudget(editingBudget._id, data)
            : await createBudget(data);
          if (result.success) {
            addNotification(editingBudget ? 'Updated.' : 'Created.', 'success');
            setShowBudgetForm(false);
            setEditingBudget(null);
          } else addNotification(result.message || 'Failed', 'error');
        }}
        onClose={() => {
          setShowBudgetForm(false);
          setEditingBudget(null);
        }}
        existingCategories={budgets.map((b) => b.category)}
      />
    </AppShell>
  );
};

export default BudgetsPage;
