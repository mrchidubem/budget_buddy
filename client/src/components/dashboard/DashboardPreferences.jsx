/**
 * DashboardPreferences
 * Collapsible settings block for currency and alerts.
 */

import React from 'react';
import { SUPPORTED_CURRENCIES } from '../../utils/constants.js';

const DashboardPreferences = ({
  currency,
  onCurrencyChange,
  isUpdatingPreferences,
  alertPreferences,
  alertThresholdDraft,
  onAlertThresholdChange,
  onEmailToggle,
  onSaveThresholds,
  onSendTestEmail,
  isSendingEmailTest,
  thresholdDirty,
  browserSupported,
  browserPermission,
  onEnableDesktopAlerts,
  isRequestingDesktopAlerts,
}) => {
  return (
    <details className="bb-panel group">
      <summary className="bb-panel-head cursor-pointer list-none flex items-center justify-between [&::-webkit-details-marker]:hidden">
        <span className="bb-panel-title">Settings & alerts</span>
        <span className="text-xs font-medium text-[#64716d] group-open:hidden">
          Expand
        </span>
      </summary>
      <div className="p-4 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="bb-label" htmlFor="dashCurrency">
              Display currency
            </label>
            <select
              id="dashCurrency"
              className="bb-select"
              value={currency}
              onChange={onCurrencyChange}
              disabled={isUpdatingPreferences}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm font-medium text-[#42524d]">
              <input
                type="checkbox"
                checked={Boolean(alertPreferences?.emailEnabled)}
                onChange={onEmailToggle}
                disabled={isUpdatingPreferences}
                className="rounded border-[#c8d4ce] text-[#00a86b]"
              />
              Email alerts
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="bb-label">Daily alert %</label>
            <input
              type="number"
              min="50"
              max="100"
              className="bb-input"
              value={alertThresholdDraft.dailyThresholdPercent}
              onChange={onAlertThresholdChange('dailyThresholdPercent')}
            />
          </div>
          <div>
            <label className="bb-label">Budget alert %</label>
            <input
              type="number"
              min="50"
              max="100"
              className="bb-input"
              value={alertThresholdDraft.budgetThresholdPercent}
              onChange={onAlertThresholdChange('budgetThresholdPercent')}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="bb-btn-secondary bb-btn-sm"
            onClick={onSaveThresholds}
            disabled={!thresholdDirty || isUpdatingPreferences}
          >
            Save thresholds
          </button>
          <button
            type="button"
            className="bb-btn-secondary bb-btn-sm"
            onClick={onSendTestEmail}
            disabled={!alertPreferences?.emailEnabled || isSendingEmailTest}
          >
            {isSendingEmailTest ? 'Sending...' : 'Test email'}
          </button>
          {browserSupported && browserPermission !== 'granted' && (
            <button
              type="button"
              className="bb-btn-secondary bb-btn-sm"
              onClick={onEnableDesktopAlerts}
              disabled={isRequestingDesktopAlerts}
            >
              Enable push
            </button>
          )}
        </div>
      </div>
    </details>
  );
};

export default DashboardPreferences;
