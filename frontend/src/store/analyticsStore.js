import { create } from 'zustand';
import { analyticsService } from '../services/analyticsService';
import { getLeetCodeStats, getCodeforcesStats, getCodeChefStats } from '../services/platformStatsService';

export const useAnalyticsStore = create((set) => ({
  dashboard: null,
  problemsTrend: [],
  platformDistribution: [],
  difficultyBreakdown: [],
  heatmapData: [],
  codeforcesRating: [],
  weightProgress: [],
  leetcodeStats: null,
  codeforcesStats: null,
  codechefStats: null,
  isLoading: false,
  isPlatformLoading: { leetcode: false, codeforces: false, codechef: false },
  error: null,
  platformErrors: { leetcode: null, codeforces: null, codechef: null },

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

  fetchLeetCodeStats: async (handle) => {
    if (!handle) return;
    set((state) => ({
      isPlatformLoading: { ...state.isPlatformLoading, leetcode: true },
      platformErrors: { ...state.platformErrors, leetcode: null }
    }));
    try {
      const data = await getLeetCodeStats(handle);
      if (data.success) {
        set({ leetcodeStats: data.data });
      } else {
        set((state) => ({ platformErrors: { ...state.platformErrors, leetcode: data.error } }));
      }
    } catch (error) {
      set((state) => ({ platformErrors: { ...state.platformErrors, leetcode: 'Failed to fetch LeetCode stats' } }));
    } finally {
      set((state) => ({ isPlatformLoading: { ...state.isPlatformLoading, leetcode: false } }));
    }
  },

  fetchCodeforcesStats: async (handle) => {
    if (!handle) return;
    set((state) => ({
      isPlatformLoading: { ...state.isPlatformLoading, codeforces: true },
      platformErrors: { ...state.platformErrors, codeforces: null }
    }));
    try {
      const data = await getCodeforcesStats(handle);
      if (data.success) {
        set({ codeforcesStats: data.data });
      } else {
        set((state) => ({ platformErrors: { ...state.platformErrors, codeforces: data.error } }));
      }
    } catch (error) {
      set((state) => ({ platformErrors: { ...state.platformErrors, codeforces: 'Failed to fetch Codeforces stats' } }));
    } finally {
      set((state) => ({ isPlatformLoading: { ...state.isPlatformLoading, codeforces: false } }));
    }
  },

  fetchCodechefStats: async (handle) => {
    if (!handle) return;
    set((state) => ({
      isPlatformLoading: { ...state.isPlatformLoading, codechef: true },
      platformErrors: { ...state.platformErrors, codechef: null }
    }));
    try {
      const data = await getCodeChefStats(handle);
      if (data.success) {
        set({ codechefStats: data.data });
      } else {
        set((state) => ({ platformErrors: { ...state.platformErrors, codechef: data.error } }));
      }
    } catch (error) {
      set((state) => ({ platformErrors: { ...state.platformErrors, codechef: 'Failed to fetch CodeChef stats' } }));
    } finally {
      set((state) => ({ isPlatformLoading: { ...state.isPlatformLoading, codechef: false } }));
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
