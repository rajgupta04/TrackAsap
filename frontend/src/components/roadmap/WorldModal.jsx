import { motion } from 'framer-motion';
import { X, Star, BookOpen, Clock, Award, Shield } from 'lucide-react';
import ProblemTile from './ProblemTile';
import BossLevel from './BossLevel';
import { useRoadmapStore } from '../../store/roadmapStore';
import { WORLDS } from '../../data/roadmapData';

const WorldModal = ({ worldId, onClose, onCompleteWorld }) => {
  const { completedProblems, completedWorlds, completeProblem, completeBossLevel } = useRoadmapStore();
  
  const world = WORLDS.find((w) => w.id === worldId);
  if (!world) return null;

  const isWorldCompleted = completedWorlds.includes(world.id);
  const solvedCount = world.problems.filter((p) => completedProblems.includes(p.id)).length;
  const isBossUnlocked = solvedCount === world.problems.length;

  const handleCompleteProblem = (problemId, xp) => {
    completeProblem(world.id, problemId, xp);
  };

  const handleCompleteBoss = () => {
    completeBossLevel(world.id);
    onCompleteWorld(world);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md select-none">
      {/* ── Modal Backdrop Click Closer ── */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* ── Modal Window ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-3xl rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden z-10 max-h-[90vh] flex flex-col"
        style={{
          background: `linear-gradient(135deg, ${world.theme.gradient.split(' ')[1] || '#0f172a'} 0%, #020617 100%)`
        }}
      >
        {/* Dynamic theme glow background overlay */}
        <div 
          className="absolute inset-x-0 top-0 h-[250px] pointer-events-none opacity-40 mix-blend-screen"
          style={{ background: world.theme.bgOverlay }}
        />

        {/* ── Header ── */}
        <div className="relative flex justify-between items-start px-6 py-5 border-b border-white/5 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-4xl animate-bounce" style={{ animationDuration: '4s' }}>
              {world.emoji}
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {world.name}
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-3.5 h-3.5 ${
                      i < world.difficulty 
                        ? 'fill-amber-400 stroke-amber-400' 
                        : 'stroke-white/10 fill-white/5'
                    }`} 
                  />
                ))}
                <span className="text-[10px] text-dark-400 font-mono ml-1 uppercase">Difficulty</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-white/5 hover:bg-white/10 text-dark-400 hover:text-white rounded-xl border border-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body (Scrollable Content) ── */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar relative z-10 space-y-8">
          {/* Quick World Stats Cards */}
          <div className="grid grid-cols-3 gap-3 w-full">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col items-center text-center">
              <BookOpen size={16} className="text-neon-cyan mb-1" />
              <span className="text-[10px] text-dark-400 uppercase font-mono">Progress</span>
              <span className="text-sm font-bold text-white mt-0.5">{solvedCount} / {world.problems.length}</span>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col items-center text-center">
              <Clock size={16} className="text-amber-400 mb-1" />
              <span className="text-[10px] text-dark-400 uppercase font-mono">Est. Time</span>
              <span className="text-sm font-bold text-white mt-0.5">{world.estimatedTime}</span>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col items-center text-center">
              <Award size={16} className="text-neon-green mb-1" />
              <span className="text-[10px] text-dark-400 uppercase font-mono">Mastery</span>
              <span className="text-sm font-bold text-neon-green mt-0.5">{Math.round((solvedCount / world.problems.length) * 100)}%</span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-dark-400 leading-relaxed">
            {world.description}
          </div>

          {/* ── Level Map Nodes Grid ── */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-extrabold text-white tracking-widest mb-4">
              Level Progression
            </h3>

            {/* Candy Crush level grid layout */}
            <div className="grid grid-cols-4 xs:grid-cols-5 gap-y-8 gap-x-4 justify-items-center py-4 bg-black/20 border border-white/5 rounded-2xl">
              {world.problems.map((prob, idx) => {
                const isCompleted = completedProblems.includes(prob.id);
                // Level is unlocked if it's the first level OR the previous level is completed
                const isUnlocked = idx === 0 || completedProblems.includes(world.problems[idx - 1].id);
                const levelNum = idx + 1;

                return (
                  <ProblemTile
                    key={prob.id}
                    problem={prob}
                    levelNumber={levelNum}
                    isUnlocked={isUnlocked}
                    isCompleted={isCompleted}
                    onComplete={handleCompleteProblem}
                  />
                );
              })}
            </div>
          </div>

          {/* ── Boss Fight Section ── */}
          <BossLevel
            bossLevel={world.bossLevel}
            isUnlocked={isBossUnlocked}
            isCompleted={isWorldCompleted}
            completedProblems={completedProblems}
            onSolveProblem={handleCompleteProblem}
            onCompleteBoss={handleCompleteBoss}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default WorldModal;
