import React from 'react';
/**
 * Budget Card Component
 * Displays individual budget with progress bar and actions
 */

import {
  calculatePercentage,
  getCategoryIcon,
} from '../../utils/helpers.js';
import { useCurrency } from '../../hooks/useCurrency.js';

const BudgetCard = ({ budget, onEdit, onDelete, onSelectTransaction }) => {
  const { formatAmount } = useCurrency();
  const spent = Number(budget.spent) || 0;
  const limit = Number(budget.limit) || 0;
  const isOverBudget = spent > limit;
  const percentageSpent = calculatePercentage(spent, limit);
  const remaining = limit - spent;

  const threshold = budget.alertThreshold ?? 80;
  const spentPercent = calculatePercentage(spent, limit);

  let statusLabel = 'On track';
  let statusClass = 'bg-success-100 text-success-700 border border-success-300 shadow-sm';

  if (isOverBudget) {
    statusLabel = 'Over budget';
    statusClass = 'bg-danger-100 text-danger-700 border border-danger-300 shadow-sm';
  } else if (spentPercent >= threshold) {
    statusLabel = 'Near limit';
    statusClass = 'bg-warning-100 text-warning-700 border border-warning-300 shadow-sm';
  }

  return (
    <article
      className={`relative bg-white rounded-2xl p-6 transition-all duration-300 border ${
        isOverBudget
          ? 'border-danger-200 shadow-md hover:shadow-lg hover:shadow-danger-500/10'
          : 'border-slate-200 shadow-sm hover:shadow-lg hover:shadow-slate-900/5'
      } group`}
    >
      {/* Gradient accent bar */}
      {isOverBudget && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-danger-500 via-danger-400 to-red-500 rounded-t-2xl" />
      )}
      {!isOverBudget && spentPercent >= threshold && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-warning-500 via-warning-400 to-amber-500 rounded-t-2xl" />
      )}
      {!isOverBudget && spentPercent < threshold && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-success-500 via-emerald-400 to-teal-500 rounded-t-2xl" />
      )}

      <div className="flex items-start justify-between gap-3 mb-5 flex-col sm:flex-row">
        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-100 to-cyan-100 text-slate-700 text-sm font-bold tracking-wide flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm flex-shrink-0">
            {getCategoryIcon(budget.category)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {budget.category}
            </h3>
            <span
              className={`inline-flex items-center mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold transition-colors duration-200 ${statusClass}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onEdit(budget)}
            className="flex-1 sm:flex-none px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 transition-all duration-200 active:scale-95"
            title="Edit budget"
            aria-label="Edit budget"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(budget._id)}
            className="flex-1 sm:flex-none px-3 py-2 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-1 transition-all duration-200 active:scale-95"
            title="Delete budget"
            aria-label="Delete budget"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex justify-between items-center mb-2 gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
            Spending Progress
          </p>
          <p className="text-xs font-bold text-slate-700 flex-shrink-0">{percentageSpent}%</p>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-sm">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isOverBudget
                ? 'bg-gradient-to-r from-danger-500 to-red-500'
                : spentPercent >= threshold
                ? 'bg-gradient-to-r from-warning-500 to-amber-500'
                : 'bg-gradient-to-r from-success-500 to-emerald-500'
            }`}
            style={{ width: `${Math.min(percentageSpent, 100)}%` }}
          />
        </div>
      </div>

      <div className="mb-6 p-5 bg-white border-2 border-slate-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
        {/* Mobile: Stacked layout */}
        <div className="md:hidden space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                Spent
              </p>
              <p
                className={`text-base sm:text-lg font-black break-words ${
                  isOverBudget ? 'text-danger-600' : 'text-slate-900'
                }`}
              >
                {formatAmount(spent)}
              </p>
            </div>
            <div className={`h-10 w-1 rounded-full ${isOverBudget ? 'bg-danger-100' : 'bg-slate-200'}`} />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                Remaining
              </p>
              <p
                className={`text-base sm:text-lg font-black break-words ${
                  remaining < 0 ? 'text-danger-600' : 'text-success-700'
                }`}
              >
                {formatAmount(Math.max(0, remaining))}
              </p>
            </div>
            <div className={`h-10 w-1 rounded-full ${remaining < 0 ? 'bg-danger-100' : 'bg-success-100'}`} />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border-2 border-slate-200">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                Monthly Limit
              </p>
              <p className="text-base sm:text-lg font-black text-slate-900 break-words">
                {formatAmount(limit)}
              </p>
            </div>
            <div className="h-10 w-1 rounded-full bg-slate-300" />
          </div>
        </div>

        {/* Desktop: 3-column grid layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-4">
          {/* Spent */}
          <div className="text-center py-3 px-2">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
              Spent
            </p>
            <p
              className={`text-lg lg:text-xl font-black leading-tight break-words word-break: break-word ${
                isOverBudget ? 'text-danger-600' : 'text-slate-900'
              }`}
            >
              {formatAmount(spent)}
            </p>
            <div className={`h-1.5 w-full rounded-full mt-3 ${isOverBudget ? 'bg-danger-200' : 'bg-slate-200'}`} />
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center">
            <div className="h-16 w-0.5 bg-gradient-to-b from-transparent via-slate-300 to-transparent" />
          </div>

          {/* Remaining */}
          <div className="text-center py-3 px-2">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
              Remaining
            </p>
            <p
              className={`text-lg lg:text-xl font-black leading-tight break-words ${
                remaining < 0 ? 'text-danger-600' : 'text-success-700'
              }`}
            >
              {formatAmount(Math.max(0, remaining))}
            </p>
            <div className={`h-1.5 w-full rounded-full mt-3 ${remaining < 0 ? 'bg-danger-200' : 'bg-success-200'}`} />
          </div>

          {/* Limit - Full width below */}
          <div className="col-span-3 pt-3 border-t-2 border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Monthly Limit
              </p>
              <p className="text-xl lg:text-2xl font-black text-slate-900">
                {formatAmount(limit)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isOverBudget && (
        <div className="mb-4 p-3 sm:p-4 bg-danger-50 text-danger-700 rounded-xl text-sm font-bold border border-danger-200 flex items-start gap-2">
          <span className="text-lg sm:text-xl flex-shrink-0">⚠️</span>
          <div className="min-w-0">
            <p>Over budget by {formatAmount(spent - limit)}</p>
            <p className="text-xs sm:text-sm text-danger-600 font-semibold mt-1">Consider adjusting your spending or budget limit.</p>
          </div>
        </div>
      )}

      <button
        onClick={() => onSelectTransaction(budget)}
        className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-cyan-600 text-white text-xs sm:text-sm font-bold uppercase tracking-wide rounded-lg shadow-md hover:shadow-lg hover:from-sky-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 group"
        aria-label="Add transaction"
      >
        <span className="text-lg sm:text-xl group-hover:scale-125 transition-transform">+</span>
        Add Transaction
      </button>
    </article>
  );
};

export default BudgetCard;
