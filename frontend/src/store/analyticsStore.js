import { create } from 'zustand';
import { analyticsService } from '../services/analyticsService';

export const useAnalyticsStore = create((set) => ({
  dashboard: null,
  problemsTrend: [],
  platformDistribution: [],
  difficultyBreakdown: [],
  heatmapData: [],
  codeforcesRating: [],
  weightProgress: [],
  isLoading: false,
  error: null,

  fetchDashboard: async () => {
    set({ isLoading: true });
    try {
      const data = await analyticsService.getDashboard();
      set({ dashboard: data, isLoading: false });
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  fetchProblemsTrend: async () => {
    try {
      const data = await analyticsService.getProblemsTrend();
      set({ problemsTrend: data });
      return data;
    } catch (error) {
      return [];
    }
  },

  fetchPlatformDistribution: async () => {
    try {
      const data = await analyticsService.getPlatformDistribution();
      set({ platformDistribution: data });
      return data;
    } catch (error) {
      return [];
    }
  },

  fetchDifficultyBreakdown: async () => {
    try {
      const data = await analyticsService.getDifficultyBreakdown();
      set({ difficultyBreakdown: data });
      return data;
    } catch (error) {
      return [];
    }
  },

  fetchHeatmap: async () => {
    try {
      const data = await analyticsService.getHeatmap();
      set({ heatmapData: data });
      return data;
    } catch (error) {
      return [];
    }
  },

  fetchCodeforcesRating: async () => {
    try {
      const data = await analyticsService.getCodeforcesRating();
      set({ codeforcesRating: data });
      return data;
    } catch (error) {
      return [];
    }
  },

  fetchWeightProgress: async () => {
    try {
      const data = await analyticsService.getWeightProgress();
      set({ weightProgress: data });
      return data;
    } catch (error) {
      return [];
    }
  },

  fetchAll: async () => {
    set({ isLoading: true });
    try {
      const [
        dashboard,
        problemsTrend,
        platformDistribution,
        difficultyBreakdown,
        heatmapData,
        codeforcesRating,
        weightProgress,
      ] = await Promise.all([
        analyticsService.getDashboard(),
        analyticsService.getProblemsTrend(),
        analyticsService.getPlatformDistribution(),
        analyticsService.getDifficultyBreakdown(),
        analyticsService.getHeatmap(),
        analyticsService.getCodeforcesRating(),
        analyticsService.getWeightProgress(),
      ]);

      set({
        dashboard,
        problemsTrend,
        platformDistribution,
        difficultyBreakdown,
        heatmapData,
        codeforcesRating,
        weightProgress,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
