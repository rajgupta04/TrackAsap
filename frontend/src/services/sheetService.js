import api from '../lib/api';

export const sheetService = {
  // Get all sheets
  getAll: async () => {
    const response = await api.get('/sheets');
    return response.data;
  },

  // Get single sheet with problems
  getById: async (id) => {
    const response = await api.get(`/sheets/${id}`);
    return response.data;
  },

  // Create sheet
  create: async (data) => {
    const response = await api.post('/sheets', data);
    return response.data;
  },

  // Update sheet
  update: async (id, data) => {
    const response = await api.put(`/sheets/${id}`, data);
    return response.data;
  },

  // Delete sheet
  delete: async (id) => {
    const response = await api.delete(`/sheets/${id}`);
    return response.data;
  },

  // Add topic to sheet
  addTopic: async (sheetId, topicData) => {
    const response = await api.post(`/sheets/${sheetId}/topics`, topicData);
    return response.data;
  },

  // Update topic progress
  updateTopic: async (sheetId, topicName, data) => {
    const response = await api.put(`/sheets/${sheetId}/topics/${encodeURIComponent(topicName)}`, data);
    return response.data;
  },

  // Get templates
  getTemplates: async () => {
    const response = await api.get('/sheets/templates');
    return response.data;
  },
};

export default sheetService;
