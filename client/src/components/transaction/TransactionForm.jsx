import React from 'react';
/**
 * Transaction Form Component
 * Modal form for creating and editing transactions
 */

import { useState, useEffect } from 'react';
import { TRANSACTION_TYPES, PAYMENT_METHODS } from '../../utils/constants.js';
import { getCurrencySymbol } from '../../utils/helpers.js';
import { useCurrency } from '../../hooks/useCurrency.js';

const toDateTimeLocalInput = (input) => {
  const date = input ? new Date(input) : new Date();
  if (Number.isNaN(date.getTime())) return '';

  const pad = (value) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const TransactionForm = ({ isOpen, budget, transaction, onSubmit, onClose }) => {
  const { currency } = useCurrency();
  const currencySymbol = getCurrencySymbol(currency);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    notes: '',
    paymentMethod: 'cash',
    date: toDateTimeLocalInput(),
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFormData({
        description: transaction.description,
        amount: transaction.amount.toString(),
        type: transaction.type,
        notes: transaction.notes || '',
        paymentMethod: transaction.paymentMethod || 'cash',
        date: toDateTimeLocalInput(transaction.date),
      });
    } else {
      setFormData({
        description: '',
        amount: '',
        type: 'expense',
        notes: '',
        paymentMethod: 'cash',
        date: toDateTimeLocalInput(),
      });
    }
    setErrors({});
  }, [transaction, isOpen]);

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

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required.';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required.';
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number.';
    }

    if (!formData.date || Number.isNaN(new Date(formData.date).getTime())) {
      newErrors.date = 'A valid date and time is required.';
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

    try {
      setSubmitting(true);
      await onSubmit({
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        type: formData.type,
        notes: formData.notes.trim(),
        paymentMethod: formData.paymentMethod,
        budgetId: budget._id,
        date: new Date(formData.date).toISOString(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full animate-slideUp shadow-2xl border border-slate-100">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <header className="flex justify-between items-start border-b border-slate-200 pb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">
                Transaction
              </p>
              <h2 className="text-2xl font-black text-slate-900 mt-2">
                {transaction ? 'Edit Transaction' : 'Add Transaction'}
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-2">
                Budget: <span className="text-slate-700 font-black">{budget?.category}</span>
              </p>
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
              htmlFor="description"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5"
            >
              Description
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Example: Weekly groceries"
              maxLength="100"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-sm font-medium ${
                errors.description ? 'border-danger-500 bg-danger-50' : 'border-slate-300 hover:border-slate-400'
              }`}
            />
            {errors.description && (
              <p className="mt-2 text-xs font-semibold text-danger-600">{errors.description}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="amount"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5"
            >
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400 font-bold">
                {currencySymbol}
              </span>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-sm font-medium ${
                  errors.amount ? 'border-danger-500 bg-danger-50' : 'border-slate-300 hover:border-slate-400'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="mt-2 text-xs font-semibold text-danger-600">{errors.amount}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="type"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5"
              >
                Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-sm font-medium bg-white hover:border-slate-400"
              >
                {TRANSACTION_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="paymentMethod"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5"
              >
                Payment Method
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-sm font-medium bg-white hover:border-slate-400"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="date"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5"
            >
              Date and Time
            </label>
            <input
              type="datetime-local"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-sm font-medium ${
                errors.date ? 'border-danger-500 bg-danger-50' : 'border-slate-300 hover:border-slate-400'
              }`}
            />
            {errors.date && (
              <p className="mt-2 text-xs font-semibold text-danger-600">{errors.date}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5"
            >
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional details..."
              maxLength="250"
              rows="2"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition resize-none text-sm font-medium hover:border-slate-400"
            />
            <p className="mt-1.5 text-xs font-semibold text-slate-500">{formData.notes.length}/250</p>
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
              disabled={submitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-cyan-600 text-white text-sm font-bold uppercase tracking-wide rounded-lg hover:from-sky-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 shadow-md hover:shadow-lg"
            >
              {submitting
                ? 'Saving...'
                : transaction
                  ? 'Update Transaction'
                  : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
