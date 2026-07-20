import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTimerStore = create(
  persist(
    (set, get) => ({
      mode: 'stopwatch', // 'stopwatch' | 'timer'
      display: 'digital', // 'digital' | 'analog'
      isRunning: false,
      startTime: null,
      accumulatedTime: 0,
      duration: 25 * 60 * 1000, // default 25 mins for timer

      setMode: (mode) => set({ mode }),
      setDisplay: (display) => set({ display }),
      
      setDuration: (ms) => {
        set({ 
          duration: ms, 
          accumulatedTime: 0,
          startTime: get().isRunning ? Date.now() : null
        });
      },

      start: () => {
        if (!get().isRunning) {
          set({ isRunning: true, startTime: Date.now() });
        }
      },

      pause: () => {
        const state = get();
        if (state.isRunning) {
          const now = Date.now();
          const elapsed = now - state.startTime;
          set({
            isRunning: false,
            accumulatedTime: state.accumulatedTime + elapsed,
            startTime: null
          });
        }
      },

      reset: () => {
        set({
          isRunning: false,
          startTime: null,
          accumulatedTime: 0
        });
      },

      // Helper to calculate current active time in ms
      getCurrentTimeMs: () => {
        const state = get();
        let total = state.accumulatedTime;
        if (state.isRunning && state.startTime) {
          total += (Date.now() - state.startTime);
        }
        
        if (state.mode === 'timer') {
          return Math.max(0, state.duration - total);
        }
        return total;
      }
    }),
    {
      name: 'trackasap-timer-storage',
    }
  )
);
