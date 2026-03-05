import React from 'react';
/**
 * Budget List Component
 * Displays all budgets in a grid layout
 */

import BudgetCard from './BudgetCard.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

const BudgetList = ({
  budgets,
  loading,
  onEdit,
  onDelete,
  onSelectTransaction,
}) => {
  if (loading) {
    return <LoadingSpinner message="Loading budgets..." />;
  }

  if (budgets.length === 0) {
    return (
      <div className="bb-surface rounded-2xl text-center py-12 px-6">
        <p className="text-2xl font-extrabold text-slate-900 mb-2">No budgets yet</p>
        <p className="text-slate-600 text-sm">
          Create your first budget category to start tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {budgets.map((budget) => (
        <BudgetCard
          key={budget._id}
          budget={budget}
          onEdit={onEdit}
          onDelete={onDelete}
          onSelectTransaction={onSelectTransaction}
        />
      ))}
    </div>
  );
};

export default BudgetList;
