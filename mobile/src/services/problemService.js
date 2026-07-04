import api from './api';

export const problemService = {
  /**
   * Get paginated problems list with optional filters
   * @param {Object} params - { page, platform, difficulty, status, search }
   */
  getAll: async (params = {}) => {
    const response = await api.get('/problems', { params });
    return response.data;
  },

  /**
   * Get problem statistics (totals by platform, difficulty)
   */
  getStats: async () => {
    const response = await api.get('/problems/stats');
    return response.data;
  },

  /**
   * Get problems solved on a specific date
   * @param {string} date - YYYY-MM-DD
   */
  getByDate: async (date) => {
    const response = await api.get('/problems', { params: { date } });
    return response.data;
  },

  /**
   * Delete a problem by id
   * @param {string} id
   */
  delete: async (id) => {
    const response = await api.delete(`/problems/${id}`);
    return response.data;
  },

  /**
   * Update problem notes
   * @param {string} id
   * @param {string} notes
   */
  updateNotes: async (id, notes) => {
    const response = await api.patch(`/problems/${id}`, { notes });
    return response.data;
  },
};

export default problemService;
