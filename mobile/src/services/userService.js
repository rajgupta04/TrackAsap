import api from './api';

export const userService = {
  /**
   * Update user profile settings
   * @param {Object} profileData - { name, enablePhysique, targetRole, etc. }
   */
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  /**
   * Get main analytics dashboard summary data
   */
  getAnalyticsDashboard: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  /**
   * Get problem solving trends over time
   */
  getProblemsTrend: async () => {
    const response = await api.get('/analytics/problems-trend');
    return response.data;
  },

  /**
   * Get platform problem distribution
   */
  getPlatformDistribution: async () => {
    const response = await api.get('/analytics/platform-distribution');
    return response.data;
  },
};

export default userService;
