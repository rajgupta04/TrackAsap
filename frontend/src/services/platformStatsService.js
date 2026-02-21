import api from '../lib/api';

// Get LeetCode stats
export const getLeetCodeStats = async (username) => {
  const response = await api.get(`/platform-stats/leetcode/${username}`);
  return response.data;
};

// Get Codeforces stats
export const getCodeforcesStats = async (handle) => {
  const response = await api.get(`/platform-stats/codeforces/${handle}`);
  return response.data;
};

// Get CodeChef stats
export const getCodeChefStats = async (username) => {
  const response = await api.get(`/platform-stats/codechef/${username}`);
  return response.data;
};

// Get all platform stats at once
export const getAllPlatformStats = async ({ leetcode, codeforces, codechef }) => {
  const params = new URLSearchParams();
  if (leetcode) params.append('leetcode', leetcode);
  if (codeforces) params.append('codeforces', codeforces);
  if (codechef) params.append('codechef', codechef);

  const response = await api.get(`/platform-stats/all?${params.toString()}`);
  return response.data;
};
