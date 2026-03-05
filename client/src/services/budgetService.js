/**
 * Budget Service
 * Handles API calls related to budgets
 */

import api from './api.js';

/**
 * Get all budgets
 * @returns {Promise} Response with budgets array
 */
export const getAllBudgets = async () => {
  try {
    const response = await api.get('/budgets');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get single budget by ID
 * @param {string} budgetId - Budget ID
 * @returns {Promise} Response with budget data
 */
export const getBudgetById = async (budgetId) => {
  try {
    const response = await api.get(`/budgets/${budgetId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create new budget
 * @param {object} budgetData - Budget data (category, limit, description)
 * @returns {Promise} Response with created budget
 */
export const createBudget = async (budgetData) => {
  try {
    const response = await api.post('/budgets', budgetData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update budget
 * @param {string} budgetId - Budget ID
 * @param {object} budgetData - Updated budget data
 * @returns {Promise} Response with updated budget
 */
export const updateBudget = async (budgetId, budgetData) => {
  try {
    const response = await api.put(`/budgets/${budgetId}`, budgetData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete budget
 * @param {string} budgetId - Budget ID
 * @returns {Promise} Response
 */
export const deleteBudget = async (budgetId) => {
  try {
    const response = await api.delete(`/budgets/${budgetId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
};