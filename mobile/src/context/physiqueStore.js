import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import physiqueService from '../services/physiqueService';

const usePhysiqueStore = create(
  persist(
    (set) => ({
  logs: [],
  progress: null,
  isLoading: false,
  isSaving: false,
  error: null,

  clearStore: () => set({ logs: [], progress: null, isLoading: false, isSaving: false, error: null }),
  
  fetchAll: async () => {
    set({ isLoading: true });
    try {
      const res = await physiqueService.getAll();
      const data = res.data || res;
      set({ logs: Array.isArray(data) ? data : [], isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchProgress: async () => {
    try {
      const res = await physiqueService.getProgress();
      set({ progress: res.data || res });
    } catch (_) {}
  },

  addLog: async (logData) => {
    set({ isSaving: true });
    try {
      const res = await physiqueService.addLog(logData);
      const saved = res.data || res;
      set((state) => ({
        logs: [saved, ...state.logs].sort((a, b) => new Date(b.date) - new Date(a.date)),
        isSaving: false,
      }));
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to add log';
      set({ error: msg, isSaving: false });
      return { success: false, error: msg };
    }
  },

  deleteLog: async (id) => {
    set({ isSaving: true });
    try {
      await physiqueService.deleteLog(id);
      set((state) => ({
        logs: state.logs.filter((l) => l._id !== id),
        isSaving: false,
      }));
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to delete log';
      set({ error: msg, isSaving: false });
      return { success: false, error: msg };
    }
  },
}), {
  name: 'physique-storage',
  storage: createJSONStorage(() => AsyncStorage),
}));

export default usePhysiqueStore;
