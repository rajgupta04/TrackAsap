import api from '../lib/api';

const adminService = {
  // Get all users
  getUsers: async (search = '', page = 1, limit = 50) => {
    const response = await api.get(`/admin/users?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`);
    return response.data;
  },

  // Toggle ban/unban user
  toggleBanUser: async (userId, reason = '') => {
    const response = await api.put(`/admin/users/${userId}/ban`, { reason });
    return response.data;
  },

  // Delete post as admin
  deletePost: async (postId) => {
    const response = await api.delete(`/admin/posts/${postId}`);
    return response.data;
  },

  // Get admin stats
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Upsert bucket (reuse existing endpoint)
  upsertBucket: async (bucketData) => {
    const response = await api.post('/buckets/upsert', bucketData);
    return response.data;
  },
  // Get system analytics overview
  getSystemAnalyticsOverview: async () => {
    const response = await api.get('/system-analytics/overview');
    return response.data;
  },

  // Get system performance
  getSystemPerformance: async () => {
    const response = await api.get('/system-analytics/performance');
    return response.data;
  },

  // Get popular features
  getSystemFeatures: async () => {
    const response = await api.get('/system-analytics/features');
    return response.data;
  },

  // Get system activity logs
  getSystemActivityLogs: async () => {
    const response = await api.get('/system-analytics/activity-logs');
    return response.data;
  },

  // Get detailed user info
  getUserDetails: async (userId) => {
    const response = await api.get(`/admin/users/${userId}/details`);
    return response.data;
  },
};

export default adminService;
