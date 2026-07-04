import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';
import { STORAGE_KEYS } from '../constants/config';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false, // Start false: show Login immediately, restore auth silently in background
  error: null,

  /**
   * Silently restore auth from AsyncStorage in the background.
   * Does NOT block the UI — Login screen shows instantly.
   * If a valid token is found, navigates to Dashboard automatically.
   */
  restoreAuth: async () => {
    try {
      const [storedToken, storedUser] = await Promise.race([
        Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.USER),
        ]),
        // 4 second hard timeout — if storage hangs, just stay on Login
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Storage timeout')), 4000)
        ),
      ]);

      if (storedToken && storedUser) {
        let parsedUser = null;
        try { parsedUser = JSON.parse(storedUser); } catch (_) {}

        if (parsedUser) {
          set({ token: storedToken, user: parsedUser, isAuthenticated: true });
          // Silently refresh profile in background (non-blocking)
          authService.getMe()
            .then((res) => {
              const fresh = res?.user || res?.data;
              if (fresh) {
                AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(fresh)).catch(() => {});
                set({ user: fresh });
              }
            })
            .catch((err) => {
              if (err?.response?.status === 401) get().logout();
            });
        }
      }
    } catch (err) {
      // Storage timed out or failed — stay on Login screen, no crash
      console.warn('restoreAuth:', err.message);
    }
  },

  // Keep initializeAuth as an alias for backward compatibility
  initializeAuth: async () => get().restoreAuth(),

  /**
   * Log in user with credentials
   */
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(credentials);
      const token = data.token;
      const user = data.user || data.data;

      if (!token) {
        throw new Error('No authentication token received from server.');
      }

      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
      if (user) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      }

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || error.message || 'Login failed. Please check credentials.';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Register new account
   */
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(userData);
      const token = data.token;
      const user = data.user || data.data;

      if (token) {
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
        if (user) {
          await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        }
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
      return { success: true };
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || error.message || 'Registration failed.';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Update current user profile in store
   */
  updateUser: async (newUserData) => {
    try {
      const updatedUser = { ...get().user, ...newUserData };
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      set({ user: updatedUser });
    } catch (err) {
      console.error('Failed to update local user state:', err);
    }
  },

  /**
   * Log out user and clear persistent storage
   */
  logout: async () => {
    set({ isLoading: true });
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error during logout:', error);
      set({ isLoading: false });
    }
  },
}));

export default useAuthStore;
