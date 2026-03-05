/**
 * Transaction Service
 * Handles API calls related to transactions
 */

import api from './api.js';

/**
 * Get all transactions
 * @param {object} filters - Filter options (budgetId, type, startDate, endDate)
 * @returns {Promise} Response with transactions array
 */
export const getAllTransactions = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.budgetId) params.append('budgetId', filters.budgetId);
    if (filters.type) params.append('type', filters.type);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get('/transactions', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get single transaction by ID
 * @param {string} transactionId - Transaction ID
 * @returns {Promise} Response with transaction data
 */
export const getTransactionById = async (transactionId) => {
  try {
    const response = await api.get(`/transactions/${transactionId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create new transaction
 * @param {object} transactionData - Transaction data
 * @returns {Promise} Response with created transaction
 */
export const createTransaction = async (transactionData) => {
  try {
    const response = await api.post('/transactions', transactionData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update transaction
 * @param {string} transactionId - Transaction ID
 * @param {object} transactionData - Updated transaction data
 * @returns {Promise} Response with updated transaction
 */
export const updateTransaction = async (transactionId, transactionData) => {
  try {
    const response = await api.put(`/transactions/${transactionId}`, transactionData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete transaction
 * @param {string} transactionId - Transaction ID
 * @returns {Promise} Response
 */
export const deleteTransaction = async (transactionId) => {
  try {
    const response = await api.delete(`/transactions/${transactionId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get transaction statistics
 * @param {string} budgetId - Budget ID
 * @returns {Promise} Response with statistics
 */
export const getTransactionStats = async (budgetId) => {
  try {
    const response = await api.get(`/transactions/stats/${budgetId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
};