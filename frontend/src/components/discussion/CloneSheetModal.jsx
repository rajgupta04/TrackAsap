import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  BookOpen,
  CheckSquare,
  Square,
  FileText,
  Code2,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  Loader2,
  GitFork,
} from 'lucide-react';

const CloneSheetModal = ({ isOpen, post, onClose, onClone }) => {
  const snapshot = post?.sharedSheetSnapshot;

  const [sheetName, setSheetName] = useState('');
  const [includeProgress, setIncludeProgress] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeCode, setIncludeCode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync default sheet name when modal opens
  useEffect(() => {
    if (snapshot?.name) {
      setSheetName(snapshot.name);
    } else {
      setSheetName('Cloned Practice Sheet');
    }
    // Default to full clone enabled
    setIncludeProgress(true);
    setIncludeNotes(true);
    setIncludeCode(true);
    setIsSubmitting(false);
  }, [snapshot, isOpen]);

  if (!isOpen || !post || !snapshot) return null;

  const isFullClone = includeProgress && includeNotes && includeCode;

  const handleToggleFullClone = () => {
    if (isFullClone) {
      // Uncheck all for clean slate
      setIncludeProgress(false);
      setIncludeNotes(false);
      setIncludeCode(false);
    } else {
      // Enable all
      setIncludeProgress(true);
      setIncludeNotes(true);
      setIncludeCode(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sheetName.trim()) return;

    setIsSubmitting(true);
    try {
      await onClone({
        name: sheetName.trim(),
        includeProgress,
        includeNotes,
        includeCode,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const completionPercent =
    snapshot.totalProblems > 0
      ? Math.round(((snapshot.solvedProblems || 0) / snapshot.totalProblems) * 100)
      : 0;

  const authorName = post.user?.name || post.author?.name || 'Community Member';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-6 text-white my-auto select-none"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-all disabled:opacity-50"
          >
            <X size={18} />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center text-neon-green shrink-0 shadow-[0_0_15px_rgba(57,255,20,0.15)]">
              <GitFork size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Clone Practice Sheet
              </h2>
              <p className="text-xs text-dark-400">
                Import this sheet and curate it in your personal Sheets workspace
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Original Sheet Details Card */}
            <div className="p-3.5 rounded-xl bg-dark-950/70 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-dark-400">Shared by:</span>
                <span className="font-semibold text-white">
                  {authorName}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-dark-400">Category:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-dark-800 text-neon-green uppercase border border-neon-green/20">
                  {snapshot.category || 'DSA'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
                <div className="bg-dark-900/80 p-2 rounded-lg border border-white/5">
                  <div className="text-sm font-bold text-white">{snapshot.totalProblems || 0}</div>
                  <div className="text-[10px] text-dark-400">Problems</div>
                </div>
                <div className="bg-dark-900/80 p-2 rounded-lg border border-white/5">
                  <div className="text-sm font-bold text-emerald-400">{snapshot.solvedProblems || 0}</div>
                  <div className="text-[10px] text-dark-400">Author Solved</div>
                </div>
                <div className="bg-dark-900/80 p-2 rounded-lg border border-white/5">
                  <div className="text-sm font-bold text-neon-green">
                    {snapshot.topics?.length || 0}
                  </div>
                  <div className="text-[10px] text-dark-400">Topics</div>
                </div>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-emerald-400/90 font-medium">
                <GitFork size={12} className="shrink-0 text-emerald-400" />
                <span>Permanent creator credits acknowledging {authorName} will be attached.</span>
              </div>
            </div>

            {/* Editable Sheet Name Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-dark-200">
                  Sheet Name
                </label>
                <span className="text-[10px] text-neon-green font-mono">
                  Customizable
                </span>
              </div>
              <input
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="Enter sheet name..."
                required
                maxLength={100}
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-white/10 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/30 transition-all font-medium"
              />
              <p className="text-[11px] text-dark-400 mt-1">
                You can change the name so you easily recognize it in your sidebar.
              </p>
            </div>

            {/* Clone Options & Checkboxes */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-dark-200 uppercase tracking-wider">
                  Clone Options
                </span>
                <button
                  type="button"
                  onClick={handleToggleFullClone}
                  className="text-[11px] text-neon-green hover:underline font-mono"
                >
                  {isFullClone ? 'Uncheck All (Fresh Slate)' : 'Check All (Full Clone)'}
                </button>
              </div>

              {/* Master Full Clone Card */}
              <div
                onClick={handleToggleFullClone}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  isFullClone
                    ? 'bg-neon-green/10 border-neon-green/30 shadow-[0_0_15px_rgba(57,255,20,0.08)]'
                    : 'bg-dark-950/60 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="mt-0.5 text-neon-green shrink-0">
                  {isFullClone ? (
                    <CheckSquare size={18} className="fill-neon-green/20" />
                  ) : (
                    <Square size={18} className="text-dark-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">
                      Full Clone Mode
                    </span>
                    <span className="text-[10px] bg-neon-green/20 text-neon-green px-1.5 py-0.2 rounded font-mono">
                      All Included
                    </span>
                  </div>
                  <p className="text-[11px] text-dark-400 mt-0.5 leading-relaxed">
                    Imports problems with author's solved checkmarks, personal notes, and code submissions.
                  </p>
                </div>
              </div>

              {/* Individual Granular Checkboxes */}
              <div className="grid grid-cols-1 gap-2 pt-1">
                {/* 1. Solved Status & Progress Checkbox */}
                <div
                  onClick={() => setIncludeProgress(!includeProgress)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                    includeProgress
                      ? 'bg-dark-950 border-emerald-500/30 text-white'
                      : 'bg-dark-950/40 border-white/5 text-dark-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="mt-0.5 shrink-0 text-emerald-400">
                    {includeProgress ? (
                      <CheckCircle2 size={16} className="fill-emerald-400/20" />
                    ) : (
                      <Square size={16} className="text-dark-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold">
                      Mark {snapshot.solvedProblems || 0} Solved Problems ({completionPercent}%)
                    </div>
                    <div className="text-[10px] text-dark-400">
                      {includeProgress
                        ? 'Retains solved checkmarks so you resume where the author left off.'
                        : 'Unchecked: Starts clean with 0% solved (recommended for fresh practice).'}
                    </div>
                  </div>
                </div>

                {/* 2. Personal Notes & Explanations Checkbox */}
                <div
                  onClick={() => setIncludeNotes(!includeNotes)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                    includeNotes
                      ? 'bg-dark-950 border-purple-500/30 text-white'
                      : 'bg-dark-950/40 border-white/5 text-dark-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="mt-0.5 shrink-0 text-purple-400">
                    {includeNotes ? (
                      <CheckSquare size={16} className="fill-purple-400/20" />
                    ) : (
                      <Square size={16} className="text-dark-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold">
                      Include Notes & Explanations
                    </div>
                    <div className="text-[10px] text-dark-400">
                      {includeNotes
                        ? 'Copies all study notes and approach hints attached to problems.'
                        : 'Unchecked: Blank notes area so you can write your own notes.'}
                    </div>
                  </div>
                </div>

                {/* 3. Attached Code Solutions Checkbox */}
                <div
                  onClick={() => setIncludeCode(!includeCode)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                    includeCode
                      ? 'bg-dark-950 border-blue-500/30 text-white'
                      : 'bg-dark-950/40 border-white/5 text-dark-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="mt-0.5 shrink-0 text-blue-400">
                    {includeCode ? (
                      <CheckSquare size={16} className="fill-blue-400/20" />
                    ) : (
                      <Square size={16} className="text-dark-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold">
                      Include Attached Code Solutions
                    </div>
                    <div className="text-[10px] text-dark-400">
                      {includeCode
                        ? 'Copies full code implementations & multi-approach solutions.'
                        : 'Unchecked: Code playground opens with standard starter templates.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-dark-300 hover:text-white bg-dark-800 hover:bg-dark-700 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !sheetName.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-neon-green text-dark-950 hover:bg-neon-green/90 transition-all shadow-[0_0_15px_rgba(57,255,20,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Cloning Sheet...</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Clone to My Sheets</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CloneSheetModal;
