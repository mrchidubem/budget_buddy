/**
 * TransactionList
 * Transactions grouped by date inside a single panel (row layout).
 */

import React from 'react';
import TransactionItem from './TransactionItem.jsx';
import { formatDate } from '../../utils/helpers.js';

const TransactionList = ({ transactions, loading, onEdit, onDelete }) => {
  if (loading) {
    return <p className="px-4 py-8 text-sm text-[#64716d] text-center">Loading...</p>;
  }

  if (transactions.length === 0) {
    return <p className="px-4 py-8 text-sm text-[#64716d] text-center">No transactions.</p>;
  }

  const grouped = transactions.reduce((acc, tx) => {
    const date = formatDate(tx.date);
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(grouped).map(([date, txns]) => (
        <div key={date}>
          <p className="px-4 py-2 text-xs font-semibold text-[#64716d] bg-[#f8faf6]">
            {date}
          </p>
          {txns.map((transaction) => (
            <TransactionItem
              key={transaction._id}
              transaction={transaction}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default TransactionList;
