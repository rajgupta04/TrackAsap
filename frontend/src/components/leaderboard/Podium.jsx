import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

const PodiumStep = ({ rank, user, score, height, color, delay }) => {
  if (!user) return <div className="w-24 md:w-32" />; // Placeholder if < 3 users

  const isGold = rank === 1;

  return (
    <div className="flex flex-col items-center justify-end relative">
      {/* Avatar & Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.3, duration: 0.5 }}
        className="flex flex-col items-center mb-4 z-10"
      >
        <div className="relative mb-2">
          {isGold && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.6, type: 'spring' }}
              className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]"
            >
              <Trophy className="w-8 h-8" />
            </motion.div>
          )}
          <div
            className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-4 overflow-hidden ${color.border} ${color.shadow} bg-dark-800`}
          >
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}&backgroundColor=transparent`}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div
            className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-dark-900 ${color.bg}`}
          >
            {rank}
          </div>
        </div>
        <div className="text-center mt-2">
          <p className="font-bold text-white truncate w-24 md:w-32 text-sm md:text-base">
            {user.name}
          </p>
          <p className={`text-xs md:text-sm font-semibold ${color.text}`}>
            {score.toLocaleString()} pts
          </p>
        </div>
      </motion.div>

      {/* Podium Block */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height }}
        transition={{ delay, duration: 0.8, type: 'spring', bounce: 0.3 }}
        className={`w-24 md:w-32 rounded-t-lg relative overflow-hidden ${color.podiumBg}`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-0 inset-x-0 h-1 bg-white/20" />
      </motion.div>
    </div>
  );
};

const Podium = ({ topUsers }) => {
  if (!topUsers || topUsers.length === 0) return null;

  // Reorder for visual podium: [2, 1, 3]
  const podiumOrder = [
    topUsers[1] ? { rank: 2, ...topUsers[1] } : null,
    topUsers[0] ? { rank: 1, ...topUsers[0] } : null,
    topUsers[2] ? { rank: 3, ...topUsers[2] } : null,
  ];

  const colors = {
    1: {
      border: 'border-yellow-400',
      shadow: 'shadow-[0_0_20px_rgba(250,204,21,0.5)]',
      bg: 'bg-yellow-400',
      text: 'text-yellow-400',
      podiumBg: 'bg-yellow-500/20 border border-yellow-500/30 border-b-0',
    },
    2: {
      border: 'border-slate-300',
      shadow: 'shadow-[0_0_20px_rgba(203,213,225,0.4)]',
      bg: 'bg-slate-300',
      text: 'text-slate-300',
      podiumBg: 'bg-slate-400/20 border border-slate-400/30 border-b-0',
    },
    3: {
      border: 'border-amber-700',
      shadow: 'shadow-[0_0_20px_rgba(180,83,9,0.5)]',
      bg: 'bg-amber-600',
      text: 'text-amber-500',
      podiumBg: 'bg-amber-700/20 border border-amber-700/30 border-b-0',
    },
  };

  const heights = {
    1: 180,
    2: 130,
    3: 90,
  };

  return (
    <div className="flex justify-center items-end h-[350px] mb-12 gap-2 md:gap-4 border-b border-dark-700/50 pb-0">
      {podiumOrder.map((item, index) => {
        if (!item) return <div key={index} className="w-24 md:w-32" />;
        const scoreField = item.globalScore !== undefined ? item.globalScore : item.weeklyScore !== undefined ? item.weeklyScore : item.monthlyScore;
        return (
          <PodiumStep
            key={item.user._id}
            rank={item.rank}
            user={item.user}
            score={scoreField}
            height={heights[item.rank]}
            color={colors[item.rank]}
            delay={index * 0.2}
          />
        );
      })}
    </div>
  );
};

export default Podium;
