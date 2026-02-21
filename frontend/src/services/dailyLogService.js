import api from '../lib/api';

export const dailyLogService = {
  getAll: async (params = {}) => {
    const response = await api.get('/daily-logs', { params });
    return response.data;
  },

  getByDate: async (date) => {
    const response = await api.get(`/daily-logs/${date}`);
    return response.data;
  },

  createOrUpdate: async (data) => {
    const response = await api.post('/daily-logs', data);
    return response.data;
  },

  delete: async (date) => {
    const response = await api.delete(`/daily-logs/${date}`);
    return response.data;
  },

  getStreak: async () => {
    const response = await api.get('/daily-logs/streak');
    return response.data;
  },

  getWeeklySummary: async (weekNumber) => {
    const response = await api.get('/daily-logs/weekly-summary', {
      params: { weekNumber },
    });
    return response.data;
  },
};
