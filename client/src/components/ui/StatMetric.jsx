/**
 * StatMetric
 * KPI tile for dashboards and reports.
 */

import React from 'react';

const StatMetric = ({ label, value, hint, tone = 'default' }) => {
  const valueTone = {
    default: 'text-white',
    accent: 'text-[#9cff6d]',
    warning: 'text-amber-300',
    danger: 'text-red-300',
  };

  return (
    <article className="bb-card-flat p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <p className="bb-metric-label">{label}</p>
      <p className={`bb-metric-value ${valueTone[tone] || valueTone.default}`}>{value}</p>
      {hint && <p className="mt-1.5 text-xs text-[#9aa8a1]">{hint}</p>}
    </article>
  );
};

export default StatMetric;
