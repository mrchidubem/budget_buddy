import React from 'react';
/**
 * Dashboard Page
 * Main page displaying budgets and transactions
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import AppShell from '../components/layout/AppShell.jsx';
import ActivityFeed from '../components/dashboard/ActivityFeed.jsx';
import DashboardPreferences from '../components/dashboard/DashboardPreferences.jsx';
import BudgetList from '../components/budget/BudgetList.jsx';
import BudgetForm from '../components/budget/BudgetForm.jsx';
import TransactionForm from '../components/transaction/TransactionForm.jsx';
import TransactionList from '../components/transaction/TransactionList.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { useBudget } from '../hooks/useBudget.js';
import { useNotification } from '../hooks/useNotification.js';
import { useAuth } from '../hooks/useAuth.js';
import { useCurrency } from '../hooks/useCurrency.js';
import * as activityService from '../services/activityService.js';
import * as alertService from '../services/alertService.js';
import { STORAGE_KEYS } from '../utils/constants.js';
import {
  calculatePercentage,
  formatDate,
  formatTime,
} from '../utils/helpers.js';

const LIVE_REFRESH_MS = 60 * 1000;
const MAX_NO_SPEND_STREAK_LOOKBACK_DAYS = 120;

const buildActionLabel = (action = '') => {
  if (!action) return 'Activity';
  return action
    .replace(/\./g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const DashboardPage = () => {
  const {
    budgets,
    transactions,
    loading,
    error,
    fetchBudgets,
    fetchTransactions,
    createBudget,
    updateBudget,
    deleteBudget,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useBudget();

  const {
    addNotification,
    browserSupported,
    browserPermission,
    requestBrowserPermission,
  } = useNotification();
  const {
    user,
    updatePreferredCurrency,
    alertPreferences,
    updateAlertPreferences,
  } = useAuth();
  const { currency, formatAmount } = useCurrency();

  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionType, setTransactionType] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [lastSyncedAt, setLastSyncedAt] = useState(() => new Date());
  const [isRequestingDesktopAlerts, setIsRequestingDesktopAlerts] =
    useState(false);
  const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false);
  const [isSendingEmailTest, setIsSendingEmailTest] = useState(false);
  const [alertThresholdDraft, setAlertThresholdDraft] = useState(() => ({
    dailyThresholdPercent: Number(alertPreferences?.dailyThresholdPercent ?? 85),
    budgetThresholdPercent: Number(alertPreferences?.budgetThresholdPercent ?? 80),
  }));
  const [activityItems, setActivityItems] = useState([]);
  const [activityLoaded, setActivityLoaded] = useState(false);

  const selectedBudgetId = selectedBudget?._id || null;
  const firstName = (user?.name || '').trim().split(/\s+/)[0] || '';
  const existingCategories = budgets.map((b) => b.category);

  const totalBudgetLimit = budgets.reduce((sum, b) => sum + (Number(b.limit) || 0), 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => sum + (Number(b.spent) || 0), 0);

  const daysInCurrentMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const dayOfMonth = now.getDate();
  const dailyBudgetTarget =
    totalBudgetLimit > 0 ? totalBudgetLimit / daysInCurrentMonth : 0;
  const dailyWarningThreshold = Number(alertPreferences?.dailyThresholdPercent ?? 85);

  const isSameLocalDay = (inputDate, referenceDate) => {
    const date = new Date(inputDate);
    if (Number.isNaN(date.getTime())) return false;
    return (
      date.getFullYear() === referenceDate.getFullYear() &&
      date.getMonth() === referenceDate.getMonth() &&
      date.getDate() === referenceDate.getDate()
    );
  };

  const isSameLocalMonth = (inputDate, referenceDate) => {
    const date = new Date(inputDate);
    if (Number.isNaN(date.getTime())) return false;
    return (
      date.getFullYear() === referenceDate.getFullYear() &&
      date.getMonth() === referenceDate.getMonth()
    );
  };

  const todayExpenseTotal = transactions.reduce((sum, t) => {
    if (t.type !== 'expense') return sum;
    if (!isSameLocalDay(t.date, now)) return sum;
    return sum + (Number(t.amount) || 0);
  }, 0);

  const currentMonthExpenseTotal = transactions.reduce((sum, t) => {
    if (t.type !== 'expense') return sum;
    if (!isSameLocalMonth(t.date, now)) return sum;
    return sum + (Number(t.amount) || 0);
  }, 0);

  const dailySpendPercent = calculatePercentage(todayExpenseTotal, dailyBudgetTarget);
  const dailyRemaining = Math.max(0, dailyBudgetTarget - todayExpenseTotal);
  const isDailyOver = dailyBudgetTarget > 0 && todayExpenseTotal > dailyBudgetTarget;
  const isDailyNear =
    dailyBudgetTarget > 0 &&
    !isDailyOver &&
    dailySpendPercent >= dailyWarningThreshold;

  const expectedSpendByToday = dailyBudgetTarget * dayOfMonth;
  const spendPacePercent = calculatePercentage(
    currentMonthExpenseTotal,
    expectedSpendByToday
  );

  const projectedMonthEndSpend =
    dayOfMonth > 0
      ? (currentMonthExpenseTotal / dayOfMonth) * daysInCurrentMonth
      : currentMonthExpenseTotal;
  const projectedMonthVariance = projectedMonthEndSpend - totalBudgetLimit;
  const isProjectedOverBudget =
    totalBudgetLimit > 0 && projectedMonthVariance > 0;

  const monthDaysRemaining = Math.max(1, daysInCurrentMonth - dayOfMonth);
  const remainingMonthBudget = Math.max(0, totalBudgetLimit - currentMonthExpenseTotal);
  const recommendedDailyCap = remainingMonthBudget / monthDaysRemaining;
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(now.getDate()).padStart(2, '0')}`;

  const largestExpenseToday = transactions.reduce((largest, transaction) => {
    if (transaction.type !== 'expense') return largest;
    if (!isSameLocalDay(transaction.date, now)) return largest;

    return Number(transaction.amount) > Number(largest.amount || 0)
      ? transaction
      : largest;
  }, {});

  const noSpendStreakDays = useMemo(() => {
    const expenseDayKeys = new Set(
      transactions
        .filter((transaction) => transaction.type === 'expense')
        .map((transaction) => {
          const date = new Date(transaction.date);
          if (Number.isNaN(date.getTime())) return null;
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            '0'
          )}-${String(date.getDate()).padStart(2, '0')}`;
        })
        .filter(Boolean)
    );

    let streak = 0;
    const cursor = new Date(now);
    cursor.setHours(0, 0, 0, 0);

    while (streak < MAX_NO_SPEND_STREAK_LOOKBACK_DAYS) {
      const key = `${cursor.getFullYear()}-${String(
        cursor.getMonth() + 1
      ).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;

      if (expenseDayKeys.has(key)) {
        break;
      }

      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }, [todayKey, transactions]);

  const budgetComplianceRate = budgets.length
    ? Math.round(
        (budgets.filter((budget) => {
          const spentPct = calculatePercentage(
            Number(budget.spent) || 0,
            Number(budget.limit) || 0
          );
          return spentPct <= Number(budget.alertThreshold ?? 80);
        }).length /
          budgets.length) *
          100
      )
    : 100;

  const paceScore = Math.max(
    0,
    Math.min(100, Math.round(100 - Math.max(0, spendPacePercent - 100)))
  );
  const dailyScore = isDailyOver ? 40 : isDailyNear ? 70 : 100;
  const financialHealthScore = Math.round(
    budgetComplianceRate * 0.45 + paceScore * 0.35 + dailyScore * 0.2
  );

  let hasCreatedBudgetBefore = false;
  try {
    hasCreatedBudgetBefore =
      typeof window !== 'undefined' &&
      localStorage.getItem(STORAGE_KEYS.HAS_CREATED_BUDGET) === 'true';
  } catch {
    hasCreatedBudgetBefore = false;
  }

  const refreshDashboardData = useCallback(
    async ({ loadTransactionsIfNoBudgets = false } = {}) => {
      const loadedBudgets = await fetchBudgets();
      const jobs = [];
      if (loadedBudgets.length > 0 || loadTransactionsIfNoBudgets) {
        jobs.push(fetchTransactions());
      }
      jobs.push(
        activityService
          .getRecentActivities({ limit: 15 })
          .then((response) => {
            setActivityItems(response.data || []);
            setActivityLoaded(true);
          })
          .catch(() => {
            setActivityLoaded(true);
          })
      );
      await Promise.all(jobs);
      setLastSyncedAt(new Date());
      return loadedBudgets;
    },
    [fetchBudgets, fetchTransactions]
  );

  useEffect(() => {
    refreshDashboardData();
  }, [refreshDashboardData]);

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      clearInterval(clockInterval);
    };
  }, []);

  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      await refreshDashboardData();
    }, LIVE_REFRESH_MS);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [refreshDashboardData]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await refreshDashboardData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshDashboardData]);

  useEffect(() => {
    if (!budgets.length) return;

    try {
      const pendingBudgetId = localStorage.getItem(
        STORAGE_KEYS.PENDING_TX_BUDGET_ID
      );
      if (!pendingBudgetId) return;

      const pendingBudget = budgets.find((b) => b._id === pendingBudgetId);
      if (pendingBudget) {
        setSelectedBudget(pendingBudget);
        setActiveTab('transactions');
      }
      localStorage.removeItem(STORAGE_KEYS.PENDING_TX_BUDGET_ID);
    } catch {
      // ignore localStorage errors
    }
  }, [budgets, fetchTransactions]);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchTransactions().then(() => {
        setLastSyncedAt(new Date());
      });
    }
  }, [activeTab, fetchTransactions]);

  useEffect(() => {
    if (activeTab !== 'transactions') return;
    if (selectedBudget) return;
    if (!budgets.length) return;
    setSelectedBudget(budgets[0]);
  }, [activeTab, selectedBudget, budgets]);

  useEffect(() => {
    setAlertThresholdDraft({
      dailyThresholdPercent: Number(alertPreferences?.dailyThresholdPercent ?? 85),
      budgetThresholdPercent: Number(alertPreferences?.budgetThresholdPercent ?? 80),
    });
  }, [
    alertPreferences?.dailyThresholdPercent,
    alertPreferences?.budgetThresholdPercent,
  ]);

  const triggerBudgetThresholdEmail = useCallback(
    async (budget, spentPercent, dailyExceeded = false, overBy = 0) => {
      if (!alertPreferences?.emailEnabled) return;
      if (!budget?._id) return;

      try {
        await alertService.sendBudgetThresholdEmailAlert({
          budgetId: budget._id,
          spentPercent,
          dailyExceeded,
          overBy,
        });
      } catch {
        // Keep UI flow smooth even if email channel is unavailable.
      }
    },
    [alertPreferences?.emailEnabled]
  );

  useEffect(() => {
    if (!budgets.length) return;

    const readFlag = (key) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return '1';
      }
    };

    const writeFlag = (key) => {
      try {
        localStorage.setItem(key, '1');
      } catch {
        // ignore localStorage errors
      }
    };

    for (const budget of budgets) {
      const limit = Number(budget.limit) || 0;
      const spent = Number(budget.spent) || 0;
      if (limit <= 0) continue;

      const threshold = Number(
        budget.alertThreshold ?? alertPreferences?.budgetThresholdPercent ?? 80
      );
      const spentPct = calculatePercentage(spent, limit);

      const nearKey = `bb_warn_budget_near_${todayKey}_${budget._id}`;
      const overKey = `bb_warn_budget_over_${todayKey}_${budget._id}`;

      if (spentPct >= 100) {
        if (!readFlag(overKey)) {
          void triggerBudgetThresholdEmail(budget, spentPct, false, spent - limit);
          addNotification(
            `Budget "${budget.category}" is over by ${formatAmount(
              spent - limit
            )}.`,
            'error',
            6500
          );
          writeFlag(overKey);
        }
      } else if (spentPct >= threshold) {
        if (!readFlag(nearKey)) {
          void triggerBudgetThresholdEmail(budget, spentPct);
          addNotification(
            `Budget "${budget.category}" reached ${spentPct}% of limit.`,
            'warning',
            5500
          );
          writeFlag(nearKey);
        }
      }
    }

    if (dailyBudgetTarget > 0) {
      const dailyNearKey = `bb_warn_daily_near_${todayKey}`;
      const dailyOverKey = `bb_warn_daily_over_${todayKey}`;

      if (todayExpenseTotal > dailyBudgetTarget) {
        if (!readFlag(dailyOverKey)) {
          addNotification(
            `Daily spending cap exceeded by ${formatAmount(
              todayExpenseTotal - dailyBudgetTarget
            )}.`,
            'error',
            7000
          );
          writeFlag(dailyOverKey);
        }
      } else if (dailySpendPercent >= dailyWarningThreshold) {
        if (!readFlag(dailyNearKey)) {
          addNotification(
            `Daily spend is at ${dailySpendPercent}% of today's cap.`,
            'warning',
            5500
          );
          writeFlag(dailyNearKey);
        }
      }
    }
  }, [
    budgets,
    todayKey,
    addNotification,
    formatAmount,
    triggerBudgetThresholdEmail,
    dailyBudgetTarget,
    dailySpendPercent,
    dailyWarningThreshold,
    todayExpenseTotal,
    alertPreferences?.budgetThresholdPercent,
  ]);

  const refreshTransactions = async () => {
    await fetchTransactions();
    setLastSyncedAt(new Date());
  };

  const handleCurrencyQuickChange = async (event) => {
    const nextCurrency = event.target.value;
    if (!nextCurrency || nextCurrency === currency) return;

    setIsUpdatingPreferences(true);
    const result = await updatePreferredCurrency(nextCurrency);
    setIsUpdatingPreferences(false);

    if (result.success) {
      addNotification(`Currency switched to ${nextCurrency}.`, 'success');
      return;
    }

    addNotification(result.message || 'Failed to update currency.', 'error');
  };

  const handleEmailAlertsToggle = async (event) => {
    const emailEnabled = event.target.checked;
    setIsUpdatingPreferences(true);
    const result = await updateAlertPreferences({
      ...alertPreferences,
      emailEnabled,
    });
    setIsUpdatingPreferences(false);

    if (result.success) {
      addNotification(
        emailEnabled
          ? 'Email alerts enabled.'
          : 'Email alerts disabled.',
        'success'
      );
      return;
    }

    addNotification(result.message || 'Failed to update alert preferences.', 'error');
  };

  const handleAlertThresholdDraftChange = (field) => (event) => {
    const nextValue = Number(event.target.value);
    if (!Number.isFinite(nextValue)) return;

    setAlertThresholdDraft((previous) => ({
      ...previous,
      [field]: Math.min(100, Math.max(50, nextValue)),
    }));
  };

  const handleSaveAlertThresholds = async () => {
    const dailyThresholdPercent = Math.min(
      100,
      Math.max(50, Number(alertThresholdDraft.dailyThresholdPercent) || 85)
    );
    const budgetThresholdPercent = Math.min(
      100,
      Math.max(50, Number(alertThresholdDraft.budgetThresholdPercent) || 80)
    );

    setIsUpdatingPreferences(true);
    const result = await updateAlertPreferences({
      ...alertPreferences,
      dailyThresholdPercent,
      budgetThresholdPercent,
    });
    setIsUpdatingPreferences(false);

    if (result.success) {
      addNotification('Alert thresholds updated.', 'success');
      return;
    }

    addNotification(result.message || 'Failed to update alert thresholds.', 'error');
  };

  const handleSendTestEmail = async () => {
    setIsSendingEmailTest(true);
    try {
      await alertService.sendTestEmailAlert();
      addNotification('Test email alert sent.', 'success');
    } catch (error) {
      addNotification(
        error.message ||
          'Test email could not be sent. Enable email alerts first.',
        'error'
      );
    } finally {
      setIsSendingEmailTest(false);
    }
  };

  const handleEnableDesktopAlerts = async () => {
    if (browserPermission === 'granted') {
      addNotification('Desktop alerts are already enabled.', 'info');
      return;
    }

    setIsRequestingDesktopAlerts(true);
    const result = await requestBrowserPermission();
    setIsRequestingDesktopAlerts(false);

    if (result.success) {
      addNotification('Desktop alerts enabled.', 'success');
      return;
    }

    if (result.status === 'denied') {
      addNotification(
        'Desktop alerts were blocked. You can enable notifications in your browser settings.',
        'warning',
        7000
      );
      return;
    }

    addNotification('Desktop alerts are not supported in this browser.', 'info');
  };

  const handleCreateTransaction = async (data) => {
    const result = await createTransaction(data);
    if (result.success) {
      addNotification('Transaction added successfully.', 'success');
      setShowTransactionForm(false);
      await refreshTransactions();
    } else {
      addNotification(result.message || 'Failed to create transaction', 'error');
    }
  };

  const handleUpdateTransaction = async (data) => {
    const result = await updateTransaction(editingTransaction._id, data);
    if (result.success) {
      addNotification('Transaction updated successfully.', 'success');
      setShowTransactionForm(false);
      setEditingTransaction(null);
      await refreshTransactions();
    } else {
      addNotification(result.message || 'Failed to update transaction', 'error');
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    const result = await deleteTransaction(transactionId);
    if (result.success) {
      addNotification('Transaction deleted successfully.', 'success');
      await refreshTransactions();
    } else {
      addNotification(result.message || 'Failed to delete transaction', 'error');
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleCreateBudget = async (data) => {
    const result = await createBudget(data);
    if (result.success) {
      addNotification('Budget created successfully.', 'success');
      setShowBudgetForm(false);
      setEditingBudget(null);
    } else {
      addNotification(result.message || 'Failed to create budget', 'error');
    }
  };

  const handleUpdateBudget = async (data) => {
    const result = await updateBudget(editingBudget._id, data);
    if (result.success) {
      addNotification('Budget updated successfully.', 'success');
      setShowBudgetForm(false);
      setEditingBudget(null);
      if (selectedBudgetId === result.data?._id) {
        setSelectedBudget(result.data);
      }
    } else {
      addNotification(result.message || 'Failed to update budget', 'error');
    }
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setShowBudgetForm(true);
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!window.confirm('Delete this budget and all its transactions?')) {
      return;
    }

    const result = await deleteBudget(budgetId);
    if (result.success) {
      addNotification('Budget deleted successfully.', 'success');
      if (selectedBudgetId === budgetId) {
        setSelectedBudget(null);
        await fetchTransactions();
      }
    } else {
      addNotification(result.message || 'Failed to delete budget', 'error');
    }
  };

  const handleSelectBudgetForTransaction = (budget) => {
    setSelectedBudget(budget);
    setActiveTab('transactions');
  };

  const handleBudgetFilterChange = (budgetId) => {
    if (!budgetId) {
      setSelectedBudget(null);
      return;
    }

    const budget = budgets.find((b) => b._id === budgetId) || null;
    setSelectedBudget(budget);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const transactionBudgetId =
        typeof t.budgetId === 'string' ? t.budgetId : t.budgetId?._id;

      if (selectedBudgetId && transactionBudgetId !== selectedBudgetId) {
        return false;
      }

      if (transactionType !== 'all' && t.type !== transactionType) return false;

      if (transactionSearch) {
        const haystack = `${t.description} ${t.notes || ''}`.toLowerCase();
        if (!haystack.includes(transactionSearch.toLowerCase())) return false;
      }

      if (minAmount && Number(t.amount) < Number(minAmount)) return false;
      if (maxAmount && Number(t.amount) > Number(maxAmount)) return false;

      return true;
    });
  }, [
    transactions,
    selectedBudgetId,
    transactionType,
    transactionSearch,
    minAmount,
    maxAmount,
  ]);

  const handleExportCsv = () => {
    if (!filteredTransactions.length) return;

    const header = [
      'Date',
      'Description',
      'Category',
      'Type',
      'Amount',
      'Payment Method',
      'Notes',
    ];

    const rows = filteredTransactions.map((t) => [
      new Date(t.date).toISOString(),
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.budgetId?.category || '').replace(/"/g, '""')}"`,
      t.type,
      t.amount,
      t.paymentMethod || '',
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const paceLabel =
    spendPacePercent > 110
      ? 'Above healthy pace'
      : spendPacePercent < 90
        ? 'Below projected pace'
        : 'On expected pace';

  const operatingStatus =
    isDailyOver || isProjectedOverBudget
      ? 'At risk'
      : isDailyNear
        ? 'Watch closely'
        : 'On track';

  const thresholdDraftDirty =
    Number(alertThresholdDraft.dailyThresholdPercent) !==
      Number(alertPreferences?.dailyThresholdPercent ?? 85) ||
    Number(alertThresholdDraft.budgetThresholdPercent) !==
      Number(alertPreferences?.budgetThresholdPercent ?? 80);

  const nextMove =
    totalBudgetLimit <= 0
      ? 'Create category budgets to activate forecasting and alerts.'
      : isDailyOver
        ? `Pause discretionary spending and keep the next entries below ${formatAmount(
            recommendedDailyCap
          )}.`
        : isProjectedOverBudget
          ? `Reduce average daily spend by ${formatAmount(
              Math.abs(projectedMonthVariance) / Math.max(1, monthDaysRemaining)
            )} for the rest of the month.`
          : `Keep today below ${formatAmount(
              dailyBudgetTarget
            )} and maintain your month-end projection.`;

  return (
    <AppShell
      mobileTitle={firstName ? `Hi, ${firstName}` : 'Overview'}
      mobileSubtitle={`Synced ${formatTime(lastSyncedAt)}`}
    >
      <div className="space-y-5 lg:space-y-6">
        {/* Desktop title row */}
        <div className="hidden lg:flex lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="bb-page-title">Overview</h1>
            <p className="bb-page-sub">
              {formatDate(now, 'full')} / {currency} / {operatingStatus}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="bb-btn-primary"
              onClick={() => {
                setEditingBudget(null);
                setShowBudgetForm(true);
              }}
            >
              New budget
            </button>
            {selectedBudget && (
              <button
                type="button"
                className="bb-btn-secondary"
                onClick={() => {
                  setEditingTransaction(null);
                  setShowTransactionForm(true);
                }}
              >
                New transaction
              </button>
            )}
          </div>
        </div>

        <section className="bb-hero-strip">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-[#d7f86f]">
                {operatingStatus}
              </p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight lg:text-3xl">
                {formatAmount(remainingMonthBudget)} available for the month
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#b8c9c1]">
                {nextMove}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 lg:gap-3">
              <div className="rounded-[8px] bg-white/8 p-3 ring-1 ring-white/10">
                <span className="bb-hero-metric-label">Today</span>
                <span className="bb-hero-metric-value mt-1 block">{formatAmount(todayExpenseTotal)}</span>
              </div>
              <div className="rounded-[8px] bg-white/8 p-3 ring-1 ring-white/10">
                <span className="bb-hero-metric-label">Used</span>
                <span className="bb-hero-metric-value mt-1 block">{formatAmount(totalBudgetSpent)}</span>
              </div>
              <div className="rounded-[8px] bg-[#d7f86f] p-3 text-[#071b16]">
                <span className="text-[11px] font-semibold text-[#405229]">Health</span>
                <span className="mt-1 block text-lg font-semibold tabular-nums">{financialHealthScore}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile: horizontal chips */}
        <div className="bb-metric-scroll">
          <div className="bb-metric-chip">
            <p className="text-xs text-[#64716d]">Daily cap</p>
            <p className="text-base font-semibold tabular-nums mt-0.5">{formatAmount(dailyBudgetTarget)}</p>
          </div>
          <div className="bb-metric-chip">
            <p className="bb-metric-cell-label">Month pace</p>
            <p className="text-base font-semibold tabular-nums mt-0.5">{spendPacePercent}%</p>
          </div>
          <div className="bb-metric-chip">
            <p className="bb-metric-cell-label">Projected</p>
            <p className="text-base font-semibold tabular-nums mt-0.5">{formatAmount(projectedMonthEndSpend)}</p>
          </div>
        </div>

        <section className="bb-metric-bar">
          <div className="bb-metric-cell">
            <p className="bb-metric-cell-label">Total budget</p>
            <p className="bb-metric-cell-value">{formatAmount(totalBudgetLimit)}</p>
          </div>
          <div className="bb-metric-cell">
            <p className="bb-metric-cell-label">Today</p>
            <p className="bb-metric-cell-value">{formatAmount(todayExpenseTotal)}</p>
          </div>
          <div className="bb-metric-cell">
            <p className="bb-metric-cell-label">Month pace</p>
            <p className="bb-metric-cell-value">{spendPacePercent}%</p>
            <p className="mt-1 text-xs text-[#64716d]">{paceLabel}</p>
          </div>
          <div className="bb-metric-cell">
            <p className="bb-metric-cell-label">Health score</p>
            <p className="bb-metric-cell-value">{financialHealthScore}</p>
          </div>
        </section>

        <DashboardPreferences
          currency={currency}
          onCurrencyChange={handleCurrencyQuickChange}
          isUpdatingPreferences={isUpdatingPreferences}
          alertPreferences={alertPreferences}
          alertThresholdDraft={alertThresholdDraft}
          onAlertThresholdChange={handleAlertThresholdDraftChange}
          onEmailToggle={handleEmailAlertsToggle}
          onSaveThresholds={handleSaveAlertThresholds}
          onSendTestEmail={handleSendTestEmail}
          isSendingEmailTest={isSendingEmailTest}
          thresholdDirty={thresholdDraftDirty}
          browserSupported={browserSupported}
          browserPermission={browserPermission}
          onEnableDesktopAlerts={handleEnableDesktopAlerts}
          isRequestingDesktopAlerts={isRequestingDesktopAlerts}
        />

        {error && <div className="bb-alert-error">{error}</div>}

        {loading && budgets.length === 0 ? (
          <LoadingSpinner fullScreen={false} message="Loading your dashboard..." />
        ) : budgets.length === 0 ? (
          <div className="bb-premium-card p-10 text-center">
            <p className="text-sm font-medium text-[#10201b]">
              {hasCreatedBudgetBefore ? 'No active budgets' : 'Get started'}
            </p>
              <p className="text-xs text-[#64716d] mt-2 max-w-sm mx-auto">
              Create your first category budget to track spending.
            </p>
            <button
              type="button"
              className="bb-btn-primary mt-6"
              onClick={() => {
                setEditingBudget(null);
                setShowBudgetForm(true);
              }}
            >
              Create budget
            </button>
          </div>
        ) : (
          <>
            <div className="bb-segmented lg:hidden">
              <button
                type="button"
                className={`bb-segment ${activeTab === 'overview' ? 'bb-segment-active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                type="button"
                className={`bb-segment ${activeTab === 'transactions' ? 'bb-segment-active' : ''}`}
                onClick={() => setActiveTab('transactions')}
              >
                Transactions
              </button>
            </div>

            <div className="hidden lg:inline-flex w-fit gap-1 rounded-[8px] bg-[#e4ebe5] p-1">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`rounded-[6px] px-4 py-2 text-sm font-semibold ${
                  activeTab === 'overview'
                    ? 'bg-white text-[#10201b] shadow-sm'
                    : 'text-[#64716d]'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('transactions')}
                className={`rounded-[6px] px-4 py-2 text-sm font-semibold ${
                  activeTab === 'transactions'
                    ? 'bg-white text-[#10201b] shadow-sm'
                    : 'text-[#64716d]'
                }`}
              >
                Transactions
              </button>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-5 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px] lg:gap-6 lg:items-start">
                <div className="space-y-5 min-w-0">
                  <BudgetList
                    budgets={budgets}
                    loading={loading}
                    onEdit={handleEditBudget}
                    onDelete={handleDeleteBudget}
                    onSelectTransaction={handleSelectBudgetForTransaction}
                  />
                </div>
                <section className="bb-premium-card lg:sticky lg:top-6 min-w-0 p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="bb-section-title">Activity stream</h2>
                      <p className="bb-section-subtitle">Latest movement across budgets.</p>
                    </div>
                    <span className="rounded-[6px] bg-[#edf5ef] px-2.5 py-1 text-xs font-semibold text-[#07885b]">
                      Live
                    </span>
                  </div>
                  <ActivityFeed
                    items={activityItems}
                    loaded={activityLoaded}
                    formatActionLabel={buildActionLabel}
                  />
                </section>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="space-y-4">
                <section className="bb-premium-card p-4 space-y-3">
                  <p className="text-sm text-[#42524d]">
                    Filter: <strong>{selectedBudget?.category || 'All categories'}</strong>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                    <select
                      className="bb-select"
                      value={selectedBudgetId || ''}
                      onChange={(e) => handleBudgetFilterChange(e.target.value)}
                    >
                      <option value="">All budgets</option>
                      {budgets.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.category}
                        </option>
                      ))}
                    </select>
                    <select
                      className="bb-select"
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value)}
                    >
                      <option value="all">All types</option>
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                    <input
                      className="bb-input"
                      placeholder="Search"
                      value={transactionSearch}
                      onChange={(e) => setTransactionSearch(e.target.value)}
                    />
                    <input
                      className="bb-input"
                      type="number"
                      placeholder="Min"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                    />
                    <input
                      className="bb-input"
                      type="number"
                      placeholder="Max"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="bb-btn-primary bb-btn-sm"
                      disabled={!selectedBudgetId}
                      onClick={() => {
                        setEditingTransaction(null);
                        setShowTransactionForm(true);
                      }}
                    >
                      Add
                    </button>
                    <button type="button" className="bb-btn-secondary bb-btn-sm" onClick={handleExportCsv}>
                      Export
                    </button>
                  </div>
                </section>

                <section className="bb-premium-card">
                  <TransactionList
                    transactions={filteredTransactions}
                    loading={loading}
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
                  />
                </section>
              </div>
            )}
          </>
        )}
      </div>

      <BudgetForm
        isOpen={showBudgetForm}
        budget={editingBudget}
        onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget}
        onClose={() => {
          setShowBudgetForm(false);
          setEditingBudget(null);
        }}
        existingCategories={existingCategories}
      />

      {selectedBudget && (
        <TransactionForm
          isOpen={showTransactionForm}
          budget={selectedBudget}
          transaction={editingTransaction}
          onSubmit={
            editingTransaction ? handleUpdateTransaction : handleCreateTransaction
          }
          onClose={() => {
            setShowTransactionForm(false);
            setEditingTransaction(null);
          }}
        />
      )}
    </AppShell>
  );
};

export default DashboardPage;
