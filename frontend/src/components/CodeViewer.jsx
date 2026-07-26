import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import {
  Copy, Check, ExternalLink, Clock, Zap, HardDrive, RotateCcw,
  Edit2, Save, X, Plus, Trash2, ChevronDown, Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useProblemStore from '../store/problemStore';

const DIFFICULTY_COLORS = {
  easy: '#00B8A3',
  medium: '#FFC01E',
  hard: '#FF375F',
  unknown: '#888888',
};

const LANG_OPTIONS = [
  { value: 'cpp',        label: 'C++',        color: '#00599C' },
  { value: 'java',       label: 'Java',       color: '#f97316' },
  { value: 'python',     label: 'Python',     color: '#3B82F6' },
  { value: 'javascript', label: 'JavaScript', color: '#EAB308' },
  { value: 'c',          label: 'C',          color: '#5C6BC0' },
  { value: 'go',         label: 'Go',         color: '#00ACD7' },
  { value: 'rust',       label: 'Rust',       color: '#CE422B' },
  { value: 'other',      label: 'Other',      color: '#6B7280' },
];
const LANG_MAP = Object.fromEntries(LANG_OPTIONS.map(l => [l.value, l]));

// ── Helper: build a normalized solutions list from a problem ─────────────────
function normalizeSolutions(problem) {
  if (problem?.solutions?.length > 0) return problem.solutions;
  // Legacy: single code + language
  if (problem?.code) {
    return [{ _id: '__legacy__', language: problem.language || 'cpp', code: problem.code, label: 'Approach 1' }];
  }
  return [];
}

// ── Add-solution dropdown ────────────────────────────────────────────────────
const AddSolutionMenu = ({ onAdd, onClose }) => {
  const [lang, setLang] = useState('cpp');
  const [label, setLabel] = useState('');
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      className="absolute top-full right-0 mt-1 z-50 w-64 rounded-xl border shadow-2xl overflow-hidden"
      style={{ background: '#1e1f31', borderColor: 'rgba(255,255,255,0.08)' }}
      onClick={e => e.stopPropagation()}
    >
      <div className="p-3 space-y-2">
        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-2">New Solution</p>
        <select
          value={lang}
          onChange={e => setLang(e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg text-sm text-white outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {LANG_OPTIONS.map(o => (
            <option key={o.value} value={o.value} className="bg-gray-900">{o.label}</option>
          ))}
        </select>
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Label (e.g. DP Approach)"
          className="w-full px-3 py-1.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => { onAdd(lang, label); onClose(); }}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-[#39FF14]/15 text-[#39FF14] hover:bg-[#39FF14]/25 transition-all border border-[#39FF14]/20"
          >
            Add
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const CodeViewer = ({ isOpen, onClose, problem: problemProp, onSave }) => {
  const { addSolution, updateSolution, deleteSolution } = useProblemStore();

  // Use live problem from store if available (so UI updates after saves)
  const storeProblem = useProblemStore(s => s.problems.find(p => p._id === problemProp?._id));
  const problem = storeProblem || problemProp;

  const [copied, setCopied] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Solutions state
  const [solutions, setSolutions] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);

  // Edit state for the active solution
  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState('');
  const [editLang, setEditLang] = useState('cpp');
  const [editLabel, setEditLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Add-solution menu
  const [showAddMenu, setShowAddMenu] = useState(false);

  const constraintsRef = useRef(null);
  const textareaRef = useRef(null);

  // Sync solutions whenever the problem changes
  useEffect(() => {
    if (isOpen && problem) {
      const sols = normalizeSolutions(problem);
      setSolutions(sols);
      setActiveIdx(0);
      const first = sols[0];
      setEditCode(first?.code || '');
      setEditLang(first?.language || 'cpp');
      setEditLabel(first?.label || 'Approach 1');
      // Auto-open edit mode if no solutions yet
      setIsEditing(!first?.code && !!onSave);
    }
  }, [isOpen, problem, onSave]);

  // When active tab changes, reset edit state
  useEffect(() => {
    const sol = solutions[activeIdx];
    if (sol) {
      setEditCode(sol.code || '');
      setEditLang(sol.language || 'cpp');
      setEditLabel(sol.label || 'Approach 1');
      setIsEditing(!sol.code && !!onSave);
    }
  }, [activeIdx]); // eslint-disable-line

  const activeSolution = solutions[activeIdx];

  // Motion values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(0, { stiffness: 300, damping: 15, mass: 0.5 });
  const rotateY = useSpring(0, { stiffness: 300, damping: 15, mass: 0.5 });
  const scale = useSpring(1, { stiffness: 400, damping: 20 });

  const handleCopy = async () => {
    const text = isEditing ? editCode : activeSolution?.code;
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error('Failed to copy');
      }
    }
  };

  const handleMinimize = useCallback(() => {
    setMinimized(p => !p);
    if (maximized) setMaximized(false);
    scale.set(0.97);
    setTimeout(() => scale.set(1), 150);
  }, [maximized, scale]);

  const handleMaximize = useCallback(() => {
    setMaximized(p => !p);
    if (minimized) setMinimized(false);
    x.set(0); y.set(0);
    scale.set(1.02);
    setTimeout(() => scale.set(1), 200);
  }, [minimized, x, y, scale]);

  const handleDragStart = useCallback(() => { setIsDragging(true); scale.set(1.01); }, [scale]);
  const handleDrag = useCallback((_, info) => {
    rotateX.set(Math.max(-3, Math.min(3, -info.velocity.y * 0.01)));
    rotateY.set(Math.max(-3, Math.min(3, info.velocity.x * 0.01)));
  }, [rotateX, rotateY]);
  const handleDragEnd = useCallback(() => {
    setIsDragging(false); scale.set(1); rotateX.set(0); rotateY.set(0);
  }, [scale, rotateX, rotateY]);

  // Save the currently active solution
  const handleSave = async () => {
    if (!problem) return;
    setIsSaving(true);
    try {
      let updated;
      if (!activeSolution || activeSolution._id === '__legacy__') {
        // No real solution yet → create via addSolution
        updated = await addSolution(problem._id, { language: editLang, code: editCode, label: editLabel });
      } else {
        updated = await updateSolution(problem._id, activeSolution._id, {
          language: editLang,
          code: editCode,
          label: editLabel,
        });
      }
      // Also call legacy onSave if provided (e.g. for callers not yet using store)
      if (onSave) await onSave(problem._id, editCode, editLang);

      const newSols = normalizeSolutions(updated);
      setSolutions(newSols);
      toast.success('Solution saved!');
      setIsEditing(false);
    } catch {
      toast.error('Failed to save solution');
    } finally {
      setIsSaving(false);
    }
  };

  // Add a brand-new solution slot
  const handleAddSolution = async (lang, label) => {
    if (!problem) return;
    try {
      const updated = await addSolution(problem._id, { language: lang, code: '', label: label || undefined });
      const newSols = normalizeSolutions(updated);
      setSolutions(newSols);
      setActiveIdx(newSols.length - 1);
      // Auto-open edit mode for the new blank solution
      setEditCode('');
      setEditLang(lang);
      setEditLabel(label || `Approach ${newSols.length}`);
      setIsEditing(true);
    } catch {
      toast.error('Failed to add solution');
    }
  };

  // Delete a solution tab
  const handleDeleteSolution = async (sol, idx) => {
    if (!problem || sol._id === '__legacy__') return;
    if (solutions.length <= 1) {
      toast.error('Cannot delete the only solution');
      return;
    }
    try {
      const updated = await deleteSolution(problem._id, sol._id);
      const newSols = normalizeSolutions(updated);
      setSolutions(newSols);
      setActiveIdx(Math.max(0, Math.min(idx, newSols.length - 1)));
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to delete solution');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: end } = e.target;
      setEditCode(editCode.substring(0, s) + '    ' + editCode.substring(end));
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = s + 4;
        }
      }, 0);
    }
  };

  if (!isOpen || !problem) return null;

  const displayCode = isEditing ? editCode : (activeSolution?.code || '');
  const lineCount = Math.max(1, displayCode.split('\n').length);
  const langInfo = LANG_MAP[isEditing ? editLang : (activeSolution?.language || 'cpp')] || LANG_MAP.other;

  return (
    <AnimatePresence>
      <motion.div
        ref={constraintsRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center"
        onClick={onClose}
        style={{ perspective: 1200 }}
      >
        <style>{`
          .traffic-group:hover .dot-close,
          .traffic-group:hover .dot-minimize,
          .traffic-group:hover .dot-maximize { animation: wobble 0.5s ease-in-out; }
          .traffic-group:hover .dot-close { animation-delay: 0s; }
          .traffic-group:hover .dot-minimize { animation-delay: 0.05s; }
          .traffic-group:hover .dot-maximize { animation-delay: 0.1s; }
          .traffic-group:hover .dot-icon { opacity: 1; }
          .dot-icon { opacity: 0; transition: opacity 0.15s; }
          @keyframes wobble {
            0%  { transform: scale(1) rotate(0deg); }
            20% { transform: scale(1.15) rotate(-8deg); }
            40% { transform: scale(1.05) rotate(6deg); }
            60% { transform: scale(1.1) rotate(-4deg); }
            80% { transform: scale(1.02) rotate(2deg); }
            100%{ transform: scale(1) rotate(0deg); }
          }
          .code-window { transition: width 0.3s ease, max-height 0.3s ease; }
          .code-window.maximized {
            width: 100vw !important; max-width: 100vw !important;
            max-height: 100vh !important; height: 100vh !important;
            border-radius: 0 !important;
          }
          .titlebar-drag { cursor: grab; user-select: none; }
          .titlebar-drag:active { cursor: grabbing; }
          .textarea-code {
            background: transparent; color: #a9b1d6;
            font-family: 'JetBrains Mono','Fira Code','Cascadia Code','Consolas',monospace;
            font-size: 13px; line-height: 1.6; border: none; outline: none;
            resize: none; width: 100%; min-height: 100%; padding: 16px;
            white-space: pre; overflow-x: auto; tab-size: 4;
          }
          .sol-tab { transition: all 0.15s; }
          .sol-tab:hover .sol-tab-del { opacity: 1; }
          .sol-tab-del { opacity: 0; transition: opacity 0.12s; }
        `}</style>

        <motion.div
          drag={!maximized}
          dragConstraints={constraintsRef}
          dragElastic={0.08}
          dragMomentum
          dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          initial={{ scale: 0.88, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className={`code-window overflow-hidden ${maximized ? 'maximized' : 'rounded-xl'}`}
          style={{
            x, y, scale, rotateX, rotateY,
            width: maximized ? '100vw' : undefined,
            maxWidth: maximized ? '100vw' : '64rem',
            maxHeight: maximized ? '100vh' : '90vh',
            boxShadow: isDragging
              ? '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.15)'
              : '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="h-full flex flex-col" style={{ background: '#1a1b26' }}>

            {/* ── Title Bar ── */}
            <div
              className="titlebar-drag flex items-center justify-between px-4 py-3 border-b"
              style={{ background: 'linear-gradient(180deg,#2a2b3d 0%,#1e1f31 100%)', borderColor: 'rgba(255,255,255,0.06)' }}
              onDoubleClick={handleMaximize}
            >
              {/* Traffic lights */}
              <div className="traffic-group flex items-center gap-2" onMouseDown={e => e.stopPropagation()}>
                <button onClick={onClose} className="dot-close w-3.5 h-3.5 rounded-full bg-[#FF5F57] hover:brightness-90 transition-all flex items-center justify-center relative" title="Close">
                  <svg className="dot-icon w-[8px] h-[8px] absolute" viewBox="0 0 12 12" fill="none">
                    <path d="M3 3L9 9M9 3L3 9" stroke="#4D0000" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
                <button onClick={handleMinimize} className="dot-minimize w-3.5 h-3.5 rounded-full bg-[#FEBC2E] hover:brightness-90 transition-all flex items-center justify-center relative" title={minimized ? 'Expand' : 'Minimize'}>
                  <svg className="dot-icon w-[8px] h-[8px] absolute" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6H9.5" stroke="#995700" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
                <button onClick={handleMaximize} className="dot-maximize w-3.5 h-3.5 rounded-full bg-[#28C840] hover:brightness-90 transition-all flex items-center justify-center relative" title={maximized ? 'Restore' : 'Maximize'}>
                  <svg className="dot-icon w-[7px] h-[7px] absolute" viewBox="0 0 12 12" fill="none">
                    {maximized ? (
                      <>
                        <path d="M3.5 8.5L8.5 3.5" stroke="#006500" strokeWidth="1.4" strokeLinecap="round" />
                        <path d="M4 3.5H8.5V8" stroke="#006500" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 8.5H3.5V4" stroke="#006500" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </>
                    ) : (
                      <path d="M2 10L10 2M10 2H4.5M10 2V7.5" stroke="#006500" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                  </svg>
                </button>
              </div>

              {/* Title */}
              <div className="flex items-center gap-2 text-sm text-gray-400 font-medium flex-1 justify-center min-w-0 px-4 select-none">
                <span className="truncate max-w-xs">{problem.title}</span>
                <span className="text-gray-600">—</span>
                <span className="text-xs font-semibold capitalize" style={{ color: DIFFICULTY_COLORS[problem.difficulty] }}>
                  {problem.difficulty}
                </span>
                {isEditing && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-500/10 text-amber-500 ml-2">Editing</span>
                )}
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-1" onMouseDown={e => e.stopPropagation()}>
                {onSave && !isEditing && activeSolution && (
                  <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-500 hover:text-white rounded-md hover:bg-white/5 transition-all mr-1" title="Edit">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {onSave && isEditing && (
                  <button onClick={() => { setIsEditing(false); setEditCode(activeSolution?.code || ''); setEditLang(activeSolution?.language || 'cpp'); setEditLabel(activeSolution?.label || 'Approach 1'); }}
                    className="p-1.5 text-gray-500 hover:text-white rounded-md hover:bg-white/5 transition-all mr-1" title="Cancel">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {problem.link && (
                  <a href={problem.link} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 text-gray-500 hover:text-[#8B5CF6] rounded-md hover:bg-white/5 transition-all" title="Open problem">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button onClick={handleCopy}
                  className={`p-1.5 rounded-md transition-all ${copied ? 'text-[#28C840] bg-[#28C840]/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  title="Copy code">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* ── Collapsible body ── */}
            <motion.div
              animate={{ height: minimized ? 0 : 'auto', opacity: minimized ? 0 : 1 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              {/* ── Solution Tabs ── */}
              {(solutions.length > 0 || onSave) && (
                <div
                  className="flex items-center gap-1 px-3 pt-2 pb-0 border-b overflow-x-auto flex-shrink-0"
                  style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}
                >
                  {solutions.map((sol, idx) => {
                    const lang = LANG_MAP[sol.language] || LANG_MAP.other;
                    const isActive = idx === activeIdx;
                    return (
                      <div
                        key={sol._id || idx}
                        className={`sol-tab relative flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium cursor-pointer select-none flex-shrink-0 group ${
                          isActive
                            ? 'text-white'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                        style={{
                          background: isActive ? '#1a1b26' : 'transparent',
                          borderTop: isActive ? `2px solid ${lang.color}` : '2px solid transparent',
                          marginBottom: isActive ? '-1px' : 0,
                        }}
                        onClick={() => { if (!isEditing) { setActiveIdx(idx); } }}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: lang.color }} />
                        <span className="truncate max-w-[120px]">{sol.label || lang.label}</span>
                        {solutions.length > 1 && sol._id !== '__legacy__' && onSave && (
                          <button
                            className="sol-tab-del ml-0.5 text-gray-600 hover:text-red-400 transition-colors"
                            onClick={e => { e.stopPropagation(); handleDeleteSolution(sol, idx); }}
                            title="Delete this solution"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Add solution button */}
                  {onSave && (
                    <div className="relative flex-shrink-0 ml-1">
                      <button
                        onClick={e => { e.stopPropagation(); setShowAddMenu(v => !v); }}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:text-[#39FF14] hover:bg-[#39FF14]/8 transition-all"
                        title="Add new solution"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                      <AnimatePresence>
                        {showAddMenu && (
                          <AddSolutionMenu
                            onAdd={handleAddSolution}
                            onClose={() => setShowAddMenu(false)}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}

              {/* ── Meta bar ── */}
              <div
                className="flex items-center gap-3 px-4 py-2 text-xs border-b flex-wrap"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}
              >
                {/* Language selector / badge */}
                {isEditing ? (
                  <select
                    value={editLang}
                    onChange={e => setEditLang(e.target.value)}
                    className="px-2 py-0.5 rounded-md font-bold outline-none"
                    style={{ background: `${langInfo.color}22`, color: langInfo.color, border: `1px solid ${langInfo.color}44` }}
                  >
                    {LANG_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-gray-900">{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <span className="px-2 py-0.5 rounded-md font-bold tracking-wide"
                    style={{ background: `${langInfo.color}22`, color: langInfo.color }}>
                    {langInfo.label}
                  </span>
                )}

                {/* Label editor in edit mode */}
                {isEditing && (
                  <input
                    value={editLabel}
                    onChange={e => setEditLabel(e.target.value)}
                    placeholder="Label (e.g. DP Approach)"
                    className="px-2 py-0.5 rounded-md text-xs text-gray-300 outline-none flex-1 min-w-0 max-w-[180px]"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                )}

                <span className="text-gray-600 capitalize">{problem.platform}</span>
                {problem.timeSpent > 0 && (
                  <span className="flex items-center gap-1 text-gray-400"><Clock className="w-3 h-3" />{problem.timeSpent} min</span>
                )}
                {problem.runtime && (
                  <span className="flex items-center gap-1 text-emerald-400"><Zap className="w-3 h-3" />{problem.runtime}</span>
                )}
                {problem.memory && (
                  <span className="flex items-center gap-1 text-cyan-400"><HardDrive className="w-3 h-3" />{problem.memory}</span>
                )}
                {problem.attempts > 1 && (
                  <span className="flex items-center gap-1 text-amber-400"><RotateCcw className="w-3 h-3" />{problem.attempts} attempts</span>
                )}
                {problem.source === 'track-ex' && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-purple-500/15 text-purple-400 border border-purple-500/25 rounded tracking-wider">track-Ex</span>
                )}
                <span className="text-gray-600 ml-auto">{lineCount} lines</span>
              </div>

              {/* ── Code Area ── */}
              <div
                className="flex-1 overflow-auto min-h-0 relative"
                style={{ background: '#1a1b26', maxHeight: maximized ? 'calc(100vh - 180px)' : '52vh' }}
              >
                {(displayCode || isEditing) ? (
                  <div className="flex min-h-full">
                    {/* Line numbers */}
                    <div
                      className="sticky left-0 select-none text-right py-4 px-3 flex-shrink-0"
                      style={{
                        background: '#1a1b26',
                        borderRight: '1px solid rgba(255,255,255,0.04)',
                        fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code','Consolas',monospace",
                        fontSize: '13px', lineHeight: '1.6', color: '#3b3d52',
                        minWidth: lineCount >= 100 ? '52px' : '40px', zIndex: 10,
                      }}
                    >
                      {Array.from({ length: lineCount }).map((_, i) => <div key={i}>{i + 1}</div>)}
                    </div>

                    <div className="flex-1 flex">
                      {isEditing ? (
                        <textarea
                          ref={textareaRef}
                          value={editCode}
                          onChange={e => setEditCode(e.target.value)}
                          onKeyDown={handleKeyDown}
                          spellCheck={false}
                          className="textarea-code"
                          placeholder="Paste or type your code here..."
                        />
                      ) : (
                        <pre
                          className="py-4 px-4 flex-1 overflow-x-auto m-0 bg-transparent"
                          style={{ fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code','Consolas',monospace", fontSize: '13px', lineHeight: '1.6', color: '#a9b1d6', tabSize: 4 }}
                        >
                          <code>{displayCode}</code>
                        </pre>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-600">
                    <div className="text-center">
                      <div className="text-3xl mb-2 opacity-30">{'{ }'}</div>
                      <p className="text-sm">No code saved for this solution</p>
                      {onSave && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="mt-4 px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-400 hover:text-white transition-all"
                        >
                          Add Code
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Footer ── */}
              <div
                className="flex items-center justify-between px-4 py-3 border-t"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                {isEditing ? (
                  <div className="w-full flex justify-end gap-3">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-5 py-1.5 bg-neon-green text-black font-semibold rounded-lg hover:bg-neon-green/90 transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {isSaving ? 'Saving...' : 'Save Solution'}
                    </button>
                  </div>
                ) : (
                  <>
                    {problem.notes ? (
                      <div className="flex-1 min-w-0 pr-4">
                        <span className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">Notes: </span>
                        <span className="text-xs text-gray-400 truncate block sm:inline">{problem.notes}</span>
                      </div>
                    ) : <div />}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {problem.source === 'track-ex' && problem.leetcodeSlug && (
                        <a
                          href={`https://leetcode.com/problems/${problem.leetcodeSlug}/`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-[10px] text-gray-600 hover:text-[#8B5CF6] transition-colors"
                        >
                          View on LeetCode →
                        </a>
                      )}
                      <span className="text-[10px] text-gray-600">
                        {new Date(problem.solvedAt || problem.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CodeViewer;
