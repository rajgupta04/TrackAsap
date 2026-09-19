import { create } from 'zustand';
import sheetService from '../services/sheetService';
import localforage from 'localforage';
import { useGuestStore } from './guestStore';

const useSheetStore = create((set, get) => ({
  sheets: [],
  currentSheet: null,
  sheetProblems: [],
  templates: [],
  loading: false,
  error: null,

  // Fetch all sheets (silent = true for background refresh without loading state)
  fetchSheets: async (silent = false) => {
    const hasToken = !!localStorage.getItem('token');

    // Guest mode: load sheets from guestStore
    if (!hasToken) {
      if (!silent) set({ loading: true, error: null });
      try {
        const sheets = await useGuestStore.getState().loadGuestSheets();
        set({ sheets, loading: false });
        return sheets;
      } catch (err) {
        if (!silent) set({ error: 'Failed to load local sheets', loading: false });
        return [];
      }
    }

    try {
      const cachedSheets = await localforage.getItem('all_sheets');
      if (cachedSheets) {
        set({ sheets: cachedSheets });
        silent = true; // Make network fetch silent if we have cache
      }
    } catch (err) {
      console.warn('Failed to read sheets from cache', err);
    }

    if (!silent) set({ loading: true, error: null });
    try {
      const sheets = await sheetService.getAll();
      set({ sheets, loading: false });
      localforage.setItem('all_sheets', sheets).catch(console.warn);
    } catch (error) {
      if (!silent) set({ error: error.response?.data?.message || 'Failed to fetch sheets', loading: false });
    }
  },

  // Fetch single sheet with problems (silent = true for background refresh)
  fetchSheet: async (id, silent = false) => {
    const hasToken = !!localStorage.getItem('token');

    // Guest sheet or unauthenticated
    if (!hasToken || String(id).startsWith('guest_')) {
      if (!silent) set({ loading: true, error: null });
      try {
        let guestSheets = useGuestStore.getState().guestSheets;
        let sheet = guestSheets.find(s => s._id === id);
        if (!sheet) {
          guestSheets = await useGuestStore.getState().loadGuestSheets();
          sheet = guestSheets.find(s => s._id === id);
        }
        const cachedData = await localforage.getItem(`sheetProblems_${id}`);
        const problems = cachedData?.problems || {};
        if (sheet) {
          set({ currentSheet: sheet, sheetProblems: problems, loading: false });
          return { sheet, problems };
        }
      } catch (err) {
        console.warn('Failed to load guest sheet', err);
      }
    }

    try {
      const cachedData = await localforage.getItem(`sheet_${id}`);
      if (cachedData) {
        set({ currentSheet: cachedData.sheet, sheetProblems: cachedData.problems });
        silent = true;
      }
    } catch (err) {
      console.warn('Failed to read sheet from cache', err);
    }

    if (!silent) set({ loading: true, error: null });
    try {
      const { sheet, problems } = await sheetService.getById(id);
      set({ currentSheet: sheet, sheetProblems: problems, loading: false });
      localforage.setItem(`sheet_${id}`, { sheet, problems }).catch(console.warn);
      return { sheet, problems };
    } catch (error) {
      if (!silent) set({ error: error.response?.data?.message || 'Failed to fetch sheet', loading: false });
      return null;
    }
  },

  // Create sheet
  createSheet: async (data) => {
    const hasToken = !!localStorage.getItem('token');

    if (!hasToken) {
      set({ loading: true, error: null });
      try {
        const sheet = await useGuestStore.getState().createGuestSheet(data);
        set((state) => ({
          sheets: [sheet, ...state.sheets],
          loading: false,
        }));
        return sheet;
      } catch (err) {
        set({ error: err.message || 'Failed to create guest sheet', loading: false });
        throw err;
      }
    }

    set({ loading: true, error: null });
    try {
      const sheet = await sheetService.create(data);
      set((state) => ({
        sheets: [sheet, ...state.sheets],
        loading: false,
      }));
      return sheet;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to create sheet', loading: false });
      throw error;
    }
  },

  // Update sheet
  updateSheet: async (id, data) => {
    const hasToken = !!localStorage.getItem('token');

    if (!hasToken || String(id).startsWith('guest_')) {
      await useGuestStore.getState().updateGuestSheet(id, data);
      set((state) => ({
        sheets: state.sheets.map((s) => (s._id === id ? { ...s, ...data } : s)),
        currentSheet: state.currentSheet?._id === id ? { ...state.currentSheet, ...data } : state.currentSheet,
        loading: false,
      }));
      return { _id: id, ...data };
    }

    set({ loading: true, error: null });
    try {
      const sheet = await sheetService.update(id, data);
      set((state) => ({
        sheets: state.sheets.map((s) => (s._id === id ? sheet : s)),
        currentSheet: state.currentSheet?._id === id ? sheet : state.currentSheet,
        loading: false,
      }));
      return sheet;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to update sheet', loading: false });
      throw error;
    }
  },

  // Delete sheet
  deleteSheet: async (id) => {
    const hasToken = !!localStorage.getItem('token');

    if (!hasToken || String(id).startsWith('guest_')) {
      await useGuestStore.getState().deleteGuestSheet(id);
      set((state) => ({
        sheets: state.sheets.filter((s) => s._id !== id),
        loading: false,
      }));
      return;
    }

    set({ loading: true, error: null });
    try {
      await sheetService.delete(id);
      set((state) => ({
        sheets: state.sheets.filter((s) => s._id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to delete sheet', loading: false });
      throw error;
    }
  },

  // Add topic to sheet
  addTopic: async (sheetId, topicData) => {
    set({ loading: true, error: null });
    try {
      const sheet = await sheetService.addTopic(sheetId, topicData);
      set((state) => ({
        sheets: state.sheets.map((s) => (s._id === sheetId ? sheet : s)),
        currentSheet: state.currentSheet?._id === sheetId ? sheet : state.currentSheet,
        loading: false,
      }));
      return sheet;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to add topic', loading: false });
      throw error;
    }
  },

  // Update topic progress
  updateTopicProgress: async (sheetId, topicName, data) => {
    set({ loading: true, error: null });
    try {
      const sheet = await sheetService.updateTopic(sheetId, topicName, data);
      set((state) => ({
        sheets: state.sheets.map((s) => (s._id === sheetId ? sheet : s)),
        currentSheet: state.currentSheet?._id === sheetId ? sheet : state.currentSheet,
        loading: false,
      }));
      return sheet;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to update topic', loading: false });
      throw error;
    }
  },

  // Fetch templates
  fetchTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const templates = await sheetService.getTemplates();
      set({ templates, loading: false });
      return templates;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch templates', loading: false });
      return [];
    }
  },

  // Clear current sheet
  clearCurrentSheet: () => set({ currentSheet: null, sheetProblems: [] }),

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useSheetStore;
