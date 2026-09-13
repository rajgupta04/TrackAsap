import { create } from 'zustand';
import { authService } from '../services/authService';
import githubService from '../services/githubService';

const normalizeUser = (u) => {
  if (!u) return null;
  return {
    ...u,
    isEmailVerified: u.role === 'admin' ? true : Boolean(u.isEmailVerified),
  };
};

const getInitialUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return normalizeUser(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const useAuthStore = create((set, get) => ({
  user: getInitialUser(),
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
  githubStatus: null, // { connected, username, lastSync }

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(credentials);
      const user = normalizeUser(data);
      localStorage.setItem('token', user.token);
      localStorage.setItem('user', JSON.stringify(user));
      set({
        user,
        token: user.token,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  loginWithGoogle: async (credential) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.googleLogin(credential);
      const user = normalizeUser(data);
      localStorage.setItem('token', user.token);
      localStorage.setItem('user', JSON.stringify(user));
      set({
        user,
        token: user.token,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Google sign-in failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(userData);
      const user = normalizeUser(data);
      localStorage.setItem('token', user.token);
      localStorage.setItem('user', JSON.stringify(user));
      set({
        user,
        token: user.token,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  updateUser: async (data) => {
    set({ isLoading: true });
    try {
      const updatedUser = await authService.updateProfile(data);
      const currentUser = get().user;
      const newUser = normalizeUser({ ...currentUser, ...updatedUser });
      localStorage.setItem('user', JSON.stringify(newUser));
      set({ user: newUser, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.response?.data?.message };
    }
  },

  uploadProfilePicture: async (file) => {
    set({ isLoading: true });
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await authService.uploadProfilePicture(formData);
      const currentUser = get().user;
      const newUser = { ...currentUser, profilePicture: response.profilePicture };
      
      localStorage.setItem('user', JSON.stringify(newUser));
      set({ user: newUser, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.response?.data?.message || 'Failed to upload image' };
    }
  },

  clearError: () => set({ error: null }),

  acceptAgreement: async () => {
    try {
      const response = await authService.acceptAgreement();
      const currentUser = get().user;
      const newUser = { ...currentUser, acceptedDiscussionAgreement: true };
      localStorage.setItem('user', JSON.stringify(newUser));
      set({ user: newUser });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to accept agreement' };
    }
  },

  sendVerificationEmail: async () => {
    try {
      const response = await authService.sendVerificationEmail();
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to send verification email' };
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await authService.forgotPassword(email);
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset link';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null });
    try {
      await authService.resetPassword(token, password);
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  checkAuth: async () => {
    try {
      const data = await authService.getMe();
      const user = normalizeUser(data);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to check auth' };
    }
  },

  // GitHub integration
  fetchGitHubStatus: async () => {
    try {
      const status = await githubService.getStatus();
      set({ githubStatus: status });
      return status;
    } catch {
      set({ githubStatus: { connected: false, username: '', lastSync: null } });
      return null;
    }
  },

  setGitHubStatus: (status) => set({ githubStatus: status }),
}));
