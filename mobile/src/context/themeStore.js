import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';
import { COLORS } from '../constants/colors';

const useThemeStore = create((set, get) => ({
  isDarkMode: true, // Default to Dark Mode
  colors: COLORS.dark,

  /**
   * Load theme preference from AsyncStorage
   */
  loadTheme: async () => {
    try {
      const storedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      if (storedTheme !== null) {
        const isDark = storedTheme === 'dark';
        set({
          isDarkMode: isDark,
          colors: isDark ? COLORS.dark : COLORS.light,
        });
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  },

  /**
   * Toggle between Dark and Light mode
   */
  toggleTheme: async () => {
    const nextIsDark = !get().isDarkMode;
    set({
      isDarkMode: nextIsDark,
      colors: nextIsDark ? COLORS.dark : COLORS.light,
    });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, nextIsDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme state:', error);
    }
  },
}));

export default useThemeStore;
