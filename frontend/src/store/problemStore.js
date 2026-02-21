import { create } from 'zustand';
import problemService from '../services/problemService';

const useProblemStore = create((set, get) => ({
  problems: [],
  currentProblem: null,
  stats: null,
  loading: false,
  error: null,
  pagination: null,

  // Fetch all problems
  fetchProblems: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await problemService.getAll(params);
      set({ problems: data.problems, pagination: data.pagination, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch problems', loading: false });
    }
  },

  // Fetch problems by date
  fetchProblemsByDate: async (date) => {
    set({ loading: true, error: null });
    try {
      const problems = await problemService.getByDate(date);
      set({ problems, loading: false });
      return problems;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch problems', loading: false });
      return [];
    }
  },

  // Fetch single problem
  fetchProblem: async (id) => {
    set({ loading: true, error: null });
    try {
      const problem = await problemService.getById(id);
      set({ currentProblem: problem, loading: false });
      return problem;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch problem', loading: false });
      return null;
    }
  },

  // Create problem
  createProblem: async (data) => {
    set({ loading: true, error: null });
    try {
      const problem = await problemService.create(data);
      set((state) => ({
        problems: [problem, ...state.problems],
        loading: false,
      }));
      return problem;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to create problem', loading: false });
      throw error;
    }
  },

  // Update problem
  updateProblem: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const problem = await problemService.update(id, data);
      set((state) => ({
        problems: state.problems.map((p) => (p._id === id ? problem : p)),
        currentProblem: state.currentProblem?._id === id ? problem : state.currentProblem,
        loading: false,
      }));
      return problem;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to update problem', loading: false });
      throw error;
    }
  },

  // Delete problem
  deleteProblem: async (id) => {
    set({ loading: true, error: null });
    try {
      await problemService.delete(id);
      set((state) => ({
        problems: state.problems.filter((p) => p._id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to delete problem', loading: false });
      throw error;
    }
  },

  // Fetch stats
  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const stats = await problemService.getStats();
      set({ stats, loading: false });
      return stats;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch stats', loading: false });
      return null;
    }
  },

  // Clear current problem
  clearCurrentProblem: () => set({ currentProblem: null }),

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useProblemStore;
