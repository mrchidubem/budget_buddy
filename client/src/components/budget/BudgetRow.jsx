/**
 * BudgetRow
 * Single list-row representation of a budget (mobile-first; scales on desktop).
 */

import React from 'react';
import { calculatePercentage, getCategoryIcon } from '../../utils/helpers.js';
import { useCurrency } from '../../hooks/useCurrency.js';

const BudgetRow = ({ budget, onEdit, onDelete, onSelectTransaction }) => {
  const { formatAmount } = useCurrency();
  const spent = Number(budget.spent) || 0;
  const limit = Number(budget.limit) || 0;
  const pct = calculatePercentage(spent, limit);
  const isOver = spent > limit;
  const threshold = budget.alertThreshold ?? 80;

  let badge = 'bb-badge-ok';
  let status = 'On track';
  if (isOver) {
    badge = 'bb-badge-bad';
    status = 'Over';
  } else if (pct >= threshold) {
    badge = 'bb-badge-warn';
    status = 'Near limit';
  }

  const fillClass = isOver ? 'bb-progress-fill-bad' : pct >= threshold ? 'bb-progress-fill-warn' : 'bb-progress-fill';

  return (
    <div className="bb-row flex-col items-stretch !py-4 gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
        <span className="w-10 h-10 rounded-[6px] bg-[#f4f4f5] text-xs font-semibold text-[#52525b] flex items-center justify-center shrink-0">
          {getCategoryIcon(budget.category)}
        </span>
        <div className="bb-row-main">
          <div className="flex items-center gap-2">
            <p className="bb-row-title">{budget.category}</p>
            <span className={badge}>{status}</span>
          </div>
          <p className="bb-row-meta">
            {formatAmount(spent)} of {formatAmount(limit)} · {pct}%
          </p>
          <div className="bb-progress-track mt-2 max-w-xs">
            <div className={fillClass} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>
        <p className="bb-row-value sm:hidden">{formatAmount(spent)}</p>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto sm:shrink-0">
        <button type="button" className="bb-btn-primary bb-btn-sm flex-1 sm:flex-none" onClick={() => onSelectTransaction(budget)}>
          Add
        </button>
        <button type="button" className="bb-btn-secondary bb-btn-sm" onClick={() => onEdit(budget)}>
          Edit
        </button>
        <button type="button" className="bb-btn-danger bb-btn-sm" onClick={() => onDelete(budget._id)}>
          Del
        </button>
      </div>
    </div>
  );
};

export default BudgetRow;
