/**
 * BudgetCard
 * Single category budget: utilization, amounts, and primary actions.
 */

import React from 'react';
import { calculatePercentage, getCategoryIcon } from '../../utils/helpers.js';
import { useCurrency } from '../../hooks/useCurrency.js';

const BudgetCard = ({ budget, onEdit, onDelete, onSelectTransaction }) => {
  const { formatAmount } = useCurrency();

  const spent = Number(budget.spent) || 0;
  const limit = Number(budget.limit) || 0;
  const isOver = spent > limit;
  const pct = calculatePercentage(spent, limit);
  const remaining = limit - spent;
  const threshold = budget.alertThreshold ?? 80;

  let statusLabel = 'On track';
  let badgeClass = 'bb-badge-success';
  if (isOver) {
    statusLabel = 'Over limit';
    badgeClass = 'bb-badge-danger';
  } else if (pct >= threshold) {
    statusLabel = 'Approaching limit';
    badgeClass = 'bb-badge-warning';
  }

  const fillClass = isOver
    ? 'bb-progress-fill-danger'
    : pct >= threshold
      ? 'bb-progress-fill-warning'
      : 'bb-progress-fill';

  return (
    <article className="bb-card-interactive p-4 sm:p-5 min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-[8px] bg-[#edf5ef] text-[#071b16] text-xs font-semibold flex items-center justify-center shrink-0">
            {getCategoryIcon(budget.category)}
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-[#10201b] truncate">
              {budget.category}
            </h3>
            <span className={`${badgeClass} mt-2`}>{statusLabel}</span>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={() => onEdit(budget)} className="bb-btn-secondary bb-btn-sm">
            Edit
          </button>
          <button type="button" onClick={() => onDelete(budget._id)} className="bb-btn-danger bb-btn-sm">
            Delete
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-[8px] bg-[#f8faf6] p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="bb-metric-label">Spent</p>
            <p className={`mt-1 truncate text-xl font-semibold tabular-nums ${isOver ? 'text-red-700' : 'text-[#10201b]'}`}>
              {formatAmount(spent)}
            </p>
          </div>
          <div className="text-right">
            <p className="bb-metric-label">Limit</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-[#64716d]">
              {formatAmount(limit)}
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-between text-xs mb-2">
          <span className="bb-metric-label">Utilization</span>
          <span className="font-semibold text-[#10201b] tabular-nums">{pct}%</span>
        </div>
        <div className="bb-progress-track">
          <div className={fillClass} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2">
        <div className="min-w-0 p-3 rounded-[8px] bg-white border border-[#edf3ef]">
          <dt className="bb-metric-label">Remaining</dt>
          <dd className={`mt-1 text-sm font-semibold tabular-nums truncate ${remaining < 0 ? 'text-red-700' : 'text-[#07885b]'}`}>
            {formatAmount(Math.max(0, remaining))}
          </dd>
        </div>
        <div className="min-w-0 p-3 rounded-[8px] bg-white border border-[#edf3ef]">
          <dt className="bb-metric-label">Threshold</dt>
          <dd className="mt-1 text-sm font-semibold text-[#10201b] tabular-nums truncate">{threshold}%</dd>
        </div>
      </dl>

      {isOver && (
        <p className="mt-4 bb-alert-error text-xs">
          Exceeded by {formatAmount(spent - limit)}. Review transactions or adjust the limit.
        </p>
      )}

      <button type="button" onClick={() => onSelectTransaction(budget)} className="bb-btn-primary w-full mt-5">
        Record transaction
      </button>
    </article>
  );
};

export default BudgetCard;
