import api from '../lib/api';

export const analyticsService = {
  getDashboard: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  getProblemsTrend: async () => {
    const response = await api.get('/analytics/problems-trend');
    return response.data;
  },

  getPlatformDistribution: async () => {
    const response = await api.get('/analytics/platform-distribution');
    return response.data;
  },

  getDifficultyBreakdown: async () => {
    const response = await api.get('/analytics/difficulty-breakdown');
    return response.data;
  },

  getHeatmap: async () => {
    const response = await api.get('/analytics/heatmap');
    return response.data;
  },

  getCodeforcesRating: async () => {
    const response = await api.get('/analytics/codeforces-rating');
    return response.data;
  },

  getWeightProgress: async () => {
    const response = await api.get('/analytics/weight-progress');
    return response.data;
  },
};
