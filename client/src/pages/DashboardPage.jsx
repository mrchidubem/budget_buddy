import React from 'react';
/**
 * Dashboard Page
 * Main page displaying budgets and transactions
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '../components/common/Header.jsx';
import BudgetStats from '../components/budget/BudgetStats.jsx';
import BudgetList from '../components/budget/BudgetList.jsx';
import BudgetForm from '../components/budget/BudgetForm.jsx';
import TransactionForm from '../components/transaction/TransactionForm.jsx';
import TransactionList from '../components/transaction/TransactionList.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import Summary from '../components/dashboard/Summary.jsx';
import Footer from '../components/common/Footer.jsx';
import { useBudget } from '../hooks/useBudget.js';
import { useNotification } from '../hooks/useNotification.js';
import { useAuth } from '../hooks/useAuth.js';
import { useCurrency } from '../hooks/useCurrency.js';
import * as activityService from '../services/activityService.js';
import * as alertService from '../services/alertService.js';
import { STORAGE_KEYS, SUPPORTED_CURRENCIES } from '../utils/constants.js';
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

const getActionTone = (action = '') => {
  const normalized = action.toLowerCase();
  if (normalized.includes('delete') || normalized.includes('logout')) {
    return 'bg-red-50 text-red-700 border-red-200';
  }
  if (normalized.includes('create') || normalized.includes('register')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (normalized.includes('update')) {
    return 'bg-amber-50 text-amber-800 border-amber-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
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

  const paceTone =
    spendPacePercent > 110
      ? 'text-danger-700'
      : spendPacePercent < 90
        ? 'text-emerald-700'
        : 'text-slate-700';

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
    <div className="min-h-screen">
      <Header />

      <main className="bb-page-shell space-y-8">
        <section className="relative overflow-hidden rounded-2xl border border-slate-700 bg-[linear-gradient(140deg,_#0b1220_0%,_#111827_58%,_#1f2937_100%)] text-slate-100 shadow-xl">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_8%_0%,_#22c55e_0,_transparent_25%),radial-gradient(circle_at_95%_10%,_#38bdf8_0,_transparent_22%)]" />
          <div className="absolute inset-0 opacity-[0.12] bb-grid-bg" />
          <div className="relative px-6 py-6 sm:px-8 md:px-10 md:py-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Performance Desk
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                {firstName
                  ? `${firstName}, financial command view`
                  : 'Financial command view'}
              </h1>
              <p className="mt-3 text-sm text-slate-300 max-w-xl">
                Position, pace, and risk signals in one view.
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5 text-[11px]">
                <span className="bb-pill bg-white/10 text-slate-100 border border-white/15">
                  Sync: {formatTime(lastSyncedAt)}
                </span>
                <span className="bb-pill bg-white/10 text-slate-100 border border-white/15">
                  Alerts:{' '}
                  {browserSupported
                    ? browserPermission === 'granted'
                      ? 'on'
                      : 'off'
                    : 'unsupported'}
                </span>
                <span className="bb-pill bg-white/10 text-slate-100 border border-white/15">
                  TZ: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </span>
                <span className="bb-pill bg-white/10 text-slate-100 border border-white/15">
                  Currency: {currency}
                </span>
              </div>
            </div>

            <div className="w-full lg:w-auto lg:min-w-[290px] space-y-3">
              <div className="rounded-xl bg-white/8 border border-white/15 text-slate-100 p-4 shadow-md">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  Live Time
                </p>
                <p className="mt-1 text-3xl font-extrabold leading-none">
                  {formatTime(now)}
                </p>
                <p className="mt-1 text-xs text-slate-300">{formatDate(now, 'full')}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setEditingBudget(null);
                    setShowBudgetForm(true);
                  }}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white text-slate-900 text-xs sm:text-sm font-semibold hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 focus:ring-offset-slate-900/0 transition"
                >
                  New Plan
                </button>

                {selectedBudget && (
                  <button
                    onClick={() => {
                      setEditingTransaction(null);
                      setShowTransactionForm(true);
                    }}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-white/30 bg-white/10 text-xs sm:text-sm font-semibold text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 focus:ring-offset-slate-900/0 transition"
                  >
                    New Entry
                  </button>
                )}

                {browserSupported && browserPermission !== 'granted' && (
                  <button
                    onClick={handleEnableDesktopAlerts}
                    disabled={isRequestingDesktopAlerts}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-amber-300/60 bg-amber-400/10 text-xs sm:text-sm font-semibold text-amber-100 hover:bg-amber-400/20 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-900/0 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isRequestingDesktopAlerts ? 'Enabling...' : 'Enable Alerts'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <article className="bb-surface rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Currency
            </p>
            <select
              value={currency}
              onChange={handleCurrencyQuickChange}
              disabled={isUpdatingPreferences}
              className="mt-3 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 outline-none text-sm bg-white disabled:opacity-60"
            >
              {SUPPORTED_CURRENCIES.map((currencyOption) => (
                <option key={currencyOption.code} value={currencyOption.code}>
                  {currencyOption.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              This controls how all amounts are displayed across pages.
            </p>
          </article>

          <article className="bb-surface rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Alert Channels
            </p>
            <p className="mt-2 text-sm text-slate-700">
              In-app alerts are active. Desktop alerts depend on browser permission.
            </p>
            <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={Boolean(alertPreferences?.emailEnabled)}
                onChange={handleEmailAlertsToggle}
                disabled={isUpdatingPreferences}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-emerald-300"
              />
              Enable email alerts
            </label>
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={!alertPreferences?.emailEnabled || isSendingEmailTest}
              className="mt-3 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingEmailTest ? 'Sending test...' : 'Send test email'}
            </button>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-slate-600">
                Daily cap alert (%)
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={alertThresholdDraft.dailyThresholdPercent}
                  onChange={handleAlertThresholdDraftChange(
                    'dailyThresholdPercent'
                  )}
                  className="mt-1 w-full px-2.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 outline-none"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Budget alert (%)
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={alertThresholdDraft.budgetThresholdPercent}
                  onChange={handleAlertThresholdDraftChange(
                    'budgetThresholdPercent'
                  )}
                  className="mt-1 w-full px-2.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 outline-none"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={handleSaveAlertThresholds}
              disabled={!thresholdDraftDirty || isUpdatingPreferences}
              className="mt-3 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save alert thresholds
            </button>
            <p className="mt-2 text-[11px] text-slate-500">
              Email alerts are currently simulated in server logs in this build.
            </p>
          </article>

          <article className="bb-surface rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Action Guide
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Status:{' '}
              <span className="font-bold text-slate-900">{operatingStatus}</span>
            </p>
            <p className="mt-2 text-sm text-slate-700">{nextMove}</p>
          </article>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <article className="bb-surface rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Daily Spending Cap
            </p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {formatAmount(dailyBudgetTarget)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Suggested maximum to spend today. This is a spending target, not a savings goal.
            </p>
          </article>

          <article className="bb-surface rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Today's Spend
            </p>
            <p
              className={`mt-2 text-2xl font-extrabold ${
                isDailyOver
                  ? 'text-danger-700'
                  : isDailyNear
                    ? 'text-warning-700'
                    : 'text-slate-900'
              }`}
            >
              {formatAmount(todayExpenseTotal)}
            </p>
            <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full ${
                  isDailyOver
                    ? 'bg-danger-500'
                    : isDailyNear
                      ? 'bg-warning-500'
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(dailySpendPercent, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {isDailyOver
                ? `Over target by ${formatAmount(
                    todayExpenseTotal - dailyBudgetTarget
                  )}`
                : `${dailySpendPercent}% used, ${formatAmount(
                    dailyRemaining
                  )} remaining`}
            </p>
          </article>

          <article className="bb-surface rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Month Pace
            </p>
            <p className={`mt-2 text-2xl font-extrabold ${paceTone}`}>
              {spendPacePercent}%
            </p>
            <p className="mt-1 text-xs text-slate-500">{paceLabel}</p>
            <p className="mt-2 text-xs text-slate-500">
              Current month spend: {formatAmount(currentMonthExpenseTotal)}
            </p>
          </article>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <article className="bb-surface rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Financial Health Score
            </p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              {financialHealthScore}
              <span className="text-sm font-semibold text-slate-500"> / 100</span>
            </p>
            <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full ${
                  financialHealthScore >= 80
                    ? 'bg-emerald-500'
                    : financialHealthScore >= 60
                      ? 'bg-amber-500'
                      : 'bg-danger-500'
                }`}
                style={{ width: `${financialHealthScore}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Uses budget discipline, monthly pace, and today's risk.
            </p>
          </article>

          <article className="bb-surface rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Projected Month-End
            </p>
            <p
              className={`mt-2 text-2xl font-extrabold ${
                isProjectedOverBudget ? 'text-danger-700' : 'text-emerald-700'
              }`}
            >
              {formatAmount(projectedMonthEndSpend)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {totalBudgetLimit > 0
                ? isProjectedOverBudget
                  ? `Projected over by ${formatAmount(projectedMonthVariance)}`
                  : `Projected under by ${formatAmount(
                      Math.abs(projectedMonthVariance)
                    )}`
                : 'Create budgets to enable projection tracking'}
            </p>
          </article>

          <article className="bb-surface rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Recommended Daily Cap
            </p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {formatAmount(recommendedDailyCap)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              To stay on target for the next {monthDaysRemaining} day
              {monthDaysRemaining > 1 ? 's' : ''}.
            </p>
          </article>

          <article className="bb-surface rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Smart Signals
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Largest expense today:{' '}
              <span className="font-bold text-slate-900">
                {largestExpenseToday.amount
                  ? `${largestExpenseToday.description || 'Expense'} (${formatAmount(
                      largestExpenseToday.amount
                    )})`
                  : 'No expenses logged today'}
              </span>
            </p>
            <p className="mt-2 text-sm text-slate-700">
              No-spend streak:{' '}
              <span className="font-bold text-slate-900">
                {noSpendStreakDays} day{noSpendStreakDays === 1 ? '' : 's'}
              </span>
            </p>
          </article>
        </section>

        {error && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg">
            {error}
          </div>
        )}

        {loading && budgets.length === 0 ? (
          <LoadingSpinner fullScreen={false} message="Loading your dashboard..." />
        ) : budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
              {hasCreatedBudgetBefore
                ? 'No active budgets'
                : 'Welcome to Budget Buddy'}
            </h2>
            <p className="text-lg text-slate-600 mb-8 text-center max-w-xl">
              {hasCreatedBudgetBefore
                ? 'You currently have no budgets set up. Create a new budget to continue tracking your spending.'
                : 'Create your first budget category to activate live tracking and daily warning intelligence.'}
            </p>
            <button
              onClick={() => {
                setEditingBudget(null);
                setShowBudgetForm(true);
              }}
              className="px-8 py-4 bg-slate-900 text-white text-xl font-bold rounded-lg shadow-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 transition"
            >
              {hasCreatedBudgetBefore
                ? 'Create Budget'
                : 'Create Your First Budget'}
            </button>
          </div>
        ) : (
          <>
            <div className="flex space-x-4 mb-8 border-b border-slate-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 font-medium border-b-2 transition ${
                  activeTab === 'overview'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-4 py-2 font-medium border-b-2 transition ${
                  activeTab === 'transactions'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Transactions
              </button>
            </div>

            {activeTab === 'overview' && (
              <>
                <BudgetStats budgets={budgets} />

                {existingCategories.length < 8 && (
                  <button
                    onClick={() => {
                      setEditingBudget(null);
                      setShowBudgetForm(true);
                    }}
                    className="mb-8 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium"
                  >
                    Create New Budget
                  </button>
                )}

                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Your Budgets
                </h2>
                <BudgetList
                  budgets={budgets}
                  loading={loading}
                  onEdit={handleEditBudget}
                  onDelete={handleDeleteBudget}
                  onSelectTransaction={handleSelectBudgetForTransaction}
                />

                <div className="mt-12 pt-8 border-t border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    Summary
                  </h2>
                  <Summary budgets={budgets} transactions={transactions} />
                </div>

                <div className="mt-12 pt-8 border-t border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    Activity Timeline
                  </h2>
                  <div className="bb-surface rounded-2xl p-5">
                    {!activityLoaded ? (
                      <p className="text-sm text-slate-500">Loading activity timeline...</p>
                    ) : activityItems.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No activity logged yet. Actions will appear here in real time.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {activityItems.slice(0, 10).map((item) => {
                          const amountValue = Number(item.metadata?.amount);
                          const hasAmount = Number.isFinite(amountValue) && amountValue > 0;
                          return (
                            <article
                              key={item._id}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-900">
                                  {item.summary || buildActionLabel(item.action)}
                                </p>
                                <span
                                  className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getActionTone(
                                    item.action
                                  )}`}
                                >
                                  {buildActionLabel(item.action)}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <span>
                                  {formatDate(item.createdAt)} at {formatTime(item.createdAt)}
                                </span>
                                {hasAmount && (
                                  <span className="font-semibold text-slate-700">
                                    {formatAmount(amountValue)}
                                  </span>
                                )}
                                {item.metadata?.category && (
                                  <span className="bb-pill bg-slate-100 text-slate-700 border border-slate-200">
                                    {item.metadata.category}
                                  </span>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <div className="bb-surface rounded-lg p-4 sm:p-5 space-y-4">
                  <p className="text-sm text-slate-600">
                    You are viewing transactions for{' '}
                    <span className="font-semibold text-slate-900">
                      {selectedBudget?.category || 'all budgets'}
                    </span>
                    . Choose a budget to add a new transaction quickly.
                  </p>
                  <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
                    <div className="w-full lg:max-w-sm">
                      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                        Budget filter
                      </label>
                      <select
                        value={selectedBudgetId || ''}
                        onChange={(e) => handleBudgetFilterChange(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 outline-none text-sm bg-white"
                      >
                        <option value="">All budgets</option>
                        {budgets.map((budget) => (
                          <option key={budget._id} value={budget._id}>
                            {budget.category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedBudgetId) return;
                          setEditingTransaction(null);
                          setShowTransactionForm(true);
                        }}
                        disabled={!selectedBudgetId}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        New Transaction
                      </button>
                      <button
                        type="button"
                        onClick={handleExportCsv}
                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-100"
                      >
                        Export CSV
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={transactionSearch}
                      onChange={(e) => setTransactionSearch(e.target.value)}
                      placeholder="Search description or notes"
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 outline-none text-sm"
                    />
                    <select
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 outline-none text-sm bg-white"
                    >
                      <option value="all">All types</option>
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      placeholder="Min amount"
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 outline-none text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      placeholder="Max amount"
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 outline-none text-sm"
                    />
                  </div>
                </div>

                <TransactionList
                  transactions={filteredTransactions}
                  loading={loading}
                  onEdit={handleEditTransaction}
                  onDelete={handleDeleteTransaction}
                />
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

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
    </div>
  );
};

export default DashboardPage;
