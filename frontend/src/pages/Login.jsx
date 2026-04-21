import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, Mail, Lock, LogIn, Target } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import { authService } from '../services/authService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginWithGoogle, loginWithGitHubToken, isLoading, error } = useAuthStore();

  useEffect(() => {
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : '';
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const token = params.get('token');
    const avatarUrl = params.get('avatarUrl') || '';
    if (token) {
      loginWithGitHubToken(token, avatarUrl).then((result) => {
        if (result.success) {
          toast.success('Signed in with GitHub!');
        } else {
          toast.error(result.error || 'GitHub sign-in failed');
        }
      });
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login({ email, password });
    if (result.success) {
      toast.success('Welcome back!');
    } else {
      toast.error(result.error);
    }
  };

  const handleGoogleCredential = async (credential) => {
    const result = await loginWithGoogle(credential);
    if (result.success) {
      toast.success('Signed in with Google!');
    } else {
      toast.error(result.error);
    }
  };

  const handleGitHubSignIn = async () => {
    try {
      const { url } = await authService.getGitHubAuthUrl();
      window.location.href = url;
    } catch (err) {
      toast.error(err?.message || 'Failed to start GitHub sign-in');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 gradient-mesh p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-green to-emerald-500 mb-4">
            <Target className="w-8 h-8 text-dark-950" />
          </div>
          <h1 className="text-3xl font-bold text-white">TrackAsap</h1>
          <p className="text-dark-400 mt-2">75 Day Challenge Tracker</p>
        </div>

        {/* Login Form */}
        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Welcome Back</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  Sign In
                </>
              )}
            </button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-dark-900 px-2 text-dark-400">Or continue with</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <GoogleSignInButton
                onCredential={handleGoogleCredential}
                onError={(err) => toast.error(err?.message || 'Google sign-in failed')}
              />
              <button
                type="button"
                onClick={handleGitHubSignIn}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#24292e] hover:bg-[#2f363d] text-white border border-white/10 transition-all"
              >
                <Github className="w-4 h-4" />
                Sign in with GitHub
              </button>
            </div>
          </form>

          <p className="text-center text-dark-400 mt-6">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-neon-green hover:underline font-medium"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
