/**
 * RecurringPage — automated transaction schedules.
 */

import React, { useCallback, useEffect, useState } from 'react';
import AppShell from '../components/layout/AppShell.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { useBudget } from '../hooks/useBudget.js';
import { useNotification } from '../hooks/useNotification.js';
import { useCurrency } from '../hooks/useCurrency.js';
import * as recurringService from '../services/recurringService.js';

const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];
const emptyForm = { description: '', amount: '', budgetId: '', type: 'expense', frequency: 'monthly', dayOfMonth: '1', weekday: '1' };

const RecurringPage = () => {
  const { budgets, fetchBudgets } = useBudget();
  const { addNotification } = useNotification();
  const { formatAmount } = useCurrency();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await fetchBudgets();
      const res = await recurringService.getRecurringTransactions();
      setItems(res.data || []);
    } catch (e) {
      addNotification(e.message || 'Load failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification, fetchBudgets]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.description.trim() || !form.budgetId || amount <= 0) {
      addNotification('Complete all fields.', 'error');
      return;
    }
    const recurrence = { frequency: form.frequency };
    if (form.frequency === 'weekly') recurrence.weekday = Number(form.weekday);
    if (form.frequency === 'monthly') recurrence.dayOfMonth = Number(form.dayOfMonth);

    setSaving(true);
    try {
      await recurringService.createRecurringTransaction({
        description: form.description.trim(),
        amount,
        budgetId: form.budgetId,
        type: form.type,
        recurrence,
      });
      addNotification('Created.', 'success');
      setShowForm(false);
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      addNotification(err.message || 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell mobileTitle="Recurring" mobileSubtitle="Automated entries">
      <div className="space-y-4">
        <div className="hidden lg:flex lg:justify-between lg:items-center">
          <h1 className="bb-page-title">Recurring</h1>
          <button type="button" className="bb-btn-primary" disabled={!budgets.length} onClick={() => setShowForm(true)}>
            Add schedule
          </button>
        </div>

        {!budgets.length && <div className="bb-alert-info">Create a budget first.</div>}

        <button type="button" className="bb-btn-primary w-full lg:hidden" disabled={!budgets.length} onClick={() => setShowForm(true)}>
          Add schedule
        </button>

        {loading ? (
          <LoadingSpinner message="Loading…" />
        ) : items.length === 0 ? (
          <div className="bb-panel p-8 text-center text-sm text-[#71717a]">No schedules.</div>
        ) : (
          <section className="bb-panel">
            {items.map((item) => (
              <div key={item._id} className="bb-row">
                <div className="bb-row-main">
                  <p className="bb-row-title">{item.description}</p>
                  <p className="bb-row-meta">
                    {item.budgetId?.category} · {item.recurrence?.frequency} · {item.type}
                  </p>
                </div>
                <p className="bb-row-value">{formatAmount(item.amount)}</p>
                <button type="button" className="bb-btn-danger bb-btn-sm" onClick={async () => {
                  if (!window.confirm('Delete?')) return;
                  await recurringService.deleteRecurringTransaction(item._id);
                  await loadData();
                }}>
                  Del
                </button>
              </div>
            ))}
          </section>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40">
          <form onSubmit={handleSubmit} className="w-full sm:max-w-md bg-white p-6 rounded-t-[6px] sm:rounded-[6px] border border-[#e4e4e7] space-y-3">
            <h2 className="font-semibold">New schedule</h2>
            <input className="bb-input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            <select className="bb-select" value={form.budgetId} onChange={(e) => setForm({ ...form, budgetId: e.target.value })} required>
              <option value="">Budget</option>
              {budgets.map((b) => (
                <option key={b._id} value={b._id}>{b.category}</option>
              ))}
            </select>
            <input className="bb-input" type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <select className="bb-select" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <div className="flex gap-2 pt-2">
              <button type="button" className="bb-btn-secondary flex-1" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" disabled={saving} className="bb-btn-primary flex-1">Save</button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
};

export default RecurringPage;
