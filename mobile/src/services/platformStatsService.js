import api from './api';

export const platformStatsService = {
  /**
   * Get platform stats (LeetCode, CodeChef, Codeforces ratings/counts)
   */
  getAll: async () => {
    const response = await api.get('/platform-stats');
    return response.data;
  },

  /**
   * Refresh/sync platform stats from external APIs
   */
  refresh: async () => {
    const response = await api.post('/platform-stats/refresh');
    return response.data;
  },

  /**
   * Get LeetCode stats
   */
  getLeetCodeStats: async (username) => {
    const response = await api.get(`/platform-stats/leetcode/${username}`);
    return response.data;
  },
};

export default platformStatsService;
