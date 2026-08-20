import { motion } from 'framer-motion';
import { ShieldAlert, Trophy, ExternalLink, Check, Lock, FileText, Code, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useRoadmapStore } from '../../store/roadmapStore';

const BossLevel = ({ 
  bossLevel, 
  isUnlocked, 
  isCompleted, 
  completedProblems = [], 
  onSolveProblem,
  onCompleteBoss,
  onOpenNotes,
  onOpenCode
}) => {
  const bossProblems = bossLevel.problems;
  const { problemNotes = {}, problemCode = {} } = useRoadmapStore();
  
  // Check how many boss problems are completed
  const solvedCount = bossProblems.filter((p) => completedProblems.includes(p.id)).length;
  const isFullySolved = solvedCount === bossProblems.length;

  const getLeetCodeUrl = (prob) => {
    if (prob?.leetcodeUrl && prob.leetcodeUrl.startsWith('http')) return prob.leetcodeUrl;
    if (prob?.url && prob.url.startsWith('http')) return prob.url;
    let slug = '';
    if (prob?.judgeSlug) {
      slug = prob.judgeSlug;
    } else if (prob?.url && prob.url.startsWith('/solve/')) {
      slug = prob.url.replace('/solve/', '').replace(/\/$/, '');
    } else if (prob?.title) {
      slug = prob.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    return slug ? `https://leetcode.com/problems/${slug}/` : 'https://leetcode.com/problemset/all/';
  };

  const handleClaimVictory = () => {
    // Blast massive double confetti on victory!
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#a855f7', '#FF10F0', '#fbbf24']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#a855f7', '#FF10F0', '#fbbf24']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    onCompleteBoss();
  };

  return (
    <div className="relative w-full max-w-xl mx-auto mt-12 select-none">
      {/* ── Boss Banner Glowing Background ── */}
      <div 
        className={`absolute -inset-1 rounded-2xl filter blur-xl opacity-40 transition-all duration-1000 ${
          isCompleted 
            ? 'bg-yellow-500/50' 
            : isUnlocked 
              ? 'bg-red-600/50 animate-pulse' 
              : 'bg-slate-800/20'
        }`} 
      />

      <div 
        className={`relative rounded-2xl border p-6 flex flex-col md:flex-row items-center gap-6 backdrop-blur-xl transition-all duration-500 ${
          isCompleted
            ? 'bg-yellow-500/5 border-yellow-500/20'
            : isUnlocked
              ? 'bg-red-950/10 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.08)]'
              : 'bg-slate-900/40 border-white/5 opacity-50'
        }`}
      >
        {/* Left column: Boss Icon & Progress */}
        <div className="flex flex-col items-center text-center shrink-0">
          <div 
            className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 mb-3 shadow-lg ${
              isCompleted
                ? 'bg-yellow-500/10 border-yellow-400 text-yellow-400'
                : isUnlocked
                  ? 'bg-red-500/10 border-red-500 text-red-500 animate-bounce'
                  : 'bg-slate-800 border-white/5 text-slate-500'
            }`}
          >
            {isCompleted ? <Trophy size={32} /> : <ShieldAlert size={32} />}
          </div>

          <h5 className="font-extrabold text-white text-sm uppercase tracking-wide">Boss Battle</h5>
          <span className="text-[10px] text-dark-400 font-mono mt-0.5">
            {solvedCount} / {bossProblems.length} Solved
          </span>
        </div>

        {/* Right column: Details & Problems list */}
        <div className="flex-1 w-full">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-extrabold text-lg text-white leading-tight">
              {bossLevel.title}
            </h4>
            <span className="text-neon-green font-mono font-bold text-xs">+{bossLevel.xp} XP</span>
          </div>

          <p className="text-xs text-dark-400 leading-relaxed mb-4">
            {isCompleted 
              ? 'Victory! You successfully defeated the boss and conquered this world!'
              : bossLevel.description
            }
          </p>

          {/* Locked State Notification */}
          {!isUnlocked && (
            <div className="flex items-center gap-2 bg-black/30 border border-white/5 rounded-xl p-3 text-xs text-dark-400">
              <Lock size={14} className="text-dark-500 shrink-0" />
              <span>Defeat all standard levels in this world to unlock the Boss Battle!</span>
            </div>
          )}

          {/* List of Boss Problems */}
          {isUnlocked && (
            <div className="space-y-2">
               {bossProblems.map((prob) => {
                const isProbSolved = completedProblems.includes(prob.id);
                const hasNotes = !!problemNotes[prob.id];
                const hasCode = !!problemCode[prob.id]?.code;
                return (
                  <div 
                    key={prob.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-mono transition-all duration-300 ${
                      isProbSolved 
                        ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-300' 
                        : 'bg-black/30 border-white/5 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                      <span className="font-bold truncate">{prob.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {Boolean(prob.judgeSlug || (prob.url && prob.url.startsWith('/solve/'))) && (
                        <a
                          href={prob.judgeSlug ? `/solve/${prob.judgeSlug}` : prob.url}
                          className="px-2.5 py-1 bg-neon-green/10 hover:bg-neon-green hover:text-dark-950 text-neon-green text-[11px] font-bold rounded-lg border border-neon-green/30 flex items-center gap-1 transition-all shadow-sm"
                          title="Solve in TrackAsap Judge"
                        >
                          <Zap size={11} className="fill-current" />
                          <span>Solve</span>
                        </a>
                      )}

                      {/* Solve on LeetCode button (Always available) */}
                      <button
                        onClick={() => window.open(getLeetCodeUrl(prob), '_blank')}
                        className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30 transition-colors cursor-pointer"
                        title="Solve on LeetCode"
                      >
                        <ExternalLink size={12} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenNotes(prob);
                        }}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          hasNotes 
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            : 'bg-white/5 text-dark-400 hover:text-white border-white/5'
                        }`}
                        title="Write notes"
                      >
                        <FileText size={12} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCode(prob);
                        }}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          hasCode 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-white/5 text-dark-400 hover:text-white border-white/5'
                        }`}
                        title="Write code"
                      >
                        <Code size={12} />
                      </button>

                      {!isProbSolved && !isCompleted && (
                        <button
                          onClick={() => {
                            confetti({ particleCount: 20, origin: { y: 0.8 } });
                            onSolveProblem(prob.id, 50); // Hard problems in boss level give 50 XP
                          }}
                          className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors"
                        >
                          Mark Solved
                        </button>
                      )}

                      {isProbSolved && (
                        <span className="p-1 bg-yellow-500/10 rounded-lg text-yellow-500">
                          <Check size={12} className="stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Claim Victory Action Button */}
              {isFullySolved && !isCompleted && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClaimVictory}
                  className="w-full py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-dark-950 font-extrabold text-sm rounded-xl shadow-lg shadow-yellow-500/20 transition-all mt-4"
                >
                  🏆 Claim Victory & Complete World!
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BossLevel;
