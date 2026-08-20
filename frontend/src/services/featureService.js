import api from '../lib/api';

export const featureService = {
  getPublicFeatures: async () => {
    const { data } = await api.get('/features');
    return data;
  },

  getAdminFeatures: async () => {
    const { data } = await api.get('/admin/features');
    return data;
  },

  updateAdminFeatures: async (settings) => {
    const { data } = await api.put('/admin/features', settings);
    return data;
  },
};

export default featureService;
