import { create } from 'zustand';
import featureService from '../services/featureService';

export const useFeatureStore = create((set, get) => ({
  showProblems: false,
  showLeaderboard: false,
  compilerEnabled: true,
  compilerMaxRunsPerMinute: 15,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchFeatures: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await featureService.getPublicFeatures();
      set({
        showProblems: !!data.showProblems,
        showLeaderboard: !!data.showLeaderboard,
        compilerEnabled: data.compilerEnabled ?? true,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to fetch feature flags:', err);
      set({ isLoading: false, error: err.message });
    }
  },

  fetchAdminFeatures: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await featureService.getAdminFeatures();
      set({
        showProblems: !!data.showProblems,
        showLeaderboard: !!data.showLeaderboard,
        compilerEnabled: data.compilerEnabled ?? true,
        compilerMaxRunsPerMinute: data.compilerMaxRunsPerMinute ?? 15,
        isLoading: false,
      });
      return data;
    } catch (err) {
      console.error('Failed to fetch admin features:', err);
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  updateAdminFeatures: async (newSettings) => {
    try {
      set({ isSaving: true });
      const res = await featureService.updateAdminFeatures(newSettings);
      if (res.settings) {
        set({
          showProblems: !!res.settings.showProblems,
          showLeaderboard: !!res.settings.showLeaderboard,
          compilerEnabled: res.settings.compilerEnabled ?? true,
          compilerMaxRunsPerMinute: res.settings.compilerMaxRunsPerMinute ?? 15,
        });
      }
      set({ isSaving: false });
      return res;
    } catch (err) {
      set({ isSaving: false });
      throw err;
    }
  },
}));

export default useFeatureStore;
