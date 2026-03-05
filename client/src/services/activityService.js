/**
 * Activity Service
 * Handles API calls related to user activity timeline.
 */

import api from './api.js';

export const getRecentActivities = async (params = {}) => {
  try {
    const response = await api.get('/activity', {
      params,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default {
  getRecentActivities,
};
