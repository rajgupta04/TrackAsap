import api from '../lib/api';

export const taskService = {
  getTasks: async () => {
    const { data } = await api.get('/tasks');
    return data;
  },

  createTask: async (taskData) => {
    const { data } = await api.post('/tasks', taskData);
    return data;
  },

  deleteTask: async (id) => {
    const { data } = await api.delete(`/tasks/${id}`);
    return data;
  },

  getTaskLogs: async (startDate, endDate) => {
    let url = '/tasks/logs';
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const { data } = await api.get(url);
    return data;
  },

  toggleTaskLog: async (taskId, date) => {
    const { data } = await api.post('/tasks/toggle', { taskId, date });
    return data;
  },
};
