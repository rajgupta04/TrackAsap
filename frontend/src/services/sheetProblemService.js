import api from '../lib/api';

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

  // Import from Excel
  importFromExcel: async (sheetId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/sheet-problems/${sheetId}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Export to Excel
  exportToExcel: async (sheetId) => {
    const response = await api.get(`/sheet-problems/${sheetId}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Download template
  downloadTemplate: async () => {
    const response = await api.get('/sheet-problems/template', {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default sheetProblemService;
