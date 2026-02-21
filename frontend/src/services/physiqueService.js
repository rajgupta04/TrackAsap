import api from '../lib/api';

export const physiqueService = {
  getAll: async () => {
    const response = await api.get('/physique');
    return response.data;
  },

  add: async (data) => {
    const response = await api.post('/physique', data);
    return response.data;
  },

  getProgress: async () => {
    const response = await api.get('/physique/progress');
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/physique/${id}`);
    return response.data;
  },
};
