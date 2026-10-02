import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus, Target, Calendar, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useGuestStore } from '../store/guestStore';
import toast from 'react-hot-toast';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import PasswordStrengthMeter from '../components/auth/PasswordStrengthMeter';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMeta, setPasswordMeta] = useState({ score: 0, isPwned: false, isValid: false });
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const { register, loginWithGoogle, isLoading } = useAuthStore();
  const { guestSheets, loadGuestSheets } = useGuestStore();

  useEffect(() => {
    loadGuestSheets();
  }, [loadGuestSheets]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (passwordMeta.score < 2) {
      toast.error('Please choose a stronger password (at least Fair strength)');
      return;
    }

    const result = await register({ name, email, password, startDate });
    if (result.success) {
      toast.success('Account created! Let\'s start your 75-day journey!');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 gradient-mesh p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img
            src="/logodefault.png"
            alt="TrackAsap Logo"
            className="h-14 sm:h-16 md:h-18 w-auto max-w-full object-contain brightness-[1.4] contrast-110 drop-shadow-[0_0_15px_rgba(57,255,20,0.45)] mb-3"
          />
          <p className="text-dark-400 mt-1">Start Your 75 Day Challenge</p>
        </div>

        {/* Register Form */}
        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-sm text-dark-400 mb-6">Join to save sheets, sync progress & track your journey</p>

          {/* Local Sheets Detected Notice */}
          {guestSheets && guestSheets.length > 0 && (
            <div className="mb-5 p-3 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-neon-green shrink-0 mt-0.5" />
              <div className="text-xs text-dark-200">
                <p className="font-semibold text-neon-green">
                  {guestSheets.length} Browser Sheet{guestSheets.length > 1 ? 's' : ''} Found
                </p>
                <p className="text-[11px] text-dark-300 mt-0.5">
                  Your local sheets and solved progress will automatically sync to your new account on signup!
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-12"
                  placeholder="Your Name"
                  required
                />
              </div>
            </div>

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
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field pl-12"
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
                  minLength={8}
                />
              </div>
              <PasswordStrengthMeter
                password={password}
                onScoreChange={setPasswordMeta}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pl-12"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={20} />
                  Create Account
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

            <div className="flex justify-center">
              <GoogleSignInButton
                onCredential={handleGoogleCredential}
                onError={(err) => toast.error(err?.message || 'Google sign-in failed')}
              />
            </div>
          </form>

          <p className="text-center text-dark-400 mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-neon-green hover:underline font-medium"
            >
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
