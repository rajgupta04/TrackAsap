import { create } from 'zustand';
import localforage from 'localforage';

const GUEST_SHEETS_KEY = 'trackasap_guest_sheets';

export const useGuestStore = create((set, get) => ({
  guestSheets: [],
  isLoading: false,

  // Load guest sheets from IndexedDB on startup
  loadGuestSheets: async () => {
    try {
      set({ isLoading: true });
      const storedSheets = await localforage.getItem(GUEST_SHEETS_KEY);
      const sheets = Array.isArray(storedSheets) ? storedSheets : [];
      set({ guestSheets: sheets, isLoading: false });
      return sheets;
    } catch (err) {
      console.warn('Failed to load guest sheets from localforage:', err);
      set({ guestSheets: [], isLoading: false });
      return [];
    }
  },

  // Create a new guest sheet
  createGuestSheet: async ({
    name,
    description = '',
    category = 'dsa',
    color = '#39FF14',
    icon = 'code',
    topics = [],
    problems = [],
  }) => {
    const sheetId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    // Group problems by topic
    const groupedProblems = {};
    const formattedProblems = problems.map((p, idx) => {
      const probId = p._id || `gprob_${Date.now()}_${idx}`;
      const topicName = p.topic || 'General';
      const formatted = {
        _id: probId,
        sheet: sheetId,
        title: p.title || `Problem ${idx + 1}`,
        topic: topicName,
        difficulty: p.difficulty || 'medium',
        problemLink: p.problemLink || '',
        articleLink: p.articleLink || '',
        youtubeLink: p.youtubeLink || '',
        problemKey: p.problemKey || '',
        platform: p.platform || 'leetcode',
        tags: p.tags || [],
        order: idx,
        status: p.status || 'pending',
        notes: p.notes || '',
        code: p.code || '',
        language: p.language || 'cpp',
        solutions: p.solutions || [],
      };

      if (!groupedProblems[topicName]) groupedProblems[topicName] = [];
      groupedProblems[topicName].push(formatted);

      return formatted;
    });

    const solvedCount = formattedProblems.filter(p => p.status === 'solved').length;
    const totalCount = formattedProblems.length;

    // Build topic summaries
    const finalTopics = topics.length > 0
      ? topics.map((t, idx) => ({
          name: t.name,
          description: t.description || '',
          order: t.order ?? idx,
          totalProblems: (groupedProblems[t.name] || []).length || t.totalProblems || 0,
          solvedProblems: (groupedProblems[t.name] || []).filter(p => p.status === 'solved').length || 0,
        }))
      : Object.keys(groupedProblems).map((tName, idx) => ({
          name: tName,
          description: '',
          order: idx,
          totalProblems: groupedProblems[tName].length,
          solvedProblems: groupedProblems[tName].filter(p => p.status === 'solved').length,
        }));

    const newSheet = {
      _id: sheetId,
      name,
      description,
      category,
      color,
      icon,
      topics: finalTopics,
      totalProblems: totalCount,
      solvedProblems: solvedCount,
      isGuest: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save problems to localforage cache so SheetProblemsView loads instantly
    const problemsCacheData = {
      problems: groupedProblems,
      rawProblems: formattedProblems,
      stats: {
        total: totalCount,
        solved: solvedCount,
        revision: formattedProblems.filter(p => p.status === 'revision').length,
        pending: formattedProblems.filter(p => p.status === 'pending').length,
      },
    };

    await localforage.setItem(`sheetProblems_${sheetId}`, problemsCacheData);

    const current = get().guestSheets;
    const updated = [newSheet, ...current];
    await localforage.setItem(GUEST_SHEETS_KEY, updated);
    set({ guestSheets: updated });

    return newSheet;
  },

  // Update a guest sheet metadata
  updateGuestSheet: async (sheetId, updates) => {
    const current = get().guestSheets;
    const updated = current.map(s => (s._id === sheetId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s));
    await localforage.setItem(GUEST_SHEETS_KEY, updated);
    set({ guestSheets: updated });
  },

  // Delete a guest sheet
  deleteGuestSheet: async (sheetId) => {
    const current = get().guestSheets;
    const updated = current.filter(s => s._id !== sheetId);
    await localforage.removeItem(`sheetProblems_${sheetId}`);
    await localforage.setItem(GUEST_SHEETS_KEY, updated);
    set({ guestSheets: updated });
  },

  // Update problem status within a guest sheet
  updateGuestProblemStatus: async (sheetId, problemId, newStatus) => {
    try {
      const cacheKey = `sheetProblems_${sheetId}`;
      const cached = await localforage.getItem(cacheKey);
      if (!cached) return;

      const rawProblems = cached.rawProblems.map(p =>
        p._id === problemId ? { ...p, status: newStatus } : p
      );

      const groupedProblems = {};
      rawProblems.forEach(p => {
        if (!groupedProblems[p.topic]) groupedProblems[p.topic] = [];
        groupedProblems[p.topic].push(p);
      });

      const solved = rawProblems.filter(p => p.status === 'solved').length;
      const revision = rawProblems.filter(p => p.status === 'revision').length;
      const pending = rawProblems.filter(p => p.status === 'pending').length;

      const updatedCache = {
        problems: groupedProblems,
        rawProblems,
        stats: {
          total: rawProblems.length,
          solved,
          revision,
          pending,
        },
      };

      await localforage.setItem(cacheKey, updatedCache);

      // Update sheet-level solved counters
      const sheets = get().guestSheets;
      const updatedSheets = sheets.map(s => {
        if (s._id === sheetId) {
          const updatedTopics = (s.topics || []).map(t => ({
            ...t,
            solvedProblems: (groupedProblems[t.name] || []).filter(p => p.status === 'solved').length,
          }));
          return {
            ...s,
            solvedProblems: solved,
            topics: updatedTopics,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });

      await localforage.setItem(GUEST_SHEETS_KEY, updatedSheets);
      set({ guestSheets: updatedSheets });

      return updatedCache;
    } catch (err) {
      console.error('Failed to update guest problem status:', err);
    }
  },

  // Import a curated bucket directly as a guest sheet
  importBucketAsGuest: async (bucket, customName) => {
    const rawProblems = bucket.problems || [];
    const topics = (bucket.topics || []).map((tName, i) => ({
      name: tName,
      order: i,
      totalProblems: rawProblems.filter(p => p.topic === tName).length,
      solvedProblems: 0,
    }));

    return await get().createGuestSheet({
      name: customName || bucket.name,
      description: bucket.description || '',
      category: bucket.category || 'dsa',
      color: bucket.color || '#00FF88',
      icon: bucket.icon || 'BookOpen',
      topics,
      problems: rawProblems,
    });
  },

  // Generate payload for migrating guest sheets to server
  getMigrationPayload: async () => {
    const sheets = get().guestSheets;
    if (!sheets.length) return [];

    const payload = [];
    for (const s of sheets) {
      const cache = await localforage.getItem(`sheetProblems_${s._id}`);
      payload.push({
        name: s.name,
        description: s.description || '',
        category: s.category || 'dsa',
        color: s.color,
        icon: s.icon,
        topics: s.topics || [],
        problems: cache?.rawProblems || [],
      });
    }
    return payload;
  },

  // Wipe all guest data after migration
  clearGuestData: async () => {
    const sheets = get().guestSheets;
    for (const s of sheets) {
      await localforage.removeItem(`sheetProblems_${s._id}`).catch(() => {});
    }
    await localforage.removeItem(GUEST_SHEETS_KEY).catch(() => {});
    set({ guestSheets: [] });
  },
}));
