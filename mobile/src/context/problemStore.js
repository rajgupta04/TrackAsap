import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import problemService from '../services/problemService';

const useProblemStore = create(
  persist(
    (set, get) => ({
  problems: [],
  stats: null,
  pagination: { page: 1, totalPages: 1, total: 0 },
  loading: false,
  error: null,
  
  clearStore: () => set({ problems: [], stats: null, pagination: { page: 1, totalPages: 1, total: 0 }, loading: false, error: null }),

  fetchProblems: async (params = {}) => {
    set({ loading: true });
    try {
      const res = await problemService.getAll(params);
      const data = res.data || res;
      set({
        problems: Array.isArray(data.problems || data) ? (data.problems || data) : [],
        pagination: {
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          total: data.total || 0,
        },
        loading: false,
      });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const res = await problemService.getStats();
      set({ stats: res.data || res });
    } catch (_) {}
  },

  fetchProblemsByDate: async (date) => {
    try {
      const res = await problemService.getByDate(date);
      const data = res.data || res;
      return Array.isArray(data.problems || data) ? (data.problems || data) : [];
    } catch (_) {
      return [];
    }
  },

  deleteProblem: async (id) => {
    try {
      await problemService.delete(id);
      set((state) => ({
        problems: state.problems.filter((p) => p._id !== id),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  updateNotes: async (id, notes) => {
    try {
      await problemService.updateNotes(id, notes);
      set((state) => ({
        problems: state.problems.map((p) => p._id === id ? { ...p, notes } : p),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
}), {
  name: 'problem-storage',
  storage: createJSONStorage(() => AsyncStorage),
}));

export default useProblemStore;
