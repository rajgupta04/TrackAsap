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

  // Get compiler settings
  getCompilerSettings: async () => {
    const response = await api.get('/admin/compiler-settings');
    return response.data;
  },

  // Update compiler settings
  updateCompilerSettings: async (settings) => {
    const response = await api.put('/admin/compiler-settings', settings);
    return response.data;
  },

  // Roadmap World Management
  getRoadmapWorlds: async () => {
    const response = await api.get('/admin/roadmap/worlds');
    return response.data;
  },

  upsertRoadmapWorld: async (worldData) => {
    const response = await api.post('/admin/roadmap/worlds', worldData);
    return response.data;
  },

  deleteRoadmapWorld: async (id) => {
    const response = await api.delete(`/admin/roadmap/worlds/${id}`);
    return response.data;
  },

  seedRoadmapWorlds: async (worlds) => {
    const response = await api.post('/admin/roadmap/seed', { worlds });
    return response.data;
  },

  // Telemetry & Clickstream Analytics
  getClickstream: async (params = {}) => {
    const response = await api.get('/admin/telemetry/clickstream', { params });
    return response.data;
  },

  getUserJourney: async (email) => {
    const response = await api.get(`/admin/telemetry/user-journey/${encodeURIComponent(email)}`);
    return response.data;
  },

  getIpStats: async () => {
    const response = await api.get('/admin/telemetry/ip-stats');
    return response.data;
  },

  getTopClicks: async () => {
    const response = await api.get('/admin/telemetry/top-clicks');
    return response.data;
  },
};

export default adminService;
