import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import {
  Copy, Check, ExternalLink, Clock, Zap, HardDrive, RotateCcw,
  Edit2, Save, X, Plus, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useProblemStore from '../store/problemStore';
import sheetProblemService from '../services/sheetProblemService';

// ── Constants ──────────────────────────────────────────────────────────────
const DIFFICULTY_COLORS = {
  easy: '#00B8A3', medium: '#FFC01E', hard: '#FF375F', unknown: '#888888',
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

// ── Helpers ────────────────────────────────────────────────────────────────

// Build { label → { language → code } } map from solutions[]
function buildCodeMap(solutions) {
  if (!solutions || solutions.length === 0) return {};
  const map = {};
  for (const sol of solutions) {
    const label = sol.label || 'Approach 1';
    if (!map[label]) map[label] = {};
    map[label][sol.language || 'cpp'] = sol.code || '';
  }
  return map;
}

// Flatten { label → { language → code } } back to solutions[]
function flattenCodeMap(codeMap) {
  const out = [];
  for (const [label, langs] of Object.entries(codeMap)) {
    for (const [language, code] of Object.entries(langs)) {
      out.push({ label, language, code });
    }
  }
  return out;
}

// Get solutions from problem (handles legacy code/language too)
function getSolutions(problem) {
  if (problem?.solutions?.length > 0) return problem.solutions;
  if (problem?.code) {
    return [{ language: problem.language || 'cpp', code: problem.code, label: 'Approach 1' }];
  }
  return [];
}

// ── Main Component ─────────────────────────────────────────────────────────
const CodeViewer = ({ isOpen, onClose, problem: problemProp, onSave }) => {
  const { updateProblem } = useProblemStore();
  const storeProblem = useProblemStore(s => s.problems.find(p => p._id === problemProp?._id));
  const problem = storeProblem || problemProp;

  // ── Window state
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Code map: { label → { lang → code } }
  const [codeMap, setCodeMap] = useState({});
  const [activeLabel, setActiveLabel] = useState('');
  const [activeLang, setActiveLang] = useState('cpp');

  // ── Approach adder state
  const [addingApproach, setAddingApproach] = useState(false);
  const [newApproachInput, setNewApproachInput] = useState('');

  // ── Edit / save state
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const constraintsRef = useRef(null);
  const textareaRef = useRef(null);
  const newApproachRef = useRef(null);

  // ── Unsaved prompt state
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowUnsavedModal(true);
    } else {
      onClose();
    }
  };

  // ── Load / reset when problem changes
  useEffect(() => {
    if (!isOpen || !problem) return;
    setShowUnsavedModal(false);
    const solutions = getSolutions(problem);
    const map = buildCodeMap(solutions);
    const isEmpty = Object.keys(map).length === 0;

    if (isEmpty) {
      const initMap = { 'Approach 1': { cpp: '' } };
      setCodeMap(initMap);
      setActiveLabel('Approach 1');
      setActiveLang('cpp');
    } else {
      setCodeMap(map);
      const firstLabel = Object.keys(map)[0];
      const firstLang = Object.keys(map[firstLabel])[0] || 'cpp';
      setActiveLabel(firstLabel);
      setActiveLang(firstLang);
    }
    setIsEditing(true);
    setIsDirty(false);
    setAddingApproach(false);
  }, [isOpen, problem?._id]); // eslint-disable-line

  // Motion
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(0, { stiffness: 300, damping: 15, mass: 0.5 });
  const rotateY = useSpring(0, { stiffness: 300, damping: 15, mass: 0.5 });
  const scale = useSpring(1, { stiffness: 400, damping: 20 });

  // ── Derived values
  const approaches = Object.keys(codeMap);
  const langsForApproach = Object.keys(codeMap[activeLabel] || {});
  const currentCode = codeMap[activeLabel]?.[activeLang] ?? '';
  const langInfo = LANG_MAP[activeLang] || LANG_MAP.other;

  // ── Code editing
  const updateCode = useCallback((newCode) => {
    setCodeMap(prev => ({
      ...prev,
      [activeLabel]: { ...(prev[activeLabel] || {}), [activeLang]: newCode },
    }));
    setIsDirty(true);
  }, [activeLabel, activeLang]);

  // ── Approach switching — NO POPUPS, smooth default behavior
  const switchApproach = (label) => {
    setActiveLabel(label);
    const langs = Object.keys(codeMap[label] || {});
    setActiveLang(langs[0] || 'cpp');
  };

  // ── Language switching via dropdown — seamless independent code per language
  const switchLang = (newLang) => {
    setActiveLang(newLang);
  };

  // ── Add a new approach
  const confirmAddApproach = () => {
    const label = newApproachInput.trim() || `Approach ${approaches.length + 1}`;
    if (codeMap[label]) {
      toast.error('An approach with this name already exists');
      return;
    }
    const newMap = { ...codeMap, [label]: { cpp: '' } };
    setCodeMap(newMap);
    setActiveLabel(label);
    setActiveLang('cpp');
    setAddingApproach(false);
    setNewApproachInput('');
    setIsDirty(true);
  };

  // ── Delete approach
  const deleteApproach = (label) => {
    if (approaches.length <= 1) { toast.error("Can't delete the only approach"); return; }
    const newMap = { ...codeMap };
    delete newMap[label];
    setCodeMap(newMap);
    const remaining = Object.keys(newMap);
    setActiveLabel(remaining[0]);
    setActiveLang(Object.keys(newMap[remaining[0]])[0] || 'cpp');
    setIsDirty(true);
  };

  // ── Save all to DB
  const handleSave = async () => {
    if (!problem) return;
    setIsSaving(true);
    try {
      const flatSolutions = flattenCodeMap(codeMap);
      const firstSol = flatSolutions[0];

      if (problem.isSheetProblem) {
        const activeCode = codeMap[activeLabel]?.[activeLang] || '';
        if (onSave) await onSave(problem._id, activeCode, activeLang);
        else await sheetProblemService.updateProblem(problem._id, { code: activeCode, language: activeLang, solutions: flatSolutions });
      } else {
        await updateProblem(problem._id, {
          solutions: flatSolutions,
          code: firstSol?.code || '',
          language: firstSol?.language || 'cpp',
        });
      }

      toast.success('Saved successfully!');
      setIsDirty(false);
    } catch (err) {
      console.error('[CodeViewer] Save failed:', err?.response?.data || err?.message);
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Tab key handler
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: end } = e.target;
      const newCode = currentCode.substring(0, s) + '    ' + currentCode.substring(end);
      updateCode(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = s + 4;
        }
      }, 0);
    }
  };

  const handleCopy = async () => {
    if (currentCode) {
      try {
        await navigator.clipboard.writeText(currentCode);
        setCopied(true);
        toast.success('Copied!');
        setTimeout(() => setCopied(false), 2000);
      } catch { toast.error('Failed to copy'); }
    }
  };

  const handleMinimize = useCallback(() => {
    setMinimized(p => !p); if (maximized) setMaximized(false);
    scale.set(0.97); setTimeout(() => scale.set(1), 150);
  }, [maximized, scale]);

  const handleMaximize = useCallback(() => {
    setMaximized(p => !p); if (minimized) setMinimized(false);
    x.set(0); y.set(0); scale.set(1.02); setTimeout(() => scale.set(1), 200);
  }, [minimized, x, y, scale]);

  const handleDragStart = useCallback(() => { setIsDragging(true); scale.set(1.01); }, [scale]);
  const handleDrag = useCallback((_, info) => {
    rotateX.set(Math.max(-3, Math.min(3, -info.velocity.y * 0.01)));
    rotateY.set(Math.max(-3, Math.min(3, info.velocity.x * 0.01)));
  }, [rotateX, rotateY]);
  const handleDragEnd = useCallback(() => {
    setIsDragging(false); scale.set(1); rotateX.set(0); rotateY.set(0);
  }, [scale, rotateX, rotateY]);

  const actualLineCount = currentCode ? currentCode.split('\n').length : 0;
  const displayLinesCount = Math.max(17, actualLineCount);

  if (!isOpen || !problem) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={constraintsRef}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center"
        onClick={handleCloseAttempt}
        style={{ perspective: 1200 }}
      >
        <style>{`
          .cv-traffic:hover .cv-dot-icon { opacity: 1; }
          .cv-dot-icon { opacity: 0; transition: opacity 0.15s; }
          .cv-traffic:hover button { animation: cv-wobble 0.5s ease-in-out; }
          .cv-traffic:hover button:nth-child(2) { animation-delay:0.05s; }
          .cv-traffic:hover button:nth-child(3) { animation-delay:0.1s; }
          @keyframes cv-wobble {
            0%,100%{ transform: scale(1) rotate(0deg); }
            20%{ transform: scale(1.15) rotate(-8deg); }
            40%{ transform: scale(1.05) rotate(6deg); }
            60%{ transform: scale(1.1) rotate(-4deg); }
            80%{ transform: scale(1.02) rotate(2deg); }
          }
          .cv-window { transition: width 0.3s ease, max-height 0.3s ease; }
          .cv-window.maximized {
            width:100vw!important; max-width:100vw!important;
            max-height:100vh!important; height:100vh!important;
            border-radius:0!important;
          }
          .cv-titlebar { cursor:grab; user-select:none; }
          .cv-titlebar:active { cursor:grabbing; }
          .cv-textarea {
            background:transparent; color:#a9b1d6;
            font-family:'JetBrains Mono','Fira Code','Cascadia Code','Consolas',monospace;
            font-size:13px; line-height:1.6; border:none; outline:none;
            resize:none; width:100%; min-height:100%; padding:16px;
            white-space:pre; overflow-x:auto; tab-size:4;
          }
          .cv-approach-tab { transition:all 0.15s; white-space:nowrap; }
          .cv-approach-tab .cv-del { opacity:0; transition:opacity 0.12s; }
          .cv-approach-tab:hover .cv-del { opacity:1; }
        `}</style>

        <motion.div
          drag={!maximized} dragConstraints={constraintsRef}
          dragElastic={0.08} dragMomentum dragTransition={{ bounceStiffness:300, bounceDamping:20 }}
          onDragStart={handleDragStart} onDrag={handleDrag} onDragEnd={handleDragEnd}
          initial={{ scale:0.88, opacity:0, y:40 }}
          animate={{ scale:1, opacity:1, y:0 }}
          exit={{ scale:0.88, opacity:0, y:40 }}
          transition={{ type:'spring', damping:22, stiffness:260 }}
          className={`cv-window overflow-hidden ${maximized ? 'maximized' : 'rounded-xl'}`}
          style={{
            x, y, scale, rotateX, rotateY,
            width: maximized ? '100vw' : '90%',
            maxWidth: maximized ? '100vw' : '70rem',
            maxHeight: maximized ? '100vh' : '90vh',
            boxShadow: isDragging
              ? '0 40px 80px rgba(0,0,0,0.5),0 0 0 1px rgba(139,92,246,0.15)'
              : '0 20px 60px rgba(0,0,0,0.4),0 0 0 1px rgba(255,255,255,0.06)',
            transformStyle:'preserve-3d', willChange:'transform',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="h-full flex flex-col" style={{ background:'#1a1b26' }}>

            {/* ── Title Bar ── */}
            <div
              className="cv-titlebar flex items-center justify-between px-4 py-3 border-b"
              style={{ background:'linear-gradient(180deg,#2a2b3d 0%,#1e1f31 100%)', borderColor:'rgba(255,255,255,0.06)' }}
              onDoubleClick={handleMaximize}
            >
              <div className="cv-traffic flex items-center gap-2" onMouseDown={e => e.stopPropagation()}>
                <button onClick={handleCloseAttempt} className="w-3.5 h-3.5 rounded-full bg-[#FF5F57] hover:brightness-90 transition-all flex items-center justify-center relative" title="Close">
                  <svg className="cv-dot-icon w-[8px] h-[8px] absolute" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="#4D0000" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </button>
                <button onClick={handleMinimize} className="w-3.5 h-3.5 rounded-full bg-[#FEBC2E] hover:brightness-90 transition-all flex items-center justify-center relative" title={minimized?'Expand':'Minimize'}>
                  <svg className="cv-dot-icon w-[8px] h-[8px] absolute" viewBox="0 0 12 12" fill="none"><path d="M2.5 6H9.5" stroke="#995700" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </button>
                <button onClick={handleMaximize} className="w-3.5 h-3.5 rounded-full bg-[#28C840] hover:brightness-90 transition-all flex items-center justify-center relative" title={maximized?'Restore':'Maximize'}>
                  <svg className="cv-dot-icon w-[7px] h-[7px] absolute" viewBox="0 0 12 12" fill="none">
                    {maximized
                      ? <><path d="M3.5 8.5L8.5 3.5" stroke="#006500" strokeWidth="1.4" strokeLinecap="round"/><path d="M4 3.5H8.5V8" stroke="#006500" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 8.5H3.5V4" stroke="#006500" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></>
                      : <path d="M2 10L10 2M10 2H4.5M10 2V7.5" stroke="#006500" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>}
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-400 font-medium flex-1 justify-center min-w-0 px-4 select-none">
                <span className="truncate max-w-xs">{problem.title}</span>
                <span className="text-gray-600">—</span>
                <span className="text-xs font-semibold capitalize" style={{ color: DIFFICULTY_COLORS[problem.difficulty] }}>{problem.difficulty}</span>
                {isSaving ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse ml-1">SAVING...</span>
                ) : isDirty ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 ml-1">UNSAVED</span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ml-1">SAVED</span>
                )}
              </div>

              <div className="flex items-center gap-1" onMouseDown={e => e.stopPropagation()}>
                {problem.link && (
                  <a href={problem.link} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-500 hover:text-[#8B5CF6] rounded-md hover:bg-white/5 transition-all" title="Open problem">
                    <ExternalLink className="w-3.5 h-3.5"/>
                  </a>
                )}
                <button onClick={handleCopy} className={`p-1.5 rounded-md transition-all ${copied?'text-[#28C840] bg-[#28C840]/10':'text-gray-500 hover:text-white hover:bg-white/5'}`} title="Copy code">
                  {copied ? <Check className="w-3.5 h-3.5"/> : <Copy className="w-3.5 h-3.5"/>}
                </button>
              </div>
            </div>

            {/* ── Collapsible body ── */}
            <motion.div
              animate={{ height: minimized ? 0 : 'auto', opacity: minimized ? 0 : 1 }}
              transition={{ type:'spring', damping:25, stiffness:300 }}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >

              {/* ══ ROW 1: Approach Tabs ══════════════════════════════════════ */}
              <div
                className="flex items-center gap-1 px-3 pt-2 pb-0 border-b overflow-x-auto"
                style={{ borderColor:'rgba(255,255,255,0.06)', background:'rgba(0,0,0,0.25)', minHeight:38 }}
              >
                {approaches.map(label => (
                  <div
                    key={label}
                    className={`cv-approach-tab relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-t-lg text-xs font-semibold cursor-pointer select-none ${
                      label === activeLabel ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                    style={{
                      background: label === activeLabel ? '#1a1b26' : 'transparent',
                      borderTop: label === activeLabel ? '2px solid #39FF14' : '2px solid transparent',
                      marginBottom: label === activeLabel ? '-1px' : 0,
                    }}
                    onClick={() => switchApproach(label)}
                  >
                    <span className="truncate max-w-[140px]">{label}</span>
                    {approaches.length > 1 && onSave && (
                      <button
                        className="cv-del ml-1 text-gray-600 hover:text-red-400 transition-colors"
                        onClick={e => { e.stopPropagation(); deleteApproach(label); }}
                        title="Delete approach"
                      >
                        <X className="w-3 h-3"/>
                      </button>
                    )}
                  </div>
                ))}

                {/* Add approach inline input */}
                {onSave && !addingApproach && (
                  <button
                    onClick={() => { setAddingApproach(true); setTimeout(() => newApproachRef.current?.focus(), 50); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:text-[#39FF14] hover:bg-[#39FF14]/8 transition-all ml-1 flex-shrink-0"
                    title="Add new approach"
                  >
                    <Plus className="w-3.5 h-3.5"/><span>Approach</span>
                  </button>
                )}
                {onSave && addingApproach && (
                  <div className="flex items-center gap-1 ml-1 flex-shrink-0">
                    <input
                      ref={newApproachRef}
                      value={newApproachInput}
                      onChange={e => setNewApproachInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') confirmAddApproach();
                        if (e.key === 'Escape') { setAddingApproach(false); setNewApproachInput(''); }
                      }}
                      placeholder={`Approach ${approaches.length + 1}`}
                      className="px-2 py-1 rounded-lg text-xs text-white outline-none w-28"
                      style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(57,255,20,0.3)' }}
                    />
                    <button onClick={confirmAddApproach} className="text-[#39FF14] hover:brightness-125 transition-all" title="Confirm">
                      <Check className="w-3.5 h-3.5"/>
                    </button>
                    <button onClick={() => { setAddingApproach(false); setNewApproachInput(''); }} className="text-gray-500 hover:text-white transition-all">
                      <X className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                )}
              </div>

              {/* ══ ROW 2: Language Selector Dropdown ════════════════════════ */}
              <div
                className="flex items-center justify-between px-3 py-2 border-b"
                style={{ borderColor:'rgba(255,255,255,0.04)', background:'rgba(255,255,255,0.015)', minHeight:42 }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: langInfo.color }} />
                  
                  {/* Language Dropdown */}
                  <div className="relative flex items-center">
                    <select
                      value={activeLang}
                      onChange={e => switchLang(e.target.value)}
                      className="appearance-none bg-transparent pl-3 pr-7 py-1 rounded-lg text-xs font-bold outline-none cursor-pointer border transition-all"
                      style={{
                        background: `${langInfo.color}15`,
                        color: langInfo.color,
                        borderColor: `${langInfo.color}40`,
                      }}
                    >
                      {LANG_OPTIONS.map(opt => {
                        const hasCode = !!codeMap[activeLabel]?.[opt.value]?.trim();
                        return (
                          <option key={opt.value} value={opt.value} className="bg-gray-900 text-white font-medium">
                            {opt.label} {hasCode ? ' ✓' : ''}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2 pointer-events-none" style={{ color: langInfo.color }} />
                  </div>

                  {/* Badges of existing saved non-empty languages for this approach */}
                  <div className="flex items-center gap-1.5 ml-2">
                    {langsForApproach.map(l => {
                      const codeVal = codeMap[activeLabel]?.[l];
                      if (l === activeLang || !codeVal || codeVal.trim().length === 0) return null;
                      const info = LANG_MAP[l] || LANG_MAP.other;
                      return (
                        <button
                          key={l}
                          onClick={() => switchLang(l)}
                          className="px-2.5 py-0.5 rounded text-[11px] font-semibold text-gray-300 hover:text-white transition-all border border-gray-700/60 hover:border-gray-500 bg-white/5 flex items-center gap-1"
                          title={`Switch to saved ${info.label} code`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: info.color }} />
                          {info.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right metadata */}
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  {problem.timeSpent > 0 && <span className="flex items-center gap-1 text-gray-400"><Clock className="w-3 h-3"/>{problem.timeSpent}m</span>}
                  {problem.runtime && <span className="flex items-center gap-1 text-emerald-400"><Zap className="w-3 h-3"/>{problem.runtime}</span>}
                  {problem.memory && <span className="flex items-center gap-1 text-cyan-400"><HardDrive className="w-3 h-3"/>{problem.memory}</span>}
                  {problem.attempts > 1 && <span className="flex items-center gap-1 text-amber-400"><RotateCcw className="w-3 h-3"/>{problem.attempts}×</span>}
                  <span>{actualLineCount} lines</span>
                </div>
              </div>

              {/* ══ Code Area ════════════════════════════════════════════════ */}
              <div
                className="flex-1 overflow-auto min-h-0"
                style={{ background:'#1a1b26', minHeight: '380px', maxHeight: maximized ? 'calc(100vh - 220px)' : '55vh' }}
              >
                <div className="flex min-h-full">
                  {/* Line numbers */}
                  <div
                    className="sticky left-0 select-none text-right py-4 px-3 flex-shrink-0"
                    style={{
                      background:'#1a1b26',
                      borderRight:'1px solid rgba(255,255,255,0.04)',
                      fontFamily:"'JetBrains Mono','Fira Code','Consolas',monospace",
                      fontSize:'13px', lineHeight:'1.6', color:'#3b3d52',
                      minWidth: displayLinesCount >= 100 ? '52px' : '40px', zIndex:10,
                    }}
                  >
                    {Array.from({ length: displayLinesCount }).map((_, i) => <div key={i}>{i + 1}</div>)}
                  </div>

                  <div className="flex-1 flex">
                    <textarea
                      ref={textareaRef}
                      value={currentCode}
                      onChange={e => updateCode(e.target.value)}
                      onKeyDown={handleKeyDown}
                      spellCheck={false}
                      className="cv-textarea"
                      placeholder={`Paste or type your ${langInfo.label} code for ${activeLabel}...`}
                    />
                  </div>
                </div>
              </div>

              {/* ══ Footer ═══════════════════════════════════════════════════ */}
              <div
                className="flex items-center justify-between px-4 py-3 border-t"
                style={{ background:'rgba(255,255,255,0.02)', borderColor:'rgba(255,255,255,0.06)' }}
              >
                <div className="flex-1 min-w-0 pr-4">
                  {problem.notes && (
                    <>
                      <span className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">Notes: </span>
                      <span className="text-xs text-gray-400 truncate">{problem.notes}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {problem.source === 'track-ex' && problem.leetcodeSlug && (
                    <a href={`https://leetcode.com/problems/${problem.leetcodeSlug}/`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-600 hover:text-[#8B5CF6] transition-colors">
                      View on LeetCode →
                    </a>
                  )}
                  <span className="text-[10px] text-gray-600">
                    {new Date(problem.solvedAt || problem.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                  </span>
                  {onSave && (
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-5 py-1.5 bg-neon-green text-black font-semibold rounded-lg hover:bg-neon-green/90 transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
                    >
                      <Save className="w-3.5 h-3.5"/>
                      {isSaving ? 'Saving…' : 'Save'}
                    </button>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Funny Unsaved Changes Popup Tile ── */}
      {showUnsavedModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
          onClick={e => e.stopPropagation()}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="w-full max-w-md rounded-2xl p-6 border shadow-2xl space-y-4 text-center"
            style={{ background: '#1e1f31', borderColor: 'rgba(255,255,255,0.12)' }}
          >
            <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-3xl shadow-lg shadow-amber-500/10">
              🚨
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white tracking-wide">Whoops! Forgot to save?</h3>
              <p className="text-xs text-gray-300 leading-relaxed px-2">
                Looks like you wrote some awesome code and almost threw it into the digital abyss! 🌌 Save it before it runs away?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                onClick={async () => {
                  setShowUnsavedModal(false);
                  await handleSave();
                  onClose();
                }}
                disabled={isSaving}
                className="flex-1 py-2.5 px-4 bg-neon-green hover:bg-neon-green/90 text-black font-bold rounded-xl text-xs transition-all shadow-lg shadow-neon-green/20 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Alright, Save!'}
              </button>
              <button
                onClick={() => {
                  setShowUnsavedModal(false);
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-semibold rounded-xl text-xs transition-all border border-white/10"
              >
                Ignore
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CodeViewer;
