import { create } from 'zustand';
import adminService from '../services/adminService';

export const useAdminStore = create((set) => ({
  users: [],
  stats: null,
  pagination: null,
  isLoading: false,
  error: null,
  
  systemAnalytics: null,
  systemPerformance: null,
  systemFeatures: null,
  activityLogs: [],
  systemAnalyticsError: null,
  
  userDetails: null,
  isUserDetailsLoading: false,

  fetchStats: async () => {
    try {
      const stats = await adminService.getStats();
      set({ stats });
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    }
  },

  fetchSystemAnalytics: async () => {
    try {
      const [overview, perf, features, activity] = await Promise.all([
        adminService.getSystemAnalyticsOverview(),
        adminService.getSystemPerformance(),
        adminService.getSystemFeatures(),
        adminService.getSystemActivityLogs()
      ]);
      set({
        systemAnalytics: overview.data || overview,
        systemPerformance: perf.data || perf,
        systemFeatures: features.data || features,
        activityLogs: activity.data || activity,
        systemAnalyticsError: null,
      });
    } catch (error) {
      console.error('Failed to fetch system analytics:', error);
      set({ systemAnalyticsError: error.message || 'Unknown error fetching analytics' });
    }
  },

  fetchUserDetails: async (userId) => {
    set({ isUserDetailsLoading: true, userDetails: null });
    try {
      const data = await adminService.getUserDetails(userId);
      set({ userDetails: data, isUserDetailsLoading: false });
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      set({ isUserDetailsLoading: false });
    }
  },

  fetchUsers: async (search = '', page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const data = await adminService.getUsers(search, page);
      set({ users: data.users, pagination: data.pagination, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to load users', isLoading: false });
    }
  },

  toggleBanUser: async (userId, reason = '') => {
    try {
      const result = await adminService.toggleBanUser(userId, reason);
      set((state) => ({
        users: state.users.map((user) =>
          user._id === userId
            ? { ...user, isBanned: result.user.isBanned, banReason: result.user.banReason, bannedAt: result.user.bannedAt }
            : user
        ),
      }));
      return { success: true, message: result.message };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update user' };
    }
  },

  upsertBucket: async (bucketData) => {
    try {
      const bucket = await adminService.upsertBucket(bucketData);
      return { success: true, bucket };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to upsert bucket' };
    }
  },
}));
