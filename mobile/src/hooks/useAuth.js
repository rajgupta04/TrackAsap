import useAuthStore from '../context/authStore';

export const useAuth = () => {
  const { user, token, isAuthenticated, isLoading, error, login, register, logout, updateUser } =
    useAuthStore();

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateUser,
  };
};

export default useAuth;
