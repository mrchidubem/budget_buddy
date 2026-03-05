/**
 * Budget Context
 * Provides global budget and transaction state management
 * Uses useReducer for handling complex state updates
 */

import React, { createContext, useReducer, useCallback } from 'react';
import * as budgetService from '../services/budgetService.js';
import * as transactionService from '../services/transactionService.js';
import { STORAGE_KEYS } from '../utils/constants.js';

// Create context
export const BudgetContext = createContext();

// Initial state
const initialState = {
  budgets: [],
  transactions: [],
  selectedBudget: null,
  loading: false,
  error: null,
};

// Action types
const ACTIONS = {
  // Budget actions
  FETCH_BUDGETS_START: 'FETCH_BUDGETS_START',
  FETCH_BUDGETS_SUCCESS: 'FETCH_BUDGETS_SUCCESS',
  FETCH_BUDGETS_ERROR: 'FETCH_BUDGETS_ERROR',
  CREATE_BUDGET_SUCCESS: 'CREATE_BUDGET_SUCCESS',
  UPDATE_BUDGET_SUCCESS: 'UPDATE_BUDGET_SUCCESS',
  DELETE_BUDGET_SUCCESS: 'DELETE_BUDGET_SUCCESS',

  // Transaction actions
  FETCH_TRANSACTIONS_START: 'FETCH_TRANSACTIONS_START',
  FETCH_TRANSACTIONS_SUCCESS: 'FETCH_TRANSACTIONS_SUCCESS',
  FETCH_TRANSACTIONS_ERROR: 'FETCH_TRANSACTIONS_ERROR',
  CREATE_TRANSACTION_SUCCESS: 'CREATE_TRANSACTION_SUCCESS',
  UPDATE_TRANSACTION_SUCCESS: 'UPDATE_TRANSACTION_SUCCESS',
  DELETE_TRANSACTION_SUCCESS: 'DELETE_TRANSACTION_SUCCESS',

  // UI actions
  SET_SELECTED_BUDGET: 'SET_SELECTED_BUDGET',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer function
const budgetReducer = (state, action) => {
  switch (action.type) {
    // Budget cases
    case ACTIONS.FETCH_BUDGETS_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case ACTIONS.FETCH_BUDGETS_SUCCESS:
      return {
        ...state,
        budgets: action.payload,
        loading: false,
        error: null,
      };

    case ACTIONS.FETCH_BUDGETS_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case ACTIONS.CREATE_BUDGET_SUCCESS:
      return {
        ...state,
        budgets: [action.payload, ...state.budgets],
        error: null,
      };

    case ACTIONS.UPDATE_BUDGET_SUCCESS:
      return {
        ...state,
        budgets: state.budgets.map((b) =>
          b._id === action.payload._id ? action.payload : b
        ),
        selectedBudget:
          state.selectedBudget?._id === action.payload._id
            ? action.payload
            : state.selectedBudget,
        error: null,
      };

    case ACTIONS.DELETE_BUDGET_SUCCESS:
      return {
        ...state,
        budgets: state.budgets.filter((b) => b._id !== action.payload),
        transactions: state.transactions.filter(
          (t) =>
            (typeof t.budgetId === 'string' ? t.budgetId : t.budgetId?._id) !==
            action.payload
        ),
        selectedBudget:
          state.selectedBudget?._id === action.payload
            ? null
            : state.selectedBudget,
        error: null,
      };

    // Transaction cases
    case ACTIONS.FETCH_TRANSACTIONS_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case ACTIONS.FETCH_TRANSACTIONS_SUCCESS:
      return {
        ...state,
        transactions: action.payload,
        loading: false,
        error: null,
      };

    case ACTIONS.FETCH_TRANSACTIONS_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case ACTIONS.CREATE_TRANSACTION_SUCCESS:
      {
        const transactionBudgetId =
          typeof action.payload.budgetId === 'string'
            ? action.payload.budgetId
            : action.payload.budgetId?._id;

        const spentDelta =
          action.payload.type === 'expense' ? Number(action.payload.amount) || 0 : 0;

        return {
          ...state,
          transactions: [action.payload, ...state.transactions],
          budgets: state.budgets.map((b) =>
            b._id === transactionBudgetId
              ? { ...b, spent: b.spent + spentDelta }
              : b
          ),
          error: null,
        };
      }

    case ACTIONS.UPDATE_TRANSACTION_SUCCESS:
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t._id === action.payload._id ? action.payload : t
        ),
        error: null,
      };

    case ACTIONS.DELETE_TRANSACTION_SUCCESS:
      return {
        ...state,
        transactions: state.transactions.filter(
          (t) => t._id !== action.payload
        ),
        error: null,
      };

    // UI cases
    case ACTIONS.SET_SELECTED_BUDGET:
      return {
        ...state,
        selectedBudget: action.payload,
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

/**
 * Budget Provider Component
 * Provides budget context to all child components
 */
export const BudgetProvider = ({ children }) => {
  const [state, dispatch] = useReducer(budgetReducer, initialState);

  // Fetch all budgets
  const fetchBudgets = useCallback(async () => {
    try {
      dispatch({ type: ACTIONS.FETCH_BUDGETS_START });
      const response = await budgetService.getAllBudgets();
      dispatch({
        type: ACTIONS.FETCH_BUDGETS_SUCCESS,
        payload: response.data,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch budgets';
      dispatch({
        type: ACTIONS.FETCH_BUDGETS_ERROR,
        payload: errorMessage,
      });
      return [];
    }
  }, []);

  // Fetch transactions for specific budget
  const fetchTransactions = useCallback(async (budgetId = null, filters = {}) => {
    try {
      dispatch({ type: ACTIONS.FETCH_TRANSACTIONS_START });
      const response = await transactionService.getAllTransactions({
        budgetId,
        ...filters,
      });
      dispatch({
        type: ACTIONS.FETCH_TRANSACTIONS_SUCCESS,
        payload: response.data,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch transactions';
      dispatch({
        type: ACTIONS.FETCH_TRANSACTIONS_ERROR,
        payload: errorMessage,
      });
      return [];
    }
  }, []);

  // Create budget
  const createBudget = useCallback(async (budgetData) => {
    try {
      const response = await budgetService.createBudget(budgetData);
      dispatch({
        type: ACTIONS.CREATE_BUDGET_SUCCESS,
        payload: response.data,
      });
      // Mark that this user has created at least one budget on this device
      try {
        localStorage.setItem(STORAGE_KEYS.HAS_CREATED_BUDGET, 'true');
      } catch {
        // ignore storage errors
      }
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.message || 'Failed to create budget';
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, message: errorMessage };
    }
  }, []);

  // Update budget
  const updateBudget = useCallback(async (budgetId, budgetData) => {
    try {
      const response = await budgetService.updateBudget(budgetId, budgetData);
      dispatch({
        type: ACTIONS.UPDATE_BUDGET_SUCCESS,
        payload: response.data,
      });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.message || 'Failed to update budget';
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, message: errorMessage };
    }
  }, []);

  // Delete budget
  const deleteBudget = useCallback(async (budgetId) => {
    try {
      await budgetService.deleteBudget(budgetId);
      dispatch({
        type: ACTIONS.DELETE_BUDGET_SUCCESS,
        payload: budgetId,
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete budget';
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, message: errorMessage };
    }
  }, []);

  // Create transaction
  const createTransaction = useCallback(async (transactionData) => {
    try {
      const response = await transactionService.createTransaction(
        transactionData
      );
      dispatch({
        type: ACTIONS.CREATE_TRANSACTION_SUCCESS,
        payload: response.data,
      });
      // Refresh budgets to update spent amount
      await fetchBudgets();
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.message || 'Failed to create transaction';
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, message: errorMessage };
    }
  }, [fetchBudgets]);

  // Update transaction
  const updateTransaction = useCallback(async (transactionId, transactionData) => {
    try {
      const response = await transactionService.updateTransaction(
        transactionId,
        transactionData
      );
      dispatch({
        type: ACTIONS.UPDATE_TRANSACTION_SUCCESS,
        payload: response.data,
      });
      // Refresh budgets to update spent amount
      await fetchBudgets();
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.message || 'Failed to update transaction';
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, message: errorMessage };
    }
  }, [fetchBudgets]);

  // Delete transaction
  const deleteTransaction = useCallback(async (transactionId) => {
    try {
      await transactionService.deleteTransaction(transactionId);
      dispatch({
        type: ACTIONS.DELETE_TRANSACTION_SUCCESS,
        payload: transactionId,
      });
      // Refresh budgets to update spent amount
      await fetchBudgets();
      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete transaction';
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, message: errorMessage };
    }
  }, [fetchBudgets]);

  // Set selected budget
  const setSelectedBudget = useCallback((budget) => {
    dispatch({
      type: ACTIONS.SET_SELECTED_BUDGET,
      payload: budget,
    });
  }, []);

  const value = {
    ...state,
    fetchBudgets,
    fetchTransactions,
    createBudget,
    updateBudget,
    deleteBudget,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    setSelectedBudget,
  };

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  );
};

export default BudgetContext;
