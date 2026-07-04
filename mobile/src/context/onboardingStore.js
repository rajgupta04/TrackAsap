import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useOnboardingStore = create(
  persist(
    (set, get) => ({
      seenSheetsTourByUserV2: {},
      hasUserSeenSheetsTour: (userId) => {
        if (!userId) return false;
        return get().seenSheetsTourByUserV2[userId] || false;
      },
      setUserSeenSheetsTour: (userId) => {
        if (!userId) return;
        set((state) => ({
          seenSheetsTourByUserV2: { ...state.seenSheetsTourByUserV2, [userId]: true }
        }));
      },
      clearOnboardingData: () => set({ seenSheetsTourByUserV2: {} }),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useOnboardingStore;
