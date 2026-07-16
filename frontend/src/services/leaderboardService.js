import api from '../lib/api';

export const leaderboardService = {
  getGlobalLeaderboard: async (page = 1, limit = 50, search = '') => {
    let url = `/leaderboard/global?page=${page}&limit=${limit}`;
    if (search) url += `&search=${search}`;
    const { data } = await api.get(url);
    return data;
  },

  getWeeklyLeaderboard: async (page = 1, limit = 50) => {
    const { data } = await api.get(`/leaderboard/weekly?page=${page}&limit=${limit}`);
    return data;
  },

  getMonthlyLeaderboard: async (page = 1, limit = 50) => {
    const { data } = await api.get(`/leaderboard/monthly?page=${page}&limit=${limit}`);
    return data;
  },

  getCollegeLeaderboard: async (collegeName, page = 1, limit = 50) => {
    const { data } = await api.get(`/leaderboard/college/${collegeName}?page=${page}&limit=${limit}`);
    return data;
  },

  getCurrentUserRank: async () => {
    const { data } = await api.get('/leaderboard/me');
    return data;
  }
};
