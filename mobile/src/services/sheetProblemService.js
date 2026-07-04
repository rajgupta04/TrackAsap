import api from './api';

const sheetProblemService = {
  // Get all problems for a sheet
  getProblems: async (sheetId) => {
    const response = await api.get(`/sheet-problems/${sheetId}`);
    return response.data;
  },

  // Add a single problem
  addProblem: async (sheetId, data) => {
    const response = await api.post(`/sheet-problems/${sheetId}`, data);
    return response.data;
  },

  // Update problem status
  updateStatus: async (problemId, status) => {
    const response = await api.patch(`/sheet-problems/problem/${problemId}/status`, { status });
    return response.data;
  },

  // Update problem details
  updateProblem: async (problemId, data) => {
    const response = await api.put(`/sheet-problems/problem/${problemId}`, data);
    return response.data;
  },

  // Delete problem
  deleteProblem: async (problemId) => {
    const response = await api.delete(`/sheet-problems/problem/${problemId}`);
    return response.data;
  },

  // Note: mobile doesn't typically handle file uploads natively the same way,
  // but we'll include the API endpoints just in case they're needed.
};

export default sheetProblemService;
