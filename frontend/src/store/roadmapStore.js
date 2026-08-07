import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WORLDS } from '../data/roadmapData';
import { roadmapService } from '../services/roadmapService';

let syncTimeout = null;

export const useRoadmapStore = create()(
  persist(
    (set, get) => ({
      completedProblems: [], // Array of problem IDs
      completedWorlds: [],   // Array of world IDs
      unlockedWorlds: ['arrays'], // Array of unlocked world IDs
      totalXP: 0,
      coins: 0,
      awardedCoinProblems: [], // Array of problem IDs that already paid coins
      awardedCoinWorlds: [],   // Array of world IDs that already paid coins
      justCompletedWorldId: null, // Tracked for path completion animation
      activeWorldId: null, // Currently open world in modal

      syncToServer: async () => {
        if (syncTimeout) {
          clearTimeout(syncTimeout);
        }
        syncTimeout = setTimeout(async () => {
          try {
            const state = get();
            const payload = {
              completedProblems: state.completedProblems || [],
              completedWorlds: state.completedWorlds || [],
              unlockedWorlds: state.unlockedWorlds || ['arrays'],
              totalXP: state.totalXP || 0,
              coins: state.coins || 0,
              awardedCoinProblems: state.awardedCoinProblems || [],
              awardedCoinWorlds: state.awardedCoinWorlds || [],
              questionMode: state.questionMode || 'blind75',
              unlockedAudioTracks: state.unlockedAudioTracks || [],
              problemNotes: state.problemNotes || {},
              problemCode: state.problemCode || {}
            };
            await roadmapService.saveProgress(payload);
          } catch (error) {
            console.error('Failed to sync roadmap progress to server', error);
          }
        }, 2000);
      },

      loadFromServer: async () => {
        try {
          const data = await roadmapService.getProgress();
          if (data) {
            set((state) => {
              // Helper: union two arrays (no duplicates)
              const union = (a = [], b = []) => [...new Set([...a, ...b])];
              // Helper: merge two objects (shallow, prefer non-empty)
              const mergeObj = (a = {}, b = {}) => ({ ...a, ...b });

              return {
                ...state,
                completedProblems: union(state.completedProblems, data.completedProblems),
                completedWorlds: union(state.completedWorlds, data.completedWorlds),
                unlockedWorlds: union(state.unlockedWorlds, data.unlockedWorlds),
                totalXP: Math.max(state.totalXP || 0, data.totalXP || 0),
                coins: Math.max(state.coins || 0, data.coins || 0),
                awardedCoinProblems: union(state.awardedCoinProblems, data.awardedCoinProblems),
                awardedCoinWorlds: union(state.awardedCoinWorlds, data.awardedCoinWorlds),
                questionMode: data.questionMode || state.questionMode,
                unlockedAudioTracks: union(state.unlockedAudioTracks, data.unlockedAudioTracks),
                problemNotes: mergeObj(state.problemNotes, data.problemNotes),
                problemCode: mergeObj(state.problemCode, data.problemCode),
              };
            });
          }
        } catch (error) {
          console.error('Failed to load roadmap progress from server', error);
        }
      },

      isProblemCompleted: (problemId) => {
        const completed = get().completedProblems || [];
        return completed.includes(problemId);
      },

      isWorldUnlocked: (worldId) => {
        const unlocked = get().unlockedWorlds || ['arrays'];
        return unlocked.includes(worldId);
      },

      isWorldCompleted: (worldId) => {
        const completed = get().completedWorlds || [];
        return completed.includes(worldId);
      },

      getWorldProgress: (worldId) => {
        const world = WORLDS.find((w) => w.id === worldId);
        if (!world) return { solved: 0, total: 0, percentage: 0 };

        const mode = get().questionMode || 'blind75';
        const activeProblems = world.problems.filter((p) => p[mode]);
        
        const completed = get().completedProblems || [];
        const solved = activeProblems.filter((p) => completed.includes(p.id)).length;
        const total = activeProblems.length;
        const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;
        
        return { solved, total, percentage };
      },

      completeProblem: (worldId, problemId, xp) => {
        const { completedProblems = [], totalXP = 0, coins = 0, awardedCoinProblems = [] } = get();
        if (completedProblems.includes(problemId)) return;

        const newCompletedProblems = [...completedProblems, problemId];
        const newTotalXP = totalXP + xp;
        
        let newCoins = coins;
        const newAwardedCoinProblems = [...awardedCoinProblems];

        // Only award coins if this problem has NOT previously paid out
        if (!awardedCoinProblems.includes(problemId)) {
          newCoins += Math.round(xp / 2);
          newAwardedCoinProblems.push(problemId);
        }

        set({
          completedProblems: newCompletedProblems,
          totalXP: newTotalXP,
          coins: newCoins,
          awardedCoinProblems: newAwardedCoinProblems
        });
        get().syncToServer();
      },

      completeBossLevel: (worldId) => {
        const { completedWorlds = [], unlockedWorlds = ['arrays'], totalXP = 0, coins = 0, awardedCoinWorlds = [] } = get();
        if (completedWorlds.includes(worldId)) return;

        const worldIndex = WORLDS.findIndex((w) => w.id === worldId);
        if (worldIndex === -1) return;

        const world = WORLDS[worldIndex];
        const bossXP = world.bossLevel.xp;
        const clearBonus = 200; // World completion bonus
        const totalEarnedXP = bossXP + clearBonus;

        const newCompletedWorlds = [...completedWorlds, worldId];
        const newUnlockedWorlds = [...unlockedWorlds];
        const newUnlockedAudioTracks = [...(get().unlockedAudioTracks || [])];

        // Unlock the next world if it exists
        const nextWorld = WORLDS[worldIndex + 1];
        if (nextWorld) {
          if (!newUnlockedWorlds.includes(nextWorld.id)) {
            newUnlockedWorlds.push(nextWorld.id);
          }
          if (!newUnlockedAudioTracks.includes(nextWorld.id)) {
            newUnlockedAudioTracks.push(nextWorld.id);
          }
        }

        let newCoins = coins;
        const newAwardedCoinWorlds = [...awardedCoinWorlds];

        // Only award boss coins if this world has NOT previously paid out
        if (!awardedCoinWorlds.includes(worldId)) {
          newCoins += 150; // Boss clear coins
          newAwardedCoinWorlds.push(worldId);
        }

        set({
          completedWorlds: newCompletedWorlds,
          unlockedWorlds: newUnlockedWorlds,
          unlockedAudioTracks: newUnlockedAudioTracks,
          totalXP: totalXP + totalEarnedXP,
          coins: newCoins,
          awardedCoinWorlds: newAwardedCoinWorlds,
          justCompletedWorldId: worldId
        });
        get().syncToServer();
      },

      setActiveWorldId: (worldId) => {
        set({ activeWorldId: worldId });
      },

      clearJustCompletedWorld: () => {
        set({ justCompletedWorldId: null });
      },

      isAudioMuted: false,
      toggleAudioMute: () => {
        set((state) => ({ isAudioMuted: !state.isAudioMuted }));
      },

      selectedAudioTrack: null,
      setSelectedAudioTrack: (trackId) => {
        set({ selectedAudioTrack: trackId });
      },

      questionMode: 'blind75',
      setQuestionMode: (mode) => {
        set({ questionMode: mode });
        get().syncToServer();
      },

      unlockedAudioTracks: [],
      unlockTrackWithCoins: (worldId, cost) => {
        const { coins, unlockedAudioTracks = [] } = get();
        if (coins < cost) return;
        set({
          coins: coins - cost,
          unlockedAudioTracks: [...unlockedAudioTracks, worldId]
        });
        get().syncToServer();
      },

      problemNotes: {},
      problemCode: {},
      saveProblemNotes: (problemId, notes) => {
        set((state) => ({
          problemNotes: {
            ...state.problemNotes,
            [problemId]: notes
          }
        }));
        get().syncToServer();
      },
      saveProblemCode: (problemId, code, language, solutions) => {
        set((state) => ({
          problemCode: {
            ...state.problemCode,
            [problemId]: { code, language, solutions }
          }
        }));
        get().syncToServer();
      },

      resetProgress: () => {
        set({
          completedProblems: [],
          completedWorlds: [],
          unlockedWorlds: ['arrays'],
          // Coins, totalXP, awarded logs, and unlockedAudioTracks are explicitly preserved (not reset)
          justCompletedWorldId: null,
          activeWorldId: null,
          selectedAudioTrack: null,
          questionMode: 'blind75'
        });
        get().syncToServer();
      }
    }),
    {
      name: 'trackasap_roadmap_progress',
      partialize: (state) => ({
        completedProblems: state.completedProblems || [],
        completedWorlds: state.completedWorlds || [],
        unlockedWorlds: state.unlockedWorlds || ['arrays'],
        totalXP: state.totalXP || 0,
        coins: state.coins || 0,
        awardedCoinProblems: state.awardedCoinProblems || [],
        awardedCoinWorlds: state.awardedCoinWorlds || [],
        isAudioMuted: state.isAudioMuted ?? false,
        selectedAudioTrack: state.selectedAudioTrack ?? null,
        questionMode: state.questionMode ?? 'blind75',
        unlockedAudioTracks: state.unlockedAudioTracks || [],
        problemNotes: state.problemNotes || {},
        problemCode: state.problemCode || {},
      }),
    }
  )
);
