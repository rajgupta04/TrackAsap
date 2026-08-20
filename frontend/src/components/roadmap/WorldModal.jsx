import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, BookOpen, Clock, Award, Shield, StickyNote, Code } from 'lucide-react';
import ProblemTile from './ProblemTile';
import BossLevel from './BossLevel';
import { useRoadmapStore } from '../../store/roadmapStore';
import { WORLDS } from '../../data/roadmapData';
import CodeViewer from '../CodeViewer';
import GlassCard from '../ui/GlassCard';

const WorldModal = ({ worldId, onClose, onCompleteWorld }) => {
  const { 
    completedProblems = [], 
    completedWorlds = [], 
    completeProblem, 
    completeBossLevel, 
    questionMode = 'blind75',
    problemNotes = {},
    problemCode = {},
    saveProblemNotes,
    saveProblemCode,
    worlds = WORLDS,
  } = useRoadmapStore();

  const [selectedProblemForNotes, setSelectedProblemForNotes] = useState(null);
  const [selectedProblemForCode, setSelectedProblemForCode] = useState(null);
  
  const world = (worlds || WORLDS).find((w) => w.id === worldId);
  if (!world) return null;

  const activeProblems = world.problems.filter((p) => p[questionMode]);

  const isWorldCompleted = completedWorlds.includes(world.id);
  const solvedCount = activeProblems.filter((p) => completedProblems.includes(p.id)).length;
  const isBossUnlocked = solvedCount === activeProblems.length;

  const handleCompleteProblem = (problemId, xp) => {
    completeProblem(world.id, problemId, xp);
  };

  const handleCompleteBoss = () => {
    completeBossLevel(world.id);
    onCompleteWorld(world);
  };

  const handleSaveNotes = (problemId, notesText) => {
    saveProblemNotes(problemId, notesText);
    setSelectedProblemForNotes(null);
  };

  const handleSaveCode = (problemId, codeText, languageSelected, solutions) => {
    saveProblemCode(problemId, codeText, languageSelected, solutions);
    setSelectedProblemForCode(null);
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
          background: `linear-gradient(135deg, ${world.theme.bgColor || '#0f172a'} 0%, #020617 100%)`
        }}
      >
        {/* Dynamic theme glow background overlay */}
        <div 
          className="absolute inset-x-0 top-0 h-[250px] pointer-events-none opacity-40 mix-blend-screen"
          style={{ background: world.theme.bgOverlay }}
        />

        {/* ── Header ── */}
        <div className="relative flex justify-between items-start px-6 py-5 border-b border-white/5 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <img 
              src={`/assets/roadmap/${world.image || `island_${world.id}.png`}`} 
              alt={world.name} 
              className="w-16 h-16 object-contain animate-bounce shrink-0" 
              style={{ animationDuration: '6s' }}
            />
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
              <span className="text-sm font-bold text-white mt-0.5">{solvedCount} / {activeProblems.length}</span>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col items-center text-center">
              <Clock size={16} className="text-amber-400 mb-1" />
              <span className="text-[10px] text-dark-400 uppercase font-mono">Est. Time</span>
              <span className="text-sm font-bold text-white mt-0.5">{world.estimatedTime}</span>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col items-center text-center">
              <Award size={16} className="text-neon-green mb-1" />
              <span className="text-[10px] text-dark-400 uppercase font-mono">Mastery</span>
              <span className="text-sm font-bold text-neon-green mt-0.5">{activeProblems.length > 0 ? Math.round((solvedCount / activeProblems.length) * 100) : 0}%</span>
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
            <div className="grid grid-cols-4 gap-y-8 gap-x-4 justify-items-center py-4 bg-black/20 border border-white/5 rounded-2xl">
              {activeProblems.map((prob, idx) => {
                const isCompleted = completedProblems.includes(prob.id);
                // Level is unlocked if it's the first level OR the previous level is completed
                const isUnlocked = idx === 0 || completedProblems.includes(activeProblems[idx - 1].id);
                const levelNum = idx + 1;

                return (
                  <ProblemTile
                    key={prob.id}
                    problem={prob}
                    levelNumber={levelNum}
                    gridIndex={idx}
                    isUnlocked={isUnlocked}
                    isCompleted={isCompleted}
                    onComplete={handleCompleteProblem}
                    onOpenNotes={setSelectedProblemForNotes}
                    onOpenCode={setSelectedProblemForCode}
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
            onOpenNotes={setSelectedProblemForNotes}
            onOpenCode={setSelectedProblemForCode}
          />
        </div>
      </motion.div>

      {/* Notes Modal */}
      <AnimatePresence>
        {selectedProblemForNotes && (
          <NotesModal
            problem={{
              id: selectedProblemForNotes.id,
              title: selectedProblemForNotes.title,
              notes: problemNotes[selectedProblemForNotes.id] || ''
            }}
            onClose={() => setSelectedProblemForNotes(null)}
            onSave={handleSaveNotes}
          />
        )}
      </AnimatePresence>

      {/* Code Viewer / Editor Modal */}
      {selectedProblemForCode && (
        <CodeViewer
          isOpen={!!selectedProblemForCode}
          onClose={() => setSelectedProblemForCode(null)}
          problem={{
            _id: selectedProblemForCode.id,
            id: selectedProblemForCode.id,
            title: selectedProblemForCode.title,
            difficulty: selectedProblemForCode.difficulty,
            url: selectedProblemForCode.url,
            code: problemCode[selectedProblemForCode.id]?.code || '',
            language: problemCode[selectedProblemForCode.id]?.language || 'cpp',
            solutions: problemCode[selectedProblemForCode.id]?.solutions || [],
            isRoadmapProblem: true
          }}
          onSave={handleSaveCode}
        />
      )}
    </div>
  );
};

// Notes Modal Component for Roadmap Problems
const NotesModal = ({ problem, onClose, onSave }) => {
  const [notes, setNotes] = useState(problem.notes || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(problem.id, notes);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full h-[100dvh] sm:h-auto sm:max-w-lg rounded-none sm:rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard className="p-4 sm:p-6 h-full sm:h-auto overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-purple-400" />
                Notes
              </h2>
              <p className="text-sm text-gray-400 mt-1 truncate max-w-[220px] sm:max-w-[300px]">{problem.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-2 text-xs text-gray-500">Where did you get stuck? What clicked? Key insights...</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes here...

• Where I got stuck:
• The key insight:
• Time/Space complexity:
• Pattern to remember:"
              rows={8}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-purple-400 outline-none resize-none font-mono text-sm"
              autoFocus
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-400 hover:to-indigo-500 shadow-lg shadow-purple-500/25 transition-all"
              >
                Save Notes
              </button>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

export default WorldModal;
