import { create } from 'zustand';
import { dailyLogService } from '../services/dailyLogService';
import { format } from 'date-fns';

const initialLogState = {
  leetcode: { contestParticipated: false, problemsSolved: 0, problemDifficulty: 'none' },
  codechef: { dailyProblem: false, contestParticipated: false, problemsSolved: 0 },
  codeforces: { problemsSolved: 0, contestParticipated: false, rating: null },
  gym: { completed: false, workoutType: 'none', duration: 0 },
  diet: { cleanDiet: false, calories: null, protein: null, notes: '' },
  internshipPrep: { completed: false, hoursSpent: 0, topics: [] },
  notes: '',
};

export const useDailyLogStore = create((set, get) => ({
  logs: [],
  currentLog: null,
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  streak: { currentStreak: 0, longestStreak: 0, lastActiveDate: null },
  isLoading: false,
  isSaving: false,
  error: null,

  setSelectedDate: (date) => set({ selectedDate: date }),

  fetchLogByDate: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const log = await dailyLogService.getByDate(date);
      set({ currentLog: log, isLoading: false });
      return log;
    } catch (error) {
      set({ 
        currentLog: { ...initialLogState, date, isNew: true },
        isLoading: false 
      });
      return null;
    }
  },

  fetchAllLogs: async () => {
    set({ isLoading: true });
    try {
      const logs = await dailyLogService.getAll();
      set({ logs, isLoading: false });
      return logs;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return [];
    }
  },

  saveLog: async (logData) => {
    set({ isSaving: true, error: null });
    try {
      const saved = await dailyLogService.createOrUpdate({
        ...logData,
        date: get().selectedDate,
      });
      set({ currentLog: saved, isSaving: false });
      
      // Refresh streak after save
      const streakData = await get().fetchStreak();
      
      return { success: true, data: saved, streak: streakData?.currentStreak || 0 };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save';
      set({ error: message, isSaving: false });
      return { success: false, error: message };
    }
  },

  updateCurrentLog: (field, value) => {
    const currentLog = get().currentLog || { ...initialLogState };
    
    // Handle nested fields
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      set({
        currentLog: {
          ...currentLog,
          [parent]: {
            ...currentLog[parent],
            [child]: value,
          },
        },
      });
    } else {
      set({
        currentLog: {
          ...currentLog,
          [field]: value,
        },
      });
    }
  },

  fetchStreak: async () => {
    try {
      const streak = await dailyLogService.getStreak();
      set({ streak });
      return streak;
    } catch (error) {
      return get().streak;
    }
  },

  deleteLog: async (date) => {
    try {
      await dailyLogService.delete(date);
      set({ currentLog: null });
      get().fetchStreak();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  resetCurrentLog: () => set({ currentLog: null }),
}));
