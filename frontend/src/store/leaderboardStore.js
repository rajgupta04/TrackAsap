import { create } from 'zustand';
import { leaderboardService } from '../services/leaderboardService';

export const useLeaderboardStore = create((set, get) => ({
  leaderboardData: [],
  totalPages: 1,
  currentPage: 1,
  totalUsers: 0,
  
  currentUserProfile: null,
  currentUserRanks: { global: 0, weekly: 0, monthly: 0 },
  
  activeTab: 'global', // 'global', 'weekly', 'monthly'
  searchQuery: '',
  limit: 50,
  
  isLoading: false,
  error: null,

  setActiveTab: (tab) => {
    set({ activeTab: tab, currentPage: 1 });
    get().fetchLeaderboard();
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query, currentPage: 1 });
    get().fetchLeaderboard();
  },

  setPage: (page) => {
    set({ currentPage: page });
    get().fetchLeaderboard();
  },

  fetchLeaderboard: async () => {
    const { activeTab, currentPage, limit, searchQuery } = get();
    set({ isLoading: true, error: null });
    try {
      let result;
      if (activeTab === 'global') {
        result = await leaderboardService.getGlobalLeaderboard(currentPage, limit, searchQuery);
      } else if (activeTab === 'weekly') {
        result = await leaderboardService.getWeeklyLeaderboard(currentPage, limit); // Note: keeping search out of weekly for now, or backend can add it
      } else if (activeTab === 'monthly') {
        result = await leaderboardService.getMonthlyLeaderboard(currentPage, limit);
      }

      set({
        leaderboardData: result.leaderboard || [],
        totalPages: result.totalPages || 1,
        totalUsers: result.totalUsers || 0,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchCurrentUserRank: async () => {
    try {
      const data = await leaderboardService.getCurrentUserRank();
      set({
        currentUserProfile: data.profile,
        currentUserRanks: data.ranks,
      });
    } catch (error) {
      console.error('Error fetching current user rank:', error);
    }
  },
}));
