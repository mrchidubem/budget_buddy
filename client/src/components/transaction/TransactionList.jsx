import React from 'react';
/**
 * Transaction List Component
 * Displays all transactions grouped by date
 */

import TransactionItem from './TransactionItem.jsx';
import { formatDate } from '../../utils/helpers.js';

const TransactionList = ({ transactions, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-slate-600 text-sm font-semibold">Loading transactions...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bb-surface rounded-2xl p-8 text-center">
        <p className="text-slate-700 font-semibold">No transactions yet.</p>
      </div>
    );
  }

  const groupedTransactions = transactions.reduce((acc, transaction) => {
    const date = formatDate(transaction.date);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(groupedTransactions).map(([date, txns]) => (
        <section key={date}>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">
            {date}
          </h3>
          <div className="space-y-2.5">
            {txns.map((transaction) => (
              <TransactionItem
                key={transaction._id}
                transaction={transaction}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default TransactionList;
