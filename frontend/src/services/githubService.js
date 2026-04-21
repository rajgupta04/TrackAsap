import api from '../lib/api';

const githubService = {
  getAuthUrl: async () => {
    const response = await api.get('/github/auth-url');
    return response.data;
  },

  getStatus: async () => {
    const response = await api.get('/github/status');
    return response.data;
  },

  sync: async () => {
    const response = await api.post('/github/sync');
    return response.data;
  },

  disconnect: async () => {
    const response = await api.delete('/github/disconnect');
    return response.data;
  },

  initRepo: async () => {
    const response = await api.post('/github/init-repo');
    return response.data;
  },
};

export default githubService;
