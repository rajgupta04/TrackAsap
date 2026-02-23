import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const StreakAnimation = ({ streak, show, onComplete }) => {
  useEffect(() => {
    if (show && streak > 0) {
      // Fire confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['#39FF14', '#00FFFF', '#FF10F0', '#FFA116'];

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();

      // Auto close after animation
      const timer = setTimeout(() => {
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [show, streak, onComplete]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
        }}
        className="text-center"
      >
        {/* Fire emoji ring */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative"
        >
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="text-8xl"
          >
            🔥
          </motion.div>
        </motion.div>

        {/* Streak number */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <motion.span
            animate={{
              scale: [1, 1.1, 1],
              textShadow: [
                '0 0 20px #39FF14',
                '0 0 40px #39FF14, 0 0 60px #39FF14',
                '0 0 20px #39FF14',
              ],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="text-6xl font-black text-neon-green"
            style={{
              textShadow: '0 0 30px #39FF14, 0 0 60px #39FF14',
            }}
          >
            {streak}
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="text-4xl font-bold text-white ml-2"
          >
            Day Streak!
          </motion.span>
        </motion.div>

        {/* Motivational text */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-4 text-xl text-gray-300"
        >
          {streak >= 75 ? (
            '🏆 LEGENDARY! You completed the 75-Day Challenge!'
          ) : streak >= 50 ? (
            "🌟 Incredible! You're unstoppable!"
          ) : streak >= 30 ? (
            "💪 Amazing progress! Keep crushing it!"
          ) : streak >= 14 ? (
            "🚀 Two weeks strong! You're on fire!"
          ) : streak >= 7 ? (
            "✨ One week done! Building momentum!"
          ) : (
            "🎯 Great start! Keep the streak alive!"
          )}
        </motion.p>

        {/* Progress ring */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.9, type: 'spring' }}
          className="mt-6"
        >
          <svg className="w-24 h-24 mx-auto" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#39FF14"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(streak / 75) * 283} 283`}
              transform="rotate(-90 50 50)"
              initial={{ strokeDasharray: '0 283' }}
              animate={{ strokeDasharray: `${(streak / 75) * 283} 283` }}
              transition={{ duration: 1.5, delay: 1 }}
              style={{
                filter: 'drop-shadow(0 0 10px #39FF14)',
              }}
            />
            <text
              x="50"
              y="55"
              textAnchor="middle"
              className="fill-white text-sm font-bold"
            >
              {Math.round((streak / 75) * 100)}%
            </text>
          </svg>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default StreakAnimation;
