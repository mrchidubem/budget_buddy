import React from 'react';
/**
 * Budget Form Component
 * Modal form for creating and editing budgets
 */

import { useState, useEffect } from 'react';
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
    } else if (isNaN(formData.limit) || parseFloat(formData.limit) <= 0) {
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
      limit: parseFloat(formData.limit),
      description: formData.description.trim(),
      alertThreshold: parseInt(formData.alertThreshold, 10),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full animate-slideUp shadow-2xl border border-slate-100">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <header className="flex justify-between items-start border-b border-slate-200 pb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">
                Budget
              </p>
              <h2 className="text-2xl font-black text-slate-900 mt-2">
                {budget ? 'Edit Budget' : 'Create Budget'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition text-2xl leading-none p-1 hover:bg-slate-100 rounded-lg"
              type="button"
              aria-label="Close"
            >
              ✕
            </button>
          </header>

          <div>
            <label
              htmlFor="category"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5"
            >
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={!!budget}
              className={`w-full px-4 py-3 border rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-sm font-medium ${
                errors.category ? 'border-danger-500 bg-danger-50' : 'border-slate-300 hover:border-slate-400'
              } disabled:bg-slate-50 disabled:text-slate-500`}
            >
              <option value="">Select category</option>
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.label}>
                  {cat.icon} - {cat.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-2 text-xs font-semibold text-danger-600">{errors.category}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="limit"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5"
            >
              Monthly Limit
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400 font-bold">
                {currencySymbol}
              </span>
              <input
                type="number"
                id="limit"
                name="limit"
                value={formData.limit}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-sm font-medium ${
                  errors.limit ? 'border-danger-500 bg-danger-50' : 'border-slate-300 hover:border-slate-400'
                }`}
              />
            </div>
            {errors.limit && (
              <p className="mt-2 text-xs font-semibold text-danger-600">{errors.limit}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional notes about this budget..."
              maxLength="200"
              rows="3"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition resize-none text-sm font-medium hover:border-slate-400"
            />
            <p className="mt-1.5 text-xs font-semibold text-slate-500">
              {formData.description.length}/200
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label
                htmlFor="alertThreshold"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Alert Threshold
              </label>
              <span className="text-sm font-black text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
                {formData.alertThreshold}%
              </span>
            </div>
            <input
              type="range"
              id="alertThreshold"
              name="alertThreshold"
              min="0"
              max="100"
              value={formData.alertThreshold}
              onChange={handleChange}
              className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-sky-600"
            />
            <p className="mt-2 text-xs text-slate-500">
              Alert when spending reaches {formData.alertThreshold}% of budget
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 bg-slate-100 text-slate-700 text-sm font-bold uppercase tracking-wide rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 transition-all duration-200 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-cyan-600 text-white text-sm font-bold uppercase tracking-wide rounded-lg hover:from-sky-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg"
            >
              {budget ? 'Update Budget' : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetForm;
