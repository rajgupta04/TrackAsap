import api from './api';

export const authService = {
  /**
   * Register a new user
   * @param {Object} userData - { name, email, password }
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Get currently logged in user details
   */
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Accept user agreement
   */
  acceptAgreement: async () => {
    const response = await api.put('/auth/accept-agreement');
    return response.data;
  },
};

export default authService;
