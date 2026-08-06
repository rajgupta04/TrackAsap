import { motion } from 'framer-motion';
import { Trophy, Award, Sparkles, ChevronRight } from 'lucide-react';

const WorldClearedOverlay = ({ 
  world, 
  onClose 
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 select-none">
      {/* ── Overlay Modal ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: 'spring', damping: 20, stiffness: 150 }}
        className="relative w-full max-w-md bg-dark-900/90 border-2 border-yellow-500/30 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(251,191,36,0.15)] flex flex-col items-center"
      >
        {/* Floating Sparks background styling */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-yellow-500/10 rounded-full filter blur-3xl pointer-events-none" />

        {/* Animated Crown/Trophy Icon */}
        <motion.div
          initial={{ y: -30, rotate: -10 }}
          animate={{ y: 0, rotate: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/20 mb-6 border border-yellow-300"
        >
          <Trophy size={48} className="text-dark-950 stroke-[2.5]" />
        </motion.div>

        {/* World Cleared Title */}
        <motion.h1 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 uppercase tracking-widest leading-none mb-1"
        >
          World Cleared!
        </motion.h1>

        {/* World Name details */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 text-white font-bold text-lg mb-6"
        >
          <span>{world.emoji}</span>
          <span>{world.name}</span>
        </motion.div>

        {/* Rewards Summary */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3 mb-8 font-mono"
        >
          <h4 className="text-[10px] text-dark-500 uppercase font-bold tracking-wider text-left border-b border-white/5 pb-1.5">
            Rewards Earned
          </h4>

          <div className="flex justify-between items-center text-xs">
            <span className="text-dark-400 flex items-center gap-1">
              <Sparkles size={12} className="text-neon-green" />
              Boss Defeated
            </span>
            <span className="text-neon-green font-bold">+{world.bossLevel.xp} XP</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-dark-400 flex items-center gap-1">
              <Award size={12} className="text-yellow-400" />
              World Clear Bonus
            </span>
            <span className="text-neon-green font-bold">+200 XP</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-dark-400 flex items-center gap-1">
              🪙 Gold Coins
            </span>
            <span className="text-amber-400 font-bold">+150 Coins</span>
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          className="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-dark-950 font-extrabold text-sm rounded-2xl shadow-lg hover:shadow-yellow-500/20 transition-all flex items-center justify-center gap-2"
        >
          <span>Continue Journey</span>
          <ChevronRight size={16} />
        </motion.button>
      </motion.div>
    </div>
  );
};

export default WorldClearedOverlay;
