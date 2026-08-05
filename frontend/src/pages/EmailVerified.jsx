import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

const EmailVerified = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await api.get(`/email/verify/${token}`);
        await checkAuth();
        setStatus('success');
      } catch (error) {
        setStatus('error');
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full max-h-[600px] bg-neon-green/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-dark-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center"
      >
        {status === 'loading' && (
          <div className="py-8">
            <Loader2 className="w-16 h-16 text-neon-green animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-2">Verifying Email...</h1>
            <p className="text-dark-400">Please wait while we verify your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
              className="w-24 h-24 bg-neon-green/10 rounded-full flex items-center justify-center mx-auto mb-6 relative"
            >
              <div className="absolute inset-0 bg-neon-green/20 rounded-full animate-ping opacity-25" />
              <CheckCircle2 className="w-12 h-12 text-neon-green" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-4">Email Verified Successfully! 🎉</h1>
            <p className="text-dark-400 mb-8 leading-relaxed">
              Thank you for verifying your email. You now have full access to Discussions, Sheet Cloning, and all premium features.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-neon-green text-black font-bold rounded-xl hover:bg-neon-green/90 transition-all hover:shadow-lg hover:shadow-neon-green/20"
            >
              Go to Dashboard →
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
              className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <XCircle className="w-12 h-12 text-red-500" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-4">Verification Failed</h1>
            <p className="text-dark-400 mb-8 leading-relaxed">
              This link is invalid or has expired. Please request a new verification link from your Profile.
            </p>
            <Link
              to="/profile"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all"
            >
              Go to Profile →
            </Link>
          </div>
        )}
      </motion.div>

      {/* Confetti-like particles for success */}
      {status === 'success' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                opacity: 0,
                y: '100vh',
                x: `${Math.random() * 100}vw`,
                scale: Math.random() * 0.5 + 0.5,
              }}
              animate={{
                opacity: [0, 1, 0],
                y: '-20vh',
                x: `${Math.random() * 100}vw`,
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: Math.random() * 2 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#39FF14', '#06b6d4', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 4)],
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailVerified;
