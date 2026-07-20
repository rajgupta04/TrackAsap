import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTimerStore = create(
  persist(
    (set, get) => ({
      mode: 'stopwatch', // currently active view in modal
      display: 'digital', 
      
      stopwatch: {
        isRunning: false,
        startTime: null,
        accumulatedTime: 0,
      },
      
      timer: {
        isRunning: false,
        startTime: null,
        accumulatedTime: 0,
        duration: 25 * 60 * 1000,
      },

      setMode: (mode) => set({ mode }),
      setDisplay: (display) => set({ display }),
      
      setDuration: (ms) => {
        set((state) => ({
          timer: {
            ...state.timer,
            duration: ms,
            accumulatedTime: 0,
            startTime: state.timer.isRunning ? Date.now() : null
          }
        }));
      },

      start: (targetMode) => {
        const m = targetMode || get().mode;
        if (!get()[m].isRunning) {
          set((state) => ({
            [m]: {
              ...state[m],
              isRunning: true,
              startTime: Date.now()
            }
          }));
        }
      },

      pause: (targetMode) => {
        const m = targetMode || get().mode;
        const targetState = get()[m];
        if (targetState.isRunning) {
          const now = Date.now();
          const elapsed = now - targetState.startTime;
          set((state) => ({
            [m]: {
              ...state[m],
              isRunning: false,
              accumulatedTime: state[m].accumulatedTime + elapsed,
              startTime: null
            }
          }));
        }
      },

      reset: (targetMode) => {
        const m = targetMode || get().mode;
        set((state) => ({
          [m]: {
            ...state[m],
            isRunning: false,
            startTime: null,
            accumulatedTime: 0
          }
        }));
      },

      // Helper to calculate current active time in ms for a specific mode
      getCurrentTimeMs: (targetMode) => {
        const m = targetMode || get().mode;
        const targetState = get()[m];
        
        let total = targetState.accumulatedTime;
        if (targetState.isRunning && targetState.startTime) {
          total += (Date.now() - targetState.startTime);
        }
        
        if (m === 'timer') {
          return Math.max(0, targetState.duration - total);
        }
        return total;
      }
    }),
    {
      name: 'trackasap-timer-storage-v2', // Change name to avoid conflicts with previous version
    }
  )
);
