import { getRankByXP, getNextRank } from '../../data/roadmapData';

const RankBadge = ({ xp }) => {
  const currentRank = getRankByXP(xp);
  const nextRank = getNextRank(xp);

  let progressPercent = 100;
  let xpNeeded = 0;
  let rangeTotal = 100;

  if (nextRank) {
    const prevThreshold = currentRank.minXP;
    const nextThreshold = nextRank.minXP;
    rangeTotal = nextThreshold - prevThreshold;
    const currentProgress = xp - prevThreshold;
    progressPercent = Math.min(Math.round((currentProgress / rangeTotal) * 100), 100);
    xpNeeded = nextThreshold - xp;
  }

  // Circular progress settings
  const radius = 22;
  const strokeWidth = 3.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 hover:bg-white/10 transition-all duration-300 group cursor-default relative">
      {/* Dynamic Rank Circle Progress */}
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg className="absolute w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            className="stroke-dark-600/30 fill-none"
            strokeWidth={strokeWidth}
          />
          {/* Active progress circle */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            className="stroke-neon-green fill-none transition-all duration-1000 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(57, 255, 20, 0.4))'
            }}
          />
        </svg>
        <span className="text-2xl z-10 group-hover:scale-110 transition-transform duration-300">
          {currentRank.emoji}
        </span>
      </div>

      {/* Rank Labels */}
      <div className="flex flex-col select-none">
        <span className="text-[10px] uppercase font-bold text-dark-400 tracking-wider">Current Rank</span>
        <span className={`text-sm ${currentRank.color} leading-tight`}>
          {currentRank.title}
        </span>
      </div>

      {/* Popover Hover Tooltip */}
      <div className="absolute top-14 right-0 invisible group-hover:visible bg-dark-900/95 border border-white/15 rounded-xl p-3 shadow-2xl z-50 w-56 text-xs text-gray-300 backdrop-blur-xl animate-fade-in">
        <p className="font-bold text-white mb-1.5 flex items-center gap-1.5">
          <span>{currentRank.emoji}</span>
          <span>{currentRank.title}</span>
        </p>
        <div className="space-y-1 font-mono text-[11px]">
          <div className="flex justify-between">
            <span className="text-dark-400">Total XP:</span>
            <span className="text-neon-green font-bold">{xp} XP</span>
          </div>
          {nextRank ? (
            <>
              <div className="flex justify-between">
                <span className="text-dark-400">Next Rank:</span>
                <span className="text-white font-bold">{nextRank.emoji} {nextRank.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">XP Required:</span>
                <span className="text-amber-400 font-bold">{xpNeeded} XP</span>
              </div>
              {/* Micro Progress Bar inside tooltip */}
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-neon-green h-full rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </>
          ) : (
            <span className="text-emerald-400 font-bold block mt-1">👑 Max Rank Achieved!</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RankBadge;
