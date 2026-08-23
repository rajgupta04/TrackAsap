import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Brain, Flame, Coffee, Zap, X } from 'lucide-react';
import useDailyPlanStore from '../../store/dailyPlanStore';

export const DailyPlannerBubble = () => {
  const {
    isModalOpen,
    isBubbleVisible,
    currentPlan,
    openModal,
    setBubbleVisible,
  } = useDailyPlanStore();

  const containerRef = useRef(null);
  const [remainingTimeStr, setRemainingTimeStr] = useState('00:00:00');

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
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, currentPlan]);

  // Don't show bubble if modal is already open or bubble is dismissed
  if (isModalOpen || !isBubbleVisible) return null;

  return (
    <>
      {/* Full-viewport boundary container so bubble NEVER goes outside visible screen */}
      <div
        ref={containerRef}
        className="fixed inset-3 sm:inset-4 pointer-events-none z-40"
      >
        <motion.div
          drag
          dragMomentum={false}
          dragConstraints={containerRef}
          dragElastic={0}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openModal()}
          className={`absolute bottom-20 right-2 pointer-events-auto cursor-grab active:cursor-grabbing select-none
            transition-opacity duration-300 ${
              isActive ? 'opacity-90 hover:opacity-100' : 'opacity-30 hover:opacity-100'
            }`}
          title={
            isActive
              ? `Active Session (${remainingTimeStr} left) — Click to open`
              : 'Daily AI Planner — Click to open'
          }
        >
          <div className="relative group flex items-center justify-center">
            {/* Glowing Pulsing Ring */}
            {isActive ? (
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-neon-green via-emerald-400 to-cyan-400 blur-sm animate-pulse opacity-80 group-hover:opacity-100" />
            ) : (
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500/40 to-neon-green/40 blur-sm opacity-40 group-hover:opacity-90" />
            )}

            {/* Circular Logo Icon Only (Small & Clean) */}
            <div
              className={`relative z-10 w-10 h-10 rounded-full bg-gradient-to-br ${modeColor} border border-white/20 shadow-xl flex items-center justify-center text-black font-bold`}
            >
              {isActive ? (
                <ModeIcon className="w-5 h-5 text-white drop-shadow" />
              ) : (
                <Brain className="w-5 h-5 text-black" />
              )}

              {/* Active Session Ping Dot */}
              {isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-neon-green border-2 border-dark-950 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                </span>
              )}
            </div>

            {/* Hover Tooltip / Mini Time Label */}
            <div className="absolute right-12 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-dark-900/95 border border-white/15 text-white text-[11px] font-mono font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl flex items-center gap-1.5">
              {isActive ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                  <span>{remainingTimeStr}</span>
                </>
              ) : (
                <>
                  <span>AI Planner</span>
                  <span className="text-neon-green">✨</span>
                </>
              )}
            </div>

            {/* Small Dismiss X on Hover when inactive */}
            {!isActive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setBubbleVisible(false);
                }}
                className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 p-0.5 bg-dark-900/90 border border-white/20 text-dark-300 hover:text-white rounded-full transition-all shadow-md"
                title="Hide bubble"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default DailyPlannerBubble;
