import api from './api';

export const physiqueService = {
  /**
   * Get all physique logs
   */
  getAll: async () => {
    const response = await api.get('/physique');
    return response.data;
  },

  /**
   * Get physique progress summary (current weight, target, trend)
   */
  getProgress: async () => {
    const response = await api.get('/physique/progress');
    return response.data;
  },

  /**
   * Add a new physique log entry
   * @param {Object} log - { date, weight, bodyFat, notes }
   */
  addLog: async (log) => {
    const response = await api.post('/physique', log);
    return response.data;
  },

  /**
   * Delete a physique log by id
   * @param {string} id - log _id
   */
  deleteLog: async (id) => {
    const response = await api.delete(`/physique/${id}`);
    return response.data;
  },
};

export default physiqueService;
