import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Flame, Coffee, Zap, X, Clock, Play } from 'lucide-react';
import useDailyPlanStore from '../../store/dailyPlanStore';

export const DailyPlannerBubble = () => {
  const {
    isModalOpen,
    isBubbleVisible,
    currentPlan,
    openModal,
    setBubbleVisible,
  } = useDailyPlanStore();

  const [remainingTimeStr, setRemainingTimeStr] = useState('00:00:00');
  const [progressPercent, setProgressPercent] = useState(0);

  const isActive = currentPlan?.status === 'active';
  const mode = currentPlan?.mode || 'grind';

  // Format mode icon
  const ModeIcon = mode === 'chill' ? Coffee : mode === 'allin' ? Zap : Flame;
  const modeColor =
    mode === 'chill'
      ? 'from-cyan-500 to-teal-400'
      : mode === 'allin'
      ? 'from-purple-500 to-pink-500'
      : 'from-amber-500 to-orange-500';

  // Live countdown timer calculation
  useEffect(() => {
    if (!isActive || !currentPlan?.sessionStartedAt || !currentPlan?.durationSecondsPlanned) {
      return;
    }

    const interval = setInterval(() => {
      const startTime = new Date(currentPlan.sessionStartedAt).getTime();
      const totalPlannedMs = currentPlan.durationSecondsPlanned * 1000;
      const endTime = startTime + totalPlannedMs;
      const now = Date.now();
      const diffMs = Math.max(0, endTime - now);

      const totalSec = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      const pad = (n) => String(n).padStart(2, '0');
      setRemainingTimeStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);

      const elapsedMs = totalPlannedMs - diffMs;
      const pct = Math.min(100, Math.round((elapsedMs / totalPlannedMs) * 100));
      setProgressPercent(pct);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, currentPlan]);

  // Don't show bubble if modal is already open or bubble is dismissed
  if (isModalOpen || !isBubbleVisible) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={{
        top: 60,
        left: 20,
        right: window.innerWidth ? window.innerWidth - 180 : 1000,
        bottom: window.innerHeight ? window.innerHeight - 100 : 800,
      }}
      initial={{ opacity: 0, scale: 0.8, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => openModal()}
      className={`fixed bottom-24 right-4 z-40 cursor-grab active:cursor-grabbing select-none
        transition-opacity duration-300 ${isActive ? 'opacity-90 hover:opacity-100' : 'opacity-40 hover:opacity-100'}`}
      title={isActive ? `Active Plan Session (${remainingTimeStr} left) — Click to view` : 'Daily AI Planner — Click to open'}
    >
      <div className="relative group flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-full bg-dark-900/90 border border-white/20 backdrop-blur-xl shadow-2xl shadow-neon-green/10">
        {/* Glowing Pulsing Ring */}
        {isActive ? (
          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-neon-green/50 to-emerald-500/50 blur-sm animate-pulse opacity-75 group-hover:opacity-100" />
        ) : (
          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-white/10 to-neon-green/20 blur-sm opacity-50 group-hover:opacity-100" />
        )}

        <div className="relative z-10 flex items-center gap-2">
          {/* Mode / Brain Icon Badge */}
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br ${modeColor} flex items-center justify-center text-black font-bold shadow-md`}
          >
            {isActive ? <ModeIcon className="w-4 h-4 text-white drop-shadow" /> : <Brain className="w-4 h-4 text-black" />}
          </div>

          {/* Label / Countdown */}
          <div className="flex flex-col pr-1">
            {isActive ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-ping" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neon-green">Lock In</span>
                </div>
                <span className="font-mono text-xs font-extrabold text-white tracking-wider">
                  {remainingTimeStr}
                </span>
              </>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white tracking-tight">AI Planner</span>
                <span className="text-[10px] text-neon-green font-semibold">✨</span>
              </div>
            )}
          </div>

          {/* Dismiss small X on hover if not active */}
          {!isActive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setBubbleVisible(false);
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/20 text-dark-400 hover:text-white rounded-full transition-all"
              title="Hide bubble (re-open anytime from Dashboard header)"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DailyPlannerBubble;
