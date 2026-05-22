/**
 * BudgetList
 * Responsive budget card grid.
 */

import React from 'react';
import BudgetCard from './BudgetCard.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

const BudgetList = ({ budgets, loading, onEdit, onDelete, onSelectTransaction }) => {
  if (loading) {
    return <LoadingSpinner message="Loading budgets..." />;
  }

  if (budgets.length === 0) {
    return (
      <div className="bb-panel p-8 text-center">
        <p className="text-sm font-medium text-[#10201b]">No budgets yet</p>
        <p className="text-xs text-[#64716d] mt-1">Create a category to start tracking.</p>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="bb-section-title">Budget categories</h2>
          <p className="bb-section-subtitle">Active limits, utilization, and quick actions.</p>
        </div>
        <span className="text-xs font-semibold text-[#42524d] bg-white border border-[#e3e9e5] rounded-[6px] px-2.5 py-1 shadow-sm">
          {budgets.length} total
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
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
    </section>
  );
};

export default BudgetList;
