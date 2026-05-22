/**
 * Recurring transactions API service
 */

import api from './api.js';

export const getRecurringTransactions = async () => {
  const response = await api.get('/recurring-transactions');
  return response.data;
};

export const createRecurringTransaction = async (payload) => {
  const response = await api.post('/recurring-transactions', payload);
  return response.data;
};

export const updateRecurringTransaction = async (id, payload) => {
  const response = await api.put(`/recurring-transactions/${id}`, payload);
  return response.data;
};

export const deleteRecurringTransaction = async (id) => {
  const response = await api.delete(`/recurring-transactions/${id}`);
  return response.data;
};

export default {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
};
