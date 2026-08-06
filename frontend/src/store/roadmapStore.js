import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WORLDS, getRankByXP } from '../data/roadmapData';

export const useRoadmapStore = create()(
  persist(
    (set, get) => ({
      completedProblems: [], // Array of problem IDs
      completedWorlds: [],   // Array of world IDs
      unlockedWorlds: ['arrays'], // Array of unlocked world IDs
      totalXP: 0,
      coins: 0,
      justCompletedWorldId: null, // Tracked for path completion animation
      activeWorldId: null, // Currently open world in modal

      isProblemCompleted: (problemId) => {
        return get().completedProblems.includes(problemId);
      },

      isWorldUnlocked: (worldId) => {
        return get().unlockedWorlds.includes(worldId);
      },

      isWorldCompleted: (worldId) => {
        return get().completedWorlds.includes(worldId);
      },

      getWorldProgress: (worldId) => {
        const world = WORLDS.find((w) => w.id === worldId);
        if (!world) return { solved: 0, total: 0, percentage: 0 };
        
        const solved = world.problems.filter((p) => get().completedProblems.includes(p.id)).length;
        const total = world.problems.length;
        const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;
        
        return { solved, total, percentage };
      },

      completeProblem: (worldId, problemId, xp) => {
        const { completedProblems, totalXP, coins } = get();
        if (completedProblems.includes(problemId)) return;

        const newCompletedProblems = [...completedProblems, problemId];
        const newTotalXP = totalXP + xp;
        const newCoins = coins + Math.round(xp / 2);

        set({
          completedProblems: newCompletedProblems,
          totalXP: newTotalXP,
          coins: newCoins
        });
      },

      completeBossLevel: (worldId) => {
        const { completedWorlds, unlockedWorlds, totalXP, coins } = get();
        if (completedWorlds.includes(worldId)) return;

        const worldIndex = WORLDS.findIndex((w) => w.id === worldId);
        if (worldIndex === -1) return;

        const world = WORLDS[worldIndex];
        const bossXP = world.bossLevel.xp;
        const clearBonus = 200; // World completion bonus
        const totalEarnedXP = bossXP + clearBonus;

        const newCompletedWorlds = [...completedWorlds, worldId];
        const newUnlockedWorlds = [...unlockedWorlds];

        // Unlock the next world if it exists
        const nextWorld = WORLDS[worldIndex + 1];
        if (nextWorld && !newUnlockedWorlds.includes(nextWorld.id)) {
          newUnlockedWorlds.push(nextWorld.id);
        }

        set({
          completedWorlds: newCompletedWorlds,
          unlockedWorlds: newUnlockedWorlds,
          totalXP: totalXP + totalEarnedXP,
          coins: coins + 150, // Boss clear coins
          justCompletedWorldId: worldId
        });
      },

      setActiveWorldId: (worldId) => {
        set({ activeWorldId: worldId });
      },

      clearJustCompletedWorld: () => {
        set({ justCompletedWorldId: null });
      },

      resetProgress: () => {
        set({
          completedProblems: [],
          completedWorlds: [],
          unlockedWorlds: ['arrays'],
          totalXP: 0,
          coins: 0,
          justCompletedWorldId: null,
          activeWorldId: null
        });
      }
    }),
    {
      name: 'trackasap_roadmap_progress',
      partialize: (state) => ({
        completedProblems: state.completedProblems,
        completedWorlds: state.completedWorlds,
        unlockedWorlds: state.unlockedWorlds,
        totalXP: state.totalXP,
        coins: state.coins,
      }),
    }
  )
);
