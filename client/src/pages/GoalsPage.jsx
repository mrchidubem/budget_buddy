/**
 * GoalsPage — savings targets (mobile list / desktop panel layout).
 */

import React, { useCallback, useEffect, useState } from 'react';
import AppShell from '../components/layout/AppShell.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { useNotification } from '../hooks/useNotification.js';
import { useCurrency } from '../hooks/useCurrency.js';
import * as goalService from '../services/goalService.js';
import { calculatePercentage } from '../utils/helpers.js';

const emptyForm = { name: '', targetAmount: '', currentAmount: '', deadline: '', category: '' };

const GoalsPage = () => {
  const { addNotification } = useNotification();
  const { formatAmount } = useCurrency();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await goalService.getGoals();
      setGoals(res.data || []);
    } catch (e) {
      addNotification(e.message || 'Failed to load goals', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const target = Number(form.targetAmount);
    if (!form.name.trim() || !Number.isFinite(target) || target <= 0) {
      addNotification('Name and target amount required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        targetAmount: target,
        currentAmount: Number(form.currentAmount) || 0,
        category: form.category.trim() || undefined,
        deadline: form.deadline || undefined,
      };
      if (editingId) await goalService.updateGoal(editingId, payload);
      else await goalService.createGoal(payload);
      addNotification('Saved.', 'success');
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadGoals();
    } catch (err) {
      addNotification(err.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell mobileTitle="Goals" mobileSubtitle="Savings targets">
      <div className="space-y-4">
        <div className="hidden lg:flex lg:justify-between lg:items-center">
          <h1 className="bb-page-title">Goals</h1>
          <button type="button" className="bb-btn-primary" onClick={() => setShowForm(true)}>
            New goal
          </button>
        </div>

        <button type="button" className="bb-btn-primary w-full lg:hidden" onClick={() => setShowForm(true)}>
          New goal
        </button>

        {loading ? (
          <LoadingSpinner message="Loading…" />
        ) : goals.length === 0 ? (
          <div className="bb-panel p-8 text-center text-sm text-[#71717a]">No goals yet.</div>
        ) : (
          <section className="bb-panel">
            <div className="bb-panel-head">
              <span className="bb-panel-title">{goals.length} goals</span>
            </div>
            {goals.map((goal) => {
              const pct = calculatePercentage(Number(goal.currentAmount) || 0, Number(goal.targetAmount) || 0);
              return (
                <div key={goal._id} className="bb-row flex-col !items-stretch gap-3 sm:flex-row sm:items-center">
                  <div className="bb-row-main w-full">
                    <p className="bb-row-title">{goal.name}</p>
                    <p className="bb-row-meta">
                      {formatAmount(goal.currentAmount)} / {formatAmount(goal.targetAmount)} · {pct}%
                    </p>
                    <div className="bb-progress-track mt-2">
                      <div className="bb-progress-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      className="bb-btn-secondary bb-btn-sm flex-1"
                      onClick={() => {
                        setEditingId(goal._id);
                        setForm({
                          name: goal.name,
                          targetAmount: String(goal.targetAmount),
                          currentAmount: String(goal.currentAmount ?? ''),
                          deadline: goal.deadline ? new Date(goal.deadline).toISOString().slice(0, 10) : '',
                          category: goal.category || '',
                        });
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="bb-btn-danger bb-btn-sm"
                      onClick={async () => {
                        if (!window.confirm('Delete?')) return;
                        await goalService.deleteGoal(goal._id);
                        await loadGoals();
                      }}
                    >
                      Del
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <form onSubmit={handleSubmit} className="w-full sm:max-w-md bg-white border border-[#e4e4e7] rounded-t-[6px] sm:rounded-[6px] p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold">{editingId ? 'Edit goal' : 'New goal'}</h2>
            <div className="mt-4 space-y-3">
              <input className="bb-input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input className="bb-input" type="number" placeholder="Target" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} required />
              <input className="bb-input" type="number" placeholder="Saved" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} />
              <input className="bb-input" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" className="bb-btn-secondary flex-1" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" disabled={saving} className="bb-btn-primary flex-1">{saving ? '…' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
};

export default GoalsPage;
