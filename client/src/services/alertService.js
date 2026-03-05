/**
 * Alert Service
 * Handles email alert and alert-channel related API calls.
 */

import api from './api.js';

export const sendTestEmailAlert = async () => {
  try {
    const response = await api.post('/alerts/email/test');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const sendBudgetThresholdEmailAlert = async (payload) => {
  try {
    const response = await api.post('/alerts/email/budget-threshold', payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default {
  sendTestEmailAlert,
  sendBudgetThresholdEmailAlert,
};
