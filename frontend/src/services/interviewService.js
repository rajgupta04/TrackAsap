import api from '../lib/api';

export const interviewService = {
  createSession: async (sessionData) => {
    const response = await api.post('/interview/session', sessionData);
    return response.data;
  },

  getSession: async (sessionId) => {
    const response = await api.get(`/interview/session/${sessionId}`);
    return response.data;
  },

  listSessions: async (page = 1, limit = 10) => {
    const response = await api.get(`/interview/sessions?page=${page}&limit=${limit}`);
    return response.data;
  },

  getSessionToken: async (sessionId) => {
    const response = await api.post(`/interview/session/${sessionId}/token`);
    return response.data;
  },

  addTranscriptTurn: async (sessionId, turnData) => {
    const response = await api.post(`/interview/session/${sessionId}/transcript`, turnData);
    return response.data;
  },

  submitEvaluation: async (sessionId, evaluation) => {
    const response = await api.post(`/interview/session/${sessionId}/evaluation`, { evaluation });
    return response.data;
  },

  evaluateSession: async (sessionId, transcript = null) => {
    const response = await api.post(`/interview/session/${sessionId}/evaluate`, { transcript });
    return response.data;
  },

  deleteSession: async (sessionId) => {
    const response = await api.delete(`/interview/session/${sessionId}`);
    return response.data;
  },

  getUserContext: async () => {
    const response = await api.get('/interview/user-context');
    return response.data;
  },
};
