import React from 'react';
/**
 * Budget Form Component
 * Modal form for creating and editing budgets.
 */

import { useEffect, useState } from 'react';
import { BUDGET_CATEGORIES } from '../../utils/constants.js';
import { getCurrencySymbol } from '../../utils/helpers.js';
import { useCurrency } from '../../hooks/useCurrency.js';

const BudgetForm = ({
  isOpen,
  budget,
  onSubmit,
  onClose,
  existingCategories = [],
}) => {
  const { currency } = useCurrency();
  const currencySymbol = getCurrencySymbol(currency);
  const [formData, setFormData] = useState({
    category: '',
    limit: '',
    description: '',
    alertThreshold: 80,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (budget) {
      setFormData({
        category: budget.category,
        limit: budget.limit.toString(),
        description: budget.description || '',
        alertThreshold: budget.alertThreshold || 80,
      });
    } else {
      setFormData({
        category: '',
        limit: '',
        description: '',
        alertThreshold: 80,
      });
    }
    setErrors({});
  }, [budget, isOpen]);

  const availableCategories = BUDGET_CATEGORIES.filter(
    (cat) =>
      !existingCategories.includes(cat.label) ||
      (budget && budget.category === cat.label)
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.category) {
      newErrors.category = 'Category is required.';
    }

    if (!formData.limit) {
      newErrors.limit = 'Budget limit is required.';
    } else if (Number.isNaN(Number(formData.limit)) || Number(formData.limit) <= 0) {
      newErrors.limit = 'Budget limit must be a positive number.';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSubmit({
      category: formData.category,
      limit: Number(formData.limit),
      description: formData.description.trim(),
      alertThreshold: Number.parseInt(formData.alertThreshold, 10),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-3 py-3 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-[520px] overflow-hidden rounded-t-[8px] border border-white/10 bg-[#101513] shadow-2xl sm:rounded-[8px]">
        <form onSubmit={handleSubmit} className="max-h-[92vh] overflow-y-auto p-5 sm:p-6">
          <header className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-[#9cff6d]">
                Budget setup
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
                {budget ? 'Edit budget' : 'Create budget'}
              </h2>
              <p className="mt-1 text-sm text-[#9aa8a1]">
                Set a clear monthly limit and alert threshold.
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] bg-white/5 text-lg font-semibold text-[#b8c9c1] transition hover:bg-white/10 hover:text-white"
              type="button"
              aria-label="Close"
            >
              x
            </button>
          </header>

          <div className="space-y-4">
            <div>
              <label htmlFor="category" className="bb-dark-label">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={!!budget}
                className={`bb-dark-field ${errors.category ? 'border-red-400/70' : ''}`}
              >
                <option value="">Choose category</option>
                {availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.label}>
                    {cat.icon} - {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-2 text-xs font-semibold text-red-300">{errors.category}</p>
              )}
            </div>

            <div>
              <label htmlFor="limit" className="bb-dark-label">
                Monthly limit
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#9cff6d]">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  id="limit"
                  name="limit"
                  value={formData.limit}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
                  className={`bb-dark-field pl-8 ${errors.limit ? 'border-red-400/70' : ''}`}
                />
              </div>
              {errors.limit && (
                <p className="mt-2 text-xs font-semibold text-red-300">{errors.limit}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="bb-dark-label">
                Notes
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add a short note"
                maxLength="200"
                rows="3"
                className="bb-dark-field min-h-[92px] resize-none py-3"
              />
              <p className="mt-1.5 text-xs font-medium text-[#7f9189]">
                {formData.description.length}/200
              </p>
            </div>

            <div className="rounded-[8px] bg-white/[0.04] p-4 ring-1 ring-white/10">
              <div className="mb-3 flex items-center justify-between gap-3">
                <label htmlFor="alertThreshold" className="bb-dark-label mb-0">
                  Alert threshold
                </label>
                <span className="rounded-[6px] bg-[#9cff6d] px-2.5 py-1 text-sm font-semibold text-[#071b16]">
                  {formData.alertThreshold}%
                </span>
              </div>
              <input
                type="range"
                id="alertThreshold"
                name="alertThreshold"
                min="50"
                max="100"
                value={formData.alertThreshold}
                onChange={handleChange}
                className="w-full accent-[#9cff6d]"
              />
              <p className="mt-2 text-xs text-[#9aa8a1]">
                Notify me when spending reaches this percentage.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" onClick={onClose} className="bb-btn-dark-secondary">
              Cancel
            </button>
            <button type="submit" className="bb-btn-dark-primary">
              {budget ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetForm;
