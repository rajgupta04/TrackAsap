import api from '../lib/api';

export const problemService = {
  // Get all problems
  getAll: async (params = {}) => {
    const response = await api.get('/problems', { params });
    return response.data;
  },

  // Get single problem
  getById: async (id) => {
    const response = await api.get(`/problems/${id}`);
    return response.data;
  },

  // Get problems by date
  getByDate: async (date) => {
    const response = await api.get(`/problems/by-date/${date}`);
    return response.data;
  },

  // Create problem
  create: async (data) => {
    const response = await api.post('/problems', data);
    return response.data;
  },

  // Update problem
  update: async (id, data) => {
    const response = await api.put(`/problems/${id}`, data);
    return response.data;
  },

  // Delete problem
  delete: async (id) => {
    const response = await api.delete(`/problems/${id}`);
    return response.data;
  },

  // Get problem statistics
  getStats: async () => {
    const response = await api.get('/problems/stats');
    return response.data;
  },

  // ── Solution sub-resource ────────────────────────────────────────────────
  // Add a new solution (language + code + label) to a problem
  addSolution: async (problemId, data) => {
    const response = await api.post(`/problems/${problemId}/solutions`, data);
    return response.data;
  },

  // Update a specific solution
  updateSolution: async (problemId, solutionId, data) => {
    const response = await api.put(`/problems/${problemId}/solutions/${solutionId}`, data);
    return response.data;
  },

  // Delete a specific solution
  deleteSolution: async (problemId, solutionId) => {
    const response = await api.delete(`/problems/${problemId}/solutions/${solutionId}`);
    return response.data;
  },
};

export default problemService;
