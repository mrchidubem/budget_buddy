/**
 * StatMetric
 * KPI tile for dashboards and reports.
 */

import React from 'react';

const StatMetric = ({ label, value, hint, tone = 'default' }) => {
  const valueTone = {
    default: 'text-[#10201b]',
    accent: 'text-[#07885b]',
    warning: 'text-amber-700',
    danger: 'text-red-700',
  };

  return (
    <article className="bb-card-flat p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <p className="bb-metric-label">{label}</p>
      <p className={`bb-metric-value ${valueTone[tone] || valueTone.default}`}>{value}</p>
      {hint && <p className="mt-1.5 text-xs text-[#64716d]">{hint}</p>}
    </article>
  );
};

export default StatMetric;
