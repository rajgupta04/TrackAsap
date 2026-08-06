import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';

const ProblemTile = ({ 
  problem, 
  levelNumber, 
  isUnlocked, 
  isCompleted, 
  onComplete 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

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
        <div className="absolute bottom-16 bg-dark-900/95 border border-white/10 rounded-2xl p-4 shadow-2xl z-50 w-64 text-left backdrop-blur-xl animate-fade-in pointer-events-auto">
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
              <button
                onClick={() => window.open(problem.url, '_blank')}
                className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-lg border border-white/10 transition-colors"
              >
                <ExternalLink size={12} />
                <span>Solve on LeetCode</span>
              </button>

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
