import React from 'react';
/**
 * Transaction Item Component
 * Displays individual transaction in a list
 */

import { formatDate, formatTime } from '../../utils/helpers.js';
import { useCurrency } from '../../hooks/useCurrency.js';

const TransactionItem = ({ transaction, onEdit, onDelete }) => {
  const { formatAmount } = useCurrency();
  const isIncome = transaction.type === 'income';

  return (
    <article
      className={`bb-surface rounded-xl p-4 border-l-4 ${
        isIncome ? 'border-l-success-500' : 'border-l-warning-500'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate">
            {transaction.description}
          </p>
          {transaction.notes && (
            <p className="text-sm text-slate-600 truncate">{transaction.notes}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
            <span>
              {formatDate(transaction.date)} at {formatTime(transaction.date)}
            </span>
            {transaction.paymentMethod && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100">
                {transaction.paymentMethod.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <p
            className={`text-lg font-extrabold ${
              isIncome ? 'text-success-700' : 'text-warning-700'
            }`}
          >
            {isIncome ? '+' : '-'}
            {formatAmount(transaction.amount)}
          </p>

          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => onEdit(transaction)}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
              title="Edit transaction"
              aria-label="Edit transaction"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(transaction._id)}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-red-50 text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300"
              title="Delete transaction"
              aria-label="Delete transaction"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default TransactionItem;
