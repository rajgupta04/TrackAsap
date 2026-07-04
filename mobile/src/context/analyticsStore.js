import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userService from '../services/userService';

const useAnalyticsStore = create(
  persist(
    (set) => ({
  dashboard: null,
  problemsTrend: [],
  platformDistribution: [],
  difficultyBreakdown: [],
  heatmapData: [],
  codeforcesRating: [],
  leetcodeCalendar: null,
  leetcodeRatingHistory: [],
  isLoading: false,
  error: null,
  
  clearStore: () => set({ 
    dashboard: null, problemsTrend: [], platformDistribution: [], 
    difficultyBreakdown: [], heatmapData: [], codeforcesRating: [], 
    leetcodeCalendar: null, leetcodeRatingHistory: [], error: null 
  }),

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

  fetchPlatformProfiles: async (user) => {
    if (!user) return;
    try {
      const platformStatsService = (await import('../services/platformStatsService')).default;
      
      let newDifficulty = null;
      let platforms = [];

      // Fetch LeetCode
      if (user.leetcodeHandle) {
        try {
          const stats = await platformStatsService.getLeetCodeStats(user.leetcodeHandle);
          if (stats?.data) {
            if (stats.data.submissionCalendar) {
              set({ leetcodeCalendar: stats.data.submissionCalendar });
            }
            
            newDifficulty = [
              { difficulty: 'Easy', count: stats.data.easySolved || 0, color: '#00B8A3' },
              { difficulty: 'Medium', count: stats.data.mediumSolved || 0, color: '#FFC01E' },
              { difficulty: 'Hard', count: stats.data.hardSolved || 0, color: '#FF375F' },
            ];
            
            platforms.push({ platform: 'LeetCode', problems: stats.data.totalSolved || 0, color: '#FFA116' });
          }
          
          const contestRes = await fetch(`https://alfa-leetcode-api.onrender.com/${user.leetcodeHandle}/contest`);
          if (contestRes.ok) {
            const contestData = await contestRes.json();
            if (contestData?.contestParticipation) {
              set({ leetcodeRatingHistory: contestData.contestParticipation.slice(-20) });
            }
          }
        } catch (e) {
          console.log('Failed LeetCode fetch', e);
        }
      }

      // Fetch Codeforces
      if (user.codeforcesHandle) {
        try {
          const cfRes = await fetch(`https://codeforces.com/api/user.status?handle=${user.codeforcesHandle}&from=1&count=10000`);
          if (cfRes.ok) {
            const cfData = await cfRes.json();
            if (cfData.status === 'OK') {
              const uniqueProblems = new Set();
              cfData.result.forEach((sub) => {
                if (sub.verdict === 'OK') {
                  uniqueProblems.add(`${sub.problem.contestId}-${sub.problem.index}`);
                }
              });
              platforms.push({ platform: 'Codeforces', problems: uniqueProblems.size, color: '#1F8ACB' });
            }
          }
        } catch (e) {
          console.log('Failed Codeforces fetch', e);
        }
      }

      // Update the store with all the merged platform data
      set((state) => {
        const fetchedNames = platforms.map(p => p.platform);
        const remaining = (state.platformDistribution || []).filter(p => !fetchedNames.includes(p.platform));
        
        return {
          ...(newDifficulty && { difficultyBreakdown: newDifficulty }),
          platformDistribution: [...platforms, ...remaining],
        };
      });

    } catch (err) {
      console.log('Failed to fetch platform profiles', err);
    }
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
}), {
  name: 'analytics-storage',
  storage: createJSONStorage(() => AsyncStorage),
}));

export default useAnalyticsStore;
