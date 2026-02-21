import { create } from 'zustand';
import { physiqueService } from '../services/physiqueService';

export const usePhysiqueStore = create((set, get) => ({
  logs: [],
  progress: null,
  isLoading: false,
  error: null,

  fetchAll: async () => {
    set({ isLoading: true });
    try {
      const logs = await physiqueService.getAll();
      set({ logs, isLoading: false });
      return logs;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return [];
    }
  },

  fetchProgress: async () => {
    set({ isLoading: true });
    try {
      const progress = await physiqueService.getProgress();
      set({ progress, isLoading: false });
      return progress;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  addLog: async (data) => {
    try {
      const newLog = await physiqueService.add(data);
      set({ logs: [newLog, ...get().logs] });
      get().fetchProgress(); // Refresh progress
      return { success: true, data: newLog };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  deleteLog: async (id) => {
    try {
      await physiqueService.delete(id);
      set({ logs: get().logs.filter((log) => log._id !== id) });
      get().fetchProgress();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
}));
