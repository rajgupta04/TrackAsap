import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, ExternalLink, FileText, Code, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useRoadmapStore } from '../../store/roadmapStore';

const ProblemTile = ({ 
  problem, 
  levelNumber, 
  gridIndex = 0,
  isUnlocked, 
  isCompleted, 
  onComplete,
  onOpenNotes,
  onOpenCode
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { problemNotes = {}, problemCode = {} } = useRoadmapStore();
  const hasNotes = !!problemNotes[problem.id];
  const hasCode = !!problemCode[problem.id]?.code;

  // Adjust tooltip positioning to prevent viewport clipping
  // For a 4-column grid: leftmost column aligns left, rightmost column aligns right, middle columns centered
  const col = gridIndex % 4;
  const alignClass = col === 0 ? 'left-0' : col === 3 ? 'right-0' : 'left-1/2 -translate-x-1/2';

  const getDifficultyColor = () => {
    switch (problem.difficulty) {
      case 'easy':
        return 'from-emerald-400 to-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
      case 'medium':
        return 'from-blue-400 to-blue-600 shadow-[0_0_12px_rgba(59,130,246,0.3)]';
      case 'hard':
        return 'from-purple-500 to-pink-600 shadow-[0_0_12px_rgba(168,85,247,0.3)]';
      default:
        return 'from-slate-400 to-slate-600';
    }
  };

  const getLeetCodeUrl = () => {
    if (problem.leetcodeUrl && problem.leetcodeUrl.startsWith('http')) return problem.leetcodeUrl;
    if (problem.url && problem.url.startsWith('http')) return problem.url;
    let slug = '';
    if (problem.judgeSlug) {
      slug = problem.judgeSlug;
    } else if (problem.url && problem.url.startsWith('/solve/')) {
      slug = problem.url.replace('/solve/', '').replace(/\/$/, '');
    } else if (problem.title) {
      slug = problem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    return slug ? `https://leetcode.com/problems/${slug}/` : 'https://leetcode.com/problemset/all/';
  };

  const hasTrackAsapSolve = Boolean(problem.judgeSlug || (problem.url && problem.url.startsWith('/solve/')));
  const trackAsapUrl = problem.judgeSlug ? `/solve/${problem.judgeSlug}` : (problem.url && problem.url.startsWith('/solve/') ? problem.url : null);
  const leetCodeUrl = getLeetCodeUrl();

  const handleSolve = () => {
    // Fire confetti on complete
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#39FF14', '#10b981', '#fbbf24']
    });
    onComplete(problem.id, problem.xp);
  };

  return (
    <div 
      className="relative flex flex-col items-center select-none"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Curved Connectors (Candy Crush Style background connectors between grid tiles) */}
      <div className="absolute top-1/2 -left-8 w-8 h-1 bg-white/5 pointer-events-none hidden sm:block" />

      {/* Level Tile Button */}
      <motion.button
        disabled={!isUnlocked}
        whileHover={isUnlocked ? { scale: 1.15 } : {}}
        whileTap={isUnlocked ? { scale: 0.95 } : {}}
        onClick={() => window.open(problem.url, '_blank')}
        className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm text-white transition-all duration-300 border-2 ${
          isCompleted 
            ? 'border-yellow-400/90 shadow-[0_0_15px_rgba(251,191,36,0.5)] bg-gradient-to-br from-yellow-400 to-amber-500'
            : isUnlocked
              ? `border-white/20 bg-gradient-to-br ${getDifficultyColor()}`
              : 'border-white/5 bg-slate-800/20 text-slate-500 cursor-not-allowed'
        }`}
      >
        {isCompleted ? (
          <Check className="w-6 h-6 stroke-[3] text-dark-950" />
        ) : !isUnlocked ? (
          <Lock className="w-5 h-5 text-dark-500" />
        ) : (
          <span>{levelNumber}</span>
        )}
      </motion.button>

      {/* Difficulty Label Below Tile */}
      <span className="text-[10px] text-dark-400 mt-1 font-mono uppercase">
        Level {levelNumber}
      </span>

      {/* Interactive Tooltip Card */}
      {showTooltip && (
        <div className={`absolute bottom-16 bg-dark-900/95 border border-white/10 rounded-2xl p-4 shadow-2xl z-50 w-56 sm:w-64 text-left backdrop-blur-xl animate-fade-in pointer-events-auto ${alignClass}`}>
          <div className="flex justify-between items-start mb-2">
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
              problem.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400' :
              problem.difficulty === 'medium' ? 'bg-blue-500/10 text-blue-400' :
              'bg-purple-500/10 text-purple-400'
            }`}>
              {problem.difficulty}
            </span>
            <span className="text-neon-green font-mono font-bold text-xs">+{problem.xp} XP</span>
          </div>

          <h5 className="font-bold text-white text-sm mb-1.5 flex items-center gap-1.5 leading-snug">
            {problem.title}
          </h5>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3.5">
            {problem.tags.map((tag) => (
              <span key={tag} className="text-[9px] bg-white/5 border border-white/5 rounded px-1.5 text-dark-300 font-mono">
                {tag}
              </span>
            ))}
          </div>

          {/* Actions */}
          {isUnlocked && (
            <div className="flex flex-col gap-1.5">
              {/* Internal Solve in TrackAsap Judge Button (If attached) */}
              {hasTrackAsapSolve && (
                <a
                  href={trackAsapUrl}
                  className="flex items-center justify-center gap-1.5 w-full py-2 bg-neon-green hover:brightness-110 text-dark-950 text-xs font-bold rounded-xl transition shadow-lg shadow-neon-green/20"
                >
                  <Zap size={13} className="fill-dark-950" />
                  <span>Solve in TrackAsap ⚡</span>
                </a>
              )}

              {/* External LeetCode Link (Always visible) */}
              <button
                onClick={() => window.open(leetCodeUrl, '_blank')}
                className={`flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  hasTrackAsapSolve
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border-amber-500/30'
                    : 'bg-neon-green hover:brightness-110 text-dark-950 font-bold border-transparent shadow-lg shadow-neon-green/20'
                }`}
              >
                <ExternalLink size={12} />
                <span>Solve on LeetCode ↗</span>
              </button>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenNotes(problem);
                  }}
                  className={`flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    hasNotes 
                      ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30'
                      : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                  }`}
                  title="Write notes"
                >
                  <FileText size={12} />
                  <span>Notes</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCode(problem);
                  }}
                  className={`flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    hasCode 
                      ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                  }`}
                  title="Write code"
                >
                  <Code size={12} />
                  <span>Code</span>
                </button>
              </div>

              {!isCompleted && (
                <button
                  onClick={handleSolve}
                  className="w-full py-1.5 bg-neon-green text-dark-950 text-xs font-bold rounded-lg hover:shadow-[0_0_12px_rgba(57,255,20,0.5)] transition-all"
                >
                  Mark as Completed
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProblemTile;
