import api from './api';

export const taskService = {
  /**
   * Get all daily logs for the authenticated user
   */
  getAllLogs: async () => {
    const response = await api.get('/daily-logs');
    return response.data;
  },

  /**
   * Get daily log for a specific date
   * @param {string} date - ISO date string (YYYY-MM-DD)
   */
  getLogByDate: async (date) => {
    const response = await api.get(`/daily-logs/${date}`);
    return response.data;
  },

  /**
   * Create or update a daily log task entry
   * @param {Object} logData - { date, leetcode, codechef, codeforces, gym, diet, internshipPrep, notes }
   */
  saveDailyLog: async (logData) => {
    const response = await api.post('/daily-logs', logData);
    return response.data;
  },

  /**
   * Get current user streak stats
   */
  getStreak: async () => {
    const response = await api.get('/daily-logs/streak');
    return response.data;
  },

  /**
   * Get weekly summary statistics
   */
  getWeeklySummary: async () => {
    const response = await api.get('/daily-logs/weekly-summary');
    return response.data;
  },

  /**
   * Delete daily log for a specific date
   * @param {string} date - ISO date string (YYYY-MM-DD)
   */
  deleteLog: async (date) => {
    const response = await api.delete(`/daily-logs/${date}`);
    return response.data;
  },
};

export default taskService;
