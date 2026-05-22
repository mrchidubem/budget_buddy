/**
 * TransactionItem
 * Compact list row for transaction history.
 */

import React from 'react';
import { formatDate } from '../../utils/helpers.js';
import { useCurrency } from '../../hooks/useCurrency.js';

const TransactionItem = ({ transaction, onEdit, onDelete }) => {
  const { formatAmount } = useCurrency();
  const isIncome = transaction.type === 'income';

  return (
    <div className="bb-row">
      <div
        className={`w-1 self-stretch rounded-full shrink-0 ${isIncome ? 'bg-emerald-500' : 'bg-[#071b16]'}`}
        aria-hidden="true"
      />
      <div className="bb-row-main">
        <p className="bb-row-title">{transaction.description}</p>
        <p className="bb-row-meta">
          {formatDate(transaction.date)}
          {transaction.budgetId?.category ? ` / ${transaction.budgetId.category}` : ''}
        </p>
      </div>
      <p className={`bb-row-value ${isIncome ? 'text-emerald-700' : ''}`}>
        {isIncome ? '+' : '-'}
        {formatAmount(transaction.amount)}
      </p>
      <div className="flex gap-1 shrink-0">
        <button type="button" className="bb-btn-ghost bb-btn-sm" onClick={() => onEdit(transaction)}>
          Edit
        </button>
        <button type="button" className="bb-btn-danger bb-btn-sm" onClick={() => onDelete(transaction._id)}>
          Del
        </button>
      </div>
    </div>
  );
};

export default TransactionItem;
