import api from '../lib/api';

export const roadmapService = {
  getWorlds: async () => {
    const { data } = await api.get('/roadmap/worlds');
    return data;
  },

  getProgress: async () => {
    const { data } = await api.get('/roadmap/progress');
    return data;
  },

  saveProgress: async (progressData) => {
    const { data } = await api.put('/roadmap/progress', progressData);
    return data;
  },
};
