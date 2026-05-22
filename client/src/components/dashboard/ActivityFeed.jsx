/**
 * ActivityFeed
 * Audit timeline with compact responsive rows.
 */

import React from 'react';
import { formatDate, formatTime } from '../../utils/helpers.js';
import { useCurrency } from '../../hooks/useCurrency.js';

const buildLabel = (action = '') =>
  action
    .replace(/\./g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Activity';

const ActivityFeed = ({ items, loaded, formatActionLabel = buildLabel }) => {
  const { formatAmount } = useCurrency();

  if (!loaded) {
    return <p className="px-1 py-6 text-sm text-[#9aa8a1]">Loading activity...</p>;
  }

  if (!items.length) {
    return <p className="px-1 py-6 text-sm text-[#9aa8a1]">No recent activity.</p>;
  }

  return (
    <div className="bb-timeline max-h-[620px] overflow-y-auto pr-1">
      {items.slice(0, 12).map((item) => {
        const amount = Number(item.metadata?.amount);
        const hasAmount = Number.isFinite(amount) && amount > 0;

        return (
          <div key={item._id} className="bb-timeline-item">
            <span className="bb-timeline-dot" aria-hidden="true" />
            <p className="pr-5 text-sm font-semibold text-white leading-snug break-words">
              {item.summary || formatActionLabel(item.action)}
            </p>
            <p className="text-xs text-[#9aa8a1] mt-1 flex flex-wrap gap-x-2 gap-y-1">
              <span>{formatDate(item.createdAt)}</span>
              <span>{formatTime(item.createdAt)}</span>
              {hasAmount && (
                <span className="font-semibold text-white tabular-nums">
                  {formatAmount(amount)}
                </span>
              )}
              {item.metadata?.category && (
                <span className="text-[#b8c9c1] break-words">
                  {item.metadata.category}
                </span>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityFeed;
