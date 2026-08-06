import { useRoadmapStore } from '../../store/roadmapStore';
import { WORLDS } from '../../data/roadmapData';
import RankBadge from './RankBadge';
import { RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const ProgressHUD = () => {
  const { totalXP, coins, completedWorlds, resetProgress } = useRoadmapStore();

  const totalWorldsCount = WORLDS.length;
  const clearedCount = completedWorlds.length;
  const percentCleared = Math.round((clearedCount / totalWorldsCount) * 100);

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all roadmap progress, XP, and levels? This cannot be undone.')) {
      resetProgress();
      toast.success('Roadmap progress reset successfully!');
    }
  };

  return (
    <div className="sticky top-0 z-40 w-full bg-dark-950/70 border-b border-white/10 backdrop-blur-xl px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
      {/* Left Column: Worlds Cleared Progress Meter */}
      <div className="flex flex-col items-center sm:items-start w-full sm:w-auto gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-300">🌍 Worlds Cleared</span>
          <span className="text-xs text-dark-400">({clearedCount} / {totalWorldsCount})</span>
        </div>

        {/* Gamified Segmented Progress Meter */}
        <div className="flex items-center gap-1.5 mt-1 w-full max-w-[280px]">
          {Array.from({ length: totalWorldsCount }).map((_, idx) => {
            const isCompleted = idx < clearedCount;
            return (
              <div
                key={idx}
                className={`h-2.5 flex-1 rounded-full transition-all duration-700 ${
                  isCompleted
                    ? 'bg-neon-green shadow-[0_0_8px_rgba(57,255,20,0.6)]'
                    : 'bg-white/10 border border-white/5'
                }`}
                title={isCompleted ? `World ${idx + 1} Cleared` : `World ${idx + 1} Locked`}
              />
            );
          })}
        </div>
      </div>

      {/* Middle/Right Column: Stats & Rank Badge */}
      <div className="flex items-center flex-wrap justify-center gap-3 sm:gap-6 w-full sm:w-auto">
        {/* Total XP Container */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 hover:bg-white/10 transition-all duration-300">
          <span className="text-lg">✨</span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-dark-400 tracking-wider">Total XP</span>
            <span className="text-sm text-neon-green font-bold font-mono">
              {totalXP.toLocaleString()} <span className="text-xs text-dark-400">XP</span>
            </span>
          </div>
        </div>

        {/* Gold Coins Container */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 hover:bg-white/10 transition-all duration-300">
          <span className="text-lg animate-[spin_4s_linear_infinite]">🪙</span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-dark-400 tracking-wider">Coins</span>
            <span className="text-sm text-amber-400 font-bold font-mono">
              {coins.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Rank Badge */}
        <RankBadge xp={totalXP} />

        {/* Developer Reset Action */}
        <button
          onClick={handleReset}
          title="Reset All Progress"
          className="p-2 bg-white/5 hover:bg-red-500/20 text-dark-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded-2xl transition-all duration-300 shrink-0"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
};

export default ProgressHUD;
