import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../authStore';
import { authService } from '../../services/authService';

vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
    acceptAgreement: vi.fn(),
  },
}));

describe('Zustand Auth Store (useAuthStore)', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it('should initialize with default unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should update state and localStorage on successful login', async () => {
    const mockUser = {
      _id: 'user_123',
      name: 'Tester',
      email: 'test@example.com',
      token: 'jwt_mock_token_abc',
    };

    authService.login.mockResolvedValueOnce(mockUser);

    const result = await useAuthStore.getState().login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user._id).toBe('user_123');
    expect(state.token).toBe('jwt_mock_token_abc');
    expect(localStorage.getItem('token')).toBe('jwt_mock_token_abc');
  });

  it('should handle login error gracefully and set error message', async () => {
    authService.login.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });

    const result = await useAuthStore.getState().login({
      email: 'wrong@example.com',
      password: 'bad',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe('Invalid credentials');
  });

  it('should clear state and localStorage on logout', () => {
    useAuthStore.setState({
      user: { name: 'Active User' },
      token: 'some_token',
      isAuthenticated: true,
    });
    localStorage.setItem('token', 'some_token');

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });
});
