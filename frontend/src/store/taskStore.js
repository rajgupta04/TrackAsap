import { create } from 'zustand';
import { taskService } from '../services/taskService';

export const useTaskStore = create((set, get) => ({
  tasks: [],
  taskLogs: [],
  streak: { currentStreak: 0, longestStreak: 0 },
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await taskService.getTasks();
      set({ tasks, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  createTask: async (taskData) => {
    set({ isLoading: true, error: null });
    try {
      const newTask = await taskService.createTask(taskData);
      set((state) => ({ tasks: [newTask, ...state.tasks], isLoading: false }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  deleteTask: async (id) => {
    try {
      await taskService.deleteTask(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t._id !== id),
        taskLogs: state.taskLogs.filter((log) => log.task !== id),
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  fetchTaskLogs: async (startDate, endDate) => {
    try {
      const logs = await taskService.getTaskLogs(startDate, endDate);
      set({ taskLogs: logs });
    } catch (error) {
      set({ error: error.message });
    }
  },

  toggleTaskLog: async (taskId, date) => {
    try {
      const newLog = await taskService.toggleTaskLog(taskId, date);
      
      set((state) => {
        // If the log already exists in state, update it. Otherwise, add it.
        const logExistsIndex = state.taskLogs.findIndex(
          (log) => log.task === newLog.task && new Date(log.date).getTime() === new Date(newLog.date).getTime()
        );
        
        const newLogs = [...state.taskLogs];
        if (logExistsIndex >= 0) {
          newLogs[logExistsIndex] = newLog;
        } else {
          newLogs.push(newLog);
        }
        
        return { taskLogs: newLogs };
      });
      get().fetchStreak();
      return newLog;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  fetchStreak: async () => {
    try {
      const streak = await taskService.getStreak();
      set({ streak });
      return streak;
    } catch (error) {
      return get().streak;
    }
  },
}));
