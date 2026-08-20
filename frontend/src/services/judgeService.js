import api from '../lib/api';

const judgeService = {
  // --- Problem Browsing & CRUD ---
  getProblems: async (params = {}) => {
    const res = await api.get('/judge-problems', { params });
    return res.data;
  },

  getProblemBySlug: async (slug) => {
    const res = await api.get(`/judge-problems/${slug}`);
    return res.data;
  },

  createProblem: async (problemData) => {
    const res = await api.post('/judge-problems', problemData);
    return res.data;
  },

  updateProblem: async (id, updates) => {
    const res = await api.put(`/judge-problems/${id}`, updates);
    return res.data;
  },

  deleteProblem: async (id) => {
    const res = await api.delete(`/judge-problems/${id}`);
    return res.data;
  },

  getMyAuthoredProblems: async () => {
    const res = await api.get('/judge-problems/setter/my-problems');
    return res.data;
  },

  searchProblems: async (query = '', limit = 10) => {
    const res = await api.get('/judge-problems/search', {
      params: { q: query, limit },
    });
    return res.data;
  },

  getPendingProblems: async () => {
    const res = await api.get('/judge-problems/admin/pending');
    return res.data;
  },

  getAllAdminProblems: async (params = {}) => {
    const res = await api.get('/judge-problems/admin/all', { params });
    return res.data;
  },

  reviewProblem: async (id, status, adminFeedback = '') => {
    const res = await api.put(`/judge-problems/admin/review/${id}`, {
      status,
      adminFeedback,
    });
    return res.data;
  },

  uploadProblemImage: async (formData) => {
    const res = await api.post('/judge-problems/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // --- Judge Execution & Submissions ---
  runCode: async ({ problemId, code, language, customInput }) => {
    const res = await api.post('/judge/run', {
      problemId,
      code,
      language,
      customInput,
    });
    return res.data;
  },

  submitCode: async ({ problemId, code, language }) => {
    const res = await api.post('/judge/submit', {
      problemId,
      code,
      language,
    });
    return res.data;
  },

  getMySubmissions: async (problemId) => {
    const res = await api.get(`/judge/submissions/${problemId}`);
    return res.data;
  },

  getProblemStats: async (problemId, language = 'python') => {
    const res = await api.get(`/judge/stats/${problemId}`, {
      params: { language },
    });
    return res.data;
  },
};

export default judgeService;
