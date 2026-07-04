import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import taskService from '../services/taskService';
import { formatToISODate } from '../utils/dateUtils';

const EMPTY_LOG = {
  isNew: true,
  leetcode: { problemsSolved: 0, contestParticipated: false, problemDifficulty: 'none' },
  codechef: { dailyProblem: false, contestParticipated: false, problemsSolved: 0 },
  codeforces: { problemsSolved: 0, contestParticipated: false, rating: null },
  gym: { completed: false, workoutType: 'none', duration: 0 },
  diet: { cleanDiet: false, calories: null, protein: null, notes: '' },
  internshipPrep: { completed: false, hoursSpent: 0 },
  notes: '',
};

const useDailyLogStore = create(
  persist(
    (set, get) => ({
  currentLog: { ...EMPTY_LOG },
  selectedDate: formatToISODate(new Date()),
  streak: { currentStreak: 0, longestStreak: 0 },
  allLogs: [],
  isLoading: false,
  isSaving: false,
  error: null,

  clearStore: () => set({ currentLog: { ...EMPTY_LOG }, selectedDate: formatToISODate(new Date()), streak: { currentStreak: 0, longestStreak: 0 }, allLogs: [], isLoading: false, isSaving: false, error: null }),

  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },

  fetchLogByDate: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const res = await taskService.getLogByDate(date);
      const log = res.data || res;
      set({ currentLog: { ...log, isNew: false }, isLoading: false });
    } catch (err) {
      if (err?.response?.status === 404) {
        // No log for this date — start fresh
        set({ currentLog: { ...EMPTY_LOG, date }, isLoading: false });
      } else {
        set({ error: err.message, isLoading: false });
      }
    }
  },

  updateCurrentLog: (fieldPath, value) => {
    const current = get().currentLog;
    const keys = fieldPath.split('.');
    const updated = JSON.parse(JSON.stringify(current)); // deep clone
    let ref = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!ref[keys[i]]) ref[keys[i]] = {};
      ref = ref[keys[i]];
    }
    ref[keys[keys.length - 1]] = value;
    set({ currentLog: updated });
  },

  saveLog: async (logData) => {
    set({ isSaving: true, error: null });
    try {
      const res = await taskService.saveDailyLog(logData);
      const saved = res.data || res;
      set({ currentLog: { ...saved, isNew: false }, isSaving: false });
      // Refresh streak
      const streakRes = await taskService.getStreak();
      const streakData = streakRes.data || streakRes;
      set({ streak: { currentStreak: streakData.currentStreak || 0, longestStreak: streakData.longestStreak || 0 } });
      return { success: true, streak: streakData.currentStreak || 0 };
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to save log';
      set({ error: msg, isSaving: false });
      return { success: false, error: msg };
    }
  },

  deleteLog: async (date) => {
    set({ isSaving: true });
    try {
      await taskService.deleteLog(date);
      set({ currentLog: { ...EMPTY_LOG, date }, isSaving: false });
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to delete log';
      set({ error: msg, isSaving: false });
      return { success: false, error: msg };
    }
  },

  fetchStreak: async () => {
    try {
      const res = await taskService.getStreak();
      const data = res.data || res;
      const streak = { currentStreak: data.currentStreak || 0, longestStreak: data.longestStreak || 0 };
      set({ streak });
      return streak;
    } catch (_) {
      return { currentStreak: 0, longestStreak: 0 };
    }
  },

  fetchAllLogs: async () => {
    try {
      const res = await taskService.getAllLogs();
      const data = res.data || res;
      set({ allLogs: Array.isArray(data) ? data : [] });
    } catch (_) {}
  },
}), {
  name: 'daily-log-storage',
  storage: createJSONStorage(() => AsyncStorage),
}));

export default useDailyLogStore;
