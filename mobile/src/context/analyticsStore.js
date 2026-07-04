import { create } from 'zustand';
import userService from '../services/userService';

const useAnalyticsStore = create((set) => ({
  dashboard: null,
  problemsTrend: [],
  platformDistribution: [],
  difficultyBreakdown: [],
  heatmapData: [],
  codeforcesRating: [],
  isLoading: false,
  error: null,

  fetchDashboard: async () => {
    set({ isLoading: true });
    try {
      const res = await userService.getAnalyticsDashboard();
      set({ dashboard: res.data || res, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchProblemsTrend: async () => {
    try {
      const res = await userService.getProblemsTrend();
      const data = res.data || res;
      set({ problemsTrend: Array.isArray(data) ? data : [] });
    } catch (_) {}
  },

  fetchPlatformDistribution: async () => {
    try {
      const res = await userService.getPlatformDistribution();
      const data = res.data || res;
      set({ platformDistribution: Array.isArray(data) ? data : [] });
    } catch (_) {}
  },

  fetchDifficultyBreakdown: async () => {
    try {
      const res = await import('../services/api').then(m => m.default.get('/analytics/difficulty-breakdown'));
      const data = res.data?.data || res.data || [];
      set({ difficultyBreakdown: Array.isArray(data) ? data : [] });
    } catch (_) {}
  },

  fetchHeatmap: async () => {
    try {
      const res = await import('../services/api').then(m => m.default.get('/analytics/heatmap'));
      const data = res.data?.data || res.data || [];
      set({ heatmapData: Array.isArray(data) ? data : [] });
    } catch (_) {}
  },

  fetchCodeforcesRating: async () => {
    try {
      const res = await import('../services/api').then(m => m.default.get('/analytics/codeforces-rating'));
      const data = res.data?.data || res.data || [];
      set({ codeforcesRating: Array.isArray(data) ? data : [] });
    } catch (_) {}
  },

  fetchAll: async () => {
    set({ isLoading: true });
    try {
      const api = (await import('../services/api')).default;
      const [dash, trend, dist, diff, heat, cf] = await Promise.allSettled([
        api.get('/analytics/dashboard'),
        api.get('/analytics/problems-trend'),
        api.get('/analytics/platform-distribution'),
        api.get('/analytics/difficulty-breakdown'),
        api.get('/analytics/heatmap'),
        api.get('/analytics/codeforces-rating'),
      ]);

      set({
        dashboard: dash.status === 'fulfilled' ? (dash.value.data?.data || dash.value.data) : null,
        problemsTrend: trend.status === 'fulfilled' ? (trend.value.data?.data || trend.value.data || []) : [],
        platformDistribution: dist.status === 'fulfilled' ? (dist.value.data?.data || dist.value.data || []) : [],
        difficultyBreakdown: diff.status === 'fulfilled' ? (diff.value.data?.data || diff.value.data || []) : [],
        heatmapData: heat.status === 'fulfilled' ? (heat.value.data?.data || heat.value.data || []) : [],
        codeforcesRating: cf.status === 'fulfilled' ? (cf.value.data?.data || cf.value.data || []) : [],
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: err.message });
    }
  },
}));

export default useAnalyticsStore;
