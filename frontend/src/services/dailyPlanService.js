import api from '../lib/api';

export const dailyPlanService = {
  // Generate 2 plans from prompt parameters
  generate: async (data) => {
    const res = await api.post('/daily-plan/generate', data);
    return res.data;
  },

  // Save selected plan draft
  save: async (data) => {
    const res = await api.post('/daily-plan/save', data);
    return res.data;
  },

  // Start non-stop session & snapshot sheets
  startSession: async (id) => {
    const res = await api.patch(`/daily-plan/${id}/start-session`);
    return res.data;
  },

  // Toggle task completion
  toggleTask: async (id, taskId) => {
    const res = await api.patch(`/daily-plan/${id}/toggle-task`, { taskId });
    return res.data;
  },

  // Update/reorder tasks in plan
  updateTasks: async (id, tasks, title) => {
    const res = await api.patch(`/daily-plan/${id}/update-tasks`, { tasks, title });
    return res.data;
  },

  // End session & get final report
  endSession: async (id) => {
    const res = await api.patch(`/daily-plan/${id}/end-session`);
    return res.data;
  },

  // Get active session or latest draft
  getActive: async () => {
    const res = await api.get('/daily-plan/active');
    return res.data;
  },

  // Get past session history
  getHistory: async () => {
    const res = await api.get('/daily-plan/history');
    return res.data;
  },

  // Get plan by ID
  getById: async (id) => {
    const res = await api.get(`/daily-plan/${id}`);
    return res.data;
  },
};

export default dailyPlanService;
