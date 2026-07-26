import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useDragControls } from 'framer-motion';
import {
  Copy, Check, ExternalLink, Clock, Zap, HardDrive, RotateCcw,
  Save, X, Plus, ChevronDown, Palette, AlignLeft,
  Play, Terminal, ChevronUp, CheckCircle2, AlertCircle, AlertTriangle, Loader2, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useProblemStore from '../store/problemStore';
import sheetProblemService from '../services/sheetProblemService';
import compilerService from '../services/compilerService';

import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import { autocompletion } from '@codemirror/autocomplete';
import { linter } from '@codemirror/lint';

import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { githubDark } from '@uiw/codemirror-theme-github';
import { nord } from '@uiw/codemirror-theme-nord';
import jsBeautify from 'js-beautify';

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

const THEME_OPTIONS = [
  { value: 'tokyoNight', label: 'Tokyo Night', theme: tokyoNight },
  { value: 'dracula',    label: 'Dracula',     theme: dracula },
  { value: 'githubDark', label: 'GitHub Dark', theme: githubDark },
  { value: 'nord',       label: 'Nord',        theme: nord },
];
const THEME_MAP = Object.fromEntries(THEME_OPTIONS.map(t => [t.value, t]));

const COMMON_KEYWORDS = {
  cpp: ['vector', 'string', 'push_back', 'pop_back', 'unordered_map', 'unordered_set', 'priority_queue', 'pair', 'make_pair', 'min', 'max', 'swap', 'sort', 'reverse', 'lower_bound', 'upper_bound', 'cout', 'cin', 'endl', 'nullptr', 'size', 'length', 'empty', 'clear', 'insert', 'erase', 'find', 'begin', 'end', 'INT_MAX', 'INT_MIN', 'return', 'include', 'class', 'public', 'private', 'protected', 'struct', 'typedef', 'template', 'typename', 'auto', 'const', 'static', 'sizeof'],
  java: ['String', 'System.out.println', 'StringBuilder', 'ArrayList', 'HashMap', 'HashSet', 'LinkedList', 'PriorityQueue', 'Collections.sort', 'Math.max', 'Math.min', 'Math.abs', 'public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'static', 'final', 'void', 'return', 'import', 'new', 'override', 'this', 'super'],
  python: ['print', 'def', 'class', 'return', 'self', 'import', 'from', 'as', 'range', 'len', 'append', 'extend', 'pop', 'split', 'join', 'sorted', 'sort', 'reverse', 'enumerate', 'zip', 'dict', 'list', 'set', 'tuple', 'lambda', 'map', 'filter', 'sum', 'min', 'max', 'abs'],
  javascript: ['console.log', 'const', 'let', 'var', 'function', 'return', 'async', 'await', 'import', 'export', 'default', 'class', 'constructor', 'prototype', 'map', 'filter', 'reduce', 'forEach', 'includes', 'indexOf', 'slice', 'splice', 'push', 'pop', 'shift', 'unshift', 'concat', 'Object.keys', 'Object.values', 'Math.max', 'Math.min'],
  c: ['printf', 'scanf', 'malloc', 'free', 'sizeof', 'strlen', 'strcpy', 'strcat', 'strcmp', 'memcpy', 'memset', 'struct', 'typedef', 'return', 'include', 'NULL', 'int', 'char', 'void', 'float', 'double'],
  go: ['fmt.Println', 'fmt.Printf', 'make', 'append', 'len', 'cap', 'delete', 'package', 'import', 'func', 'type', 'struct', 'interface', 'return', 'range', 'map', 'slice', 'string', 'int'],
  rust: ['println!', 'format!', 'vec!', 'String', 'Option', 'Result', 'Some', 'None', 'Ok', 'Err', 'pub', 'fn', 'let', 'mut', 'struct', 'enum', 'match', 'impl', 'use', 'mod', 'self', 'Self', 'return'],
  other: ['return', 'function', 'class', 'struct', 'import', 'export', 'print', 'console'],
};

// ── Real-time Syntax Linter ──
function codeSyntaxLinter(view) {
  const diagnostics = [];
  const doc = view.state.doc.toString();
  const lines = doc.split('\n');

  const stack = [];
  const openPairs = { '{': '}', '(': ')', '[': ']' };
  const closePairs = { '}': '{', ')': '(', ']': '[' };

  for (let pos = 0; pos < doc.length; pos++) {
    const ch = doc[pos];
    if (openPairs[ch]) {
      stack.push({ ch, pos });
    } else if (closePairs[ch]) {
      if (stack.length === 0 || stack[stack.length - 1].ch !== closePairs[ch]) {
        diagnostics.push({
          from: pos,
          to: pos + 1,
          severity: 'error',
          message: `Unmatched '${ch}'`,
        });
      } else {
        stack.pop();
      }
    }
  }

  for (const unclosed of stack) {
    diagnostics.push({
      from: unclosed.pos,
      to: unclosed.pos + 1,
      severity: 'error',
      message: `Unclosed '${unclosed.ch}'`,
    });
  }

  let posCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const doubleQuotes = (line.match(/(?<!\\)"/g) || []).length;
    const singleQuotes = (line.match(/(?<!\\)'/g) || []).length;

    if (doubleQuotes % 2 !== 0) {
      const lastQuotePos = posCount + line.lastIndexOf('"');
      diagnostics.push({
        from: Math.max(posCount, lastQuotePos),
        to: Math.min(posCount + line.length, lastQuotePos + 1),
        severity: 'warning',
        message: 'Unterminated string literal',
      });
    }

    if (singleQuotes % 2 !== 0) {
      const lastQuotePos = posCount + line.lastIndexOf("'");
      diagnostics.push({
        from: Math.max(posCount, lastQuotePos),
        to: Math.min(posCount + line.length, lastQuotePos + 1),
        severity: 'warning',
        message: 'Unterminated character literal',
      });
    }

    posCount += line.length + 1;
  }

  return diagnostics;
}

// ── Code Formatter ──
function formatCode(code, lang) {
  if (!code || !code.trim()) return code;
  try {
    if (lang === 'javascript' || lang === 'python') {
      return jsBeautify.js(code, { indent_size: 4, space_in_empty_paren: false });
    }
    const lines = code.split('\n');
    let indentLevel = 0;
    const formattedLines = [];

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        formattedLines.push('');
        continue;
      }

      if (trimmed.startsWith('}') || trimmed.startsWith(')') || trimmed.startsWith(']')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      formattedLines.push('    '.repeat(indentLevel) + trimmed);

      const openCount = (trimmed.match(/[{(\[]/g) || []).length;
      const closeCount = (trimmed.match(/[})\]]/g) || []).length;
      indentLevel = Math.max(0, indentLevel + openCount - closeCount);
    }

    return formattedLines.join('\n');
  } catch {
    return code;
  }
}

function createDocumentCompletions(activeLang) {
  return function getDocumentCompletions(context) {
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const docText = context.state.doc.toString();
    const docWords = docText.match(/\b[a-zA-Z_]\w*\b/g) || [];
    const langExtra = COMMON_KEYWORDS[activeLang] || COMMON_KEYWORDS.other;

    const allWords = Array.from(new Set([...langExtra, ...docWords]));
    const prefixLower = word.text.toLowerCase();

    const options = allWords
      .filter(w => w.toLowerCase() !== prefixLower && w.toLowerCase().startsWith(prefixLower))
      .map(w => ({ label: w, type: 'variable' }));

    if (options.length === 0) return null;

    return {
      from: word.from,
      options,
      validFor: /^\w*$/,
    };
  };
}

function getLanguageExtension(lang) {
  switch (lang) {
    case 'cpp':
    case 'c':
    case 'go':
    case 'rust':
      return cpp();
    case 'java':
      return java();
    case 'python':
      return python();
    case 'javascript':
      return javascript({ jsx: true, typescript: true });
    default:
      return cpp();
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
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

function flattenCodeMap(codeMap) {
  const out = [];
  for (const [label, langs] of Object.entries(codeMap)) {
    for (const [language, code] of Object.entries(langs)) {
      out.push({ label, language, code });
    }
  }
  return out;
}

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

  const dragControls = useDragControls();

  // ── Window & Theme state
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTheme, setActiveTheme] = useState('tokyoNight');

  // ── Code map: { label → { lang → code } }
  const [codeMap, setCodeMap] = useState({});
  const [activeLabel, setActiveLabel] = useState('');
  const [activeLang, setActiveLang] = useState('cpp');

  // ── Approach adder state
  const [addingApproach, setAddingApproach] = useState(false);
  const [newApproachInput, setNewApproachInput] = useState('');

  // ── Save state
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // ── Execution Drawer State
  const [showConsole, setShowConsole] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState('input'); // 'input' | 'output'
  const [stdinInput, setStdinInput] = useState('');
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  const constraintsRef = useRef(null);
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
    setShowConsole(false);
    setExecutionResult(null);
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
  const currentTheme = THEME_MAP[activeTheme]?.theme || tokyoNight;

  // ── Code editing & formatting
  const updateCode = useCallback((newCode) => {
    setCodeMap(prev => ({
      ...prev,
      [activeLabel]: { ...(prev[activeLabel] || {}), [activeLang]: newCode },
    }));
    setIsDirty(true);
  }, [activeLabel, activeLang]);

  const handleFormatCode = useCallback(() => {
    if (!currentCode || !currentCode.trim()) return;
    const formatted = formatCode(currentCode, activeLang);
    if (formatted !== currentCode) {
      updateCode(formatted);
      toast.success('Code Formatted!');
    }
  }, [currentCode, activeLang, updateCode]);

  // ── Code Execution via Azure Judge0 Compiler Engine
  const handleRunCode = async () => {
    if (!currentCode || !currentCode.trim()) {
      toast.error('Code cannot be empty!');
      return;
    }
    setIsRunningCode(true);
    setShowConsole(true);
    setActiveConsoleTab('output');
    try {
      const res = await compilerService.runCode({
        source_code: currentCode,
        language: activeLang,
        stdin: stdinInput,
      });
      setExecutionResult(res);
      if (res.status?.id === 3) {
        toast.success(`Executed in ${res.timeMs}ms!`);
      } else {
        toast.error(res.status?.description || 'Execution finished with warnings');
      }
    } catch (err) {
      console.error('Run code error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Execution failed');
      setExecutionResult({
        status: { id: 13, description: 'Error' },
        stderr: err?.response?.data?.message || err?.message || 'Failed to connect to Azure Compiler Engine',
      });
    } finally {
      setIsRunningCode(false);
    }
  };

  // Global keydown listener for Alt + Shift + F (Format Code)
  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalKeyDown = (e) => {
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleFormatCode();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, handleFormatCode]);

  const switchApproach = (label) => {
    setActiveLabel(label);
    const langs = Object.keys(codeMap[label] || {});
    setActiveLang(langs[0] || 'cpp');
  };

  const switchLang = (newLang) => {
    setActiveLang(newLang);
  };

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
          .cv-approach-tab { transition:all 0.15s; white-space:nowrap; }
          .cv-approach-tab .cv-del { opacity:0; transition:opacity 0.12s; }
          .cv-approach-tab:hover .cv-del { opacity:1; }

          .cm-editor { background: #1a1b26 !important; height: 100% !important; min-height: 350px !important; }
          .cm-gutters { background: #1a1b26 !important; border-right: 1px solid rgba(255,255,255,0.05) !important; color: #3b3d52 !important; }
          .cm-activeLineGutter { background: rgba(255,255,255,0.03) !important; }
          .cm-content { padding: 12px 0 !important; }
          .cm-line { font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace !important; }

          /* CodeMirror Autocomplete Dropdown Theme */
          .cm-tooltip-autocomplete { background: #1e1f31 !important; border: 1px solid rgba(255,255,255,0.12) !important; border-radius: 8px !important; box-shadow: 0 15px 35px rgba(0,0,0,0.6) !important; }
          .cm-tooltip-autocomplete > ul { font-family: 'JetBrains Mono', monospace !important; font-size: 12px !important; }
          .cm-tooltip-autocomplete > ul > li { color: #a9b1d6 !important; padding: 4px 10px !important; }
          .cm-tooltip-autocomplete > ul > li[aria-selected] { background: rgba(57,255,20,0.15) !important; color: #39FF14 !important; border-radius: 4px !important; font-weight: 600; }
        `}</style>

        <motion.div
          drag={!maximized}
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={constraintsRef}
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

            {/* ── Title Bar (Only this area triggers dragging) ── */}
            <div
              className="cv-titlebar flex items-center justify-between px-4 py-3 border-b"
              style={{ background:'linear-gradient(180deg,#2a2b3d 0%,#1e1f31 100%)', borderColor:'rgba(255,255,255,0.06)' }}
              onPointerDown={e => {
                if (!maximized) dragControls.start(e);
              }}
              onDoubleClick={handleMaximize}
            >
              <div className="cv-traffic flex items-center gap-2" onMouseDown={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
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

              <div className="flex items-center gap-1" onMouseDown={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
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

              {/* ══ ROW 2: Language Selector, Theme Picker, & Format Code ════════ */}
              <div
                className="flex items-center justify-between px-3 py-2 border-b flex-wrap gap-2"
                style={{ borderColor:'rgba(255,255,255,0.04)', background:'rgba(255,255,255,0.015)', minHeight:42 }}
              >
                <div className="flex items-center gap-2 flex-wrap">
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

                  {/* Theme Dropdown */}
                  <div className="relative flex items-center">
                    <select
                      value={activeTheme}
                      onChange={e => setActiveTheme(e.target.value)}
                      className="appearance-none bg-white/5 hover:bg-white/10 text-gray-300 pl-7 pr-7 py-1 rounded-lg text-xs font-semibold outline-none cursor-pointer border border-white/10 transition-all"
                    >
                      {THEME_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value} className="bg-gray-900 text-white font-medium">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <Palette className="w-3 h-3 absolute left-2 text-purple-400 pointer-events-none" />
                    <ChevronDown className="w-3 h-3 absolute right-2 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Format Code Button */}
                  <button
                    onClick={handleFormatCode}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white rounded-lg text-xs font-semibold border border-white/10 transition-all shadow-sm group"
                    title="Format Code [Alt + Shift + F]"
                  >
                    <AlignLeft className="w-3.5 h-3.5 text-[#39FF14] group-hover:scale-110 transition-transform" />
                    <span>Format</span>
                    <span className="text-[9px] text-gray-400 bg-black/40 px-1.5 py-0.5 rounded font-mono ml-0.5">Alt+Shift+F</span>
                  </button>

                  {/* Badges of existing saved non-empty languages for this approach */}
                  <div className="flex items-center gap-1.5 ml-1">
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

              {/* ══ CodeMirror 6 Editor Engine with Real-time Linter & Themes ══ */}
              <div
                className="flex-1 overflow-auto min-h-0 relative flex flex-col"
                style={{ background:'#1a1b26', minHeight: '350px', maxHeight: maximized ? 'calc(100vh - 260px)' : '50vh' }}
              >
                <CodeMirror
                  value={currentCode}
                  height="100%"
                  theme={currentTheme}
                  extensions={[
                    getLanguageExtension(activeLang),
                    EditorView.lineWrapping,
                    autocompletion({
                      override: [createDocumentCompletions(activeLang)],
                      activateOnTyping: true,
                    }),
                    linter(codeSyntaxLinter, { delay: 300 }),
                  ]}
                  onChange={value => updateCode(value)}
                  placeholder={`Paste or type your ${langInfo.label} code for ${activeLabel}...`}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    highlightSpecialChars: true,
                    history: true,
                    foldGutter: true,
                    drawSelection: true,
                    dropCursor: true,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    syntaxHighlighting: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    rectangularSelection: true,
                    crosshairCursor: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                    closeBracketsKeymap: true,
                    defaultKeymap: true,
                    searchKeymap: true,
                    historyKeymap: true,
                    foldKeymap: true,
                    completionKeymap: true,
                    lintKeymap: true,
                  }}
                />

                {/* ══ Slide-up Execution Console Drawer ══ */}
                <AnimatePresence>
                  {showConsole && (
                    <motion.div
                      initial={{ y: 240, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 240, opacity: 0 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      className="absolute bottom-0 left-0 right-0 z-40 border-t flex flex-col shadow-2xl"
                      style={{ background: '#12131c', borderColor: 'rgba(255,255,255,0.1)', height: 220 }}
                    >
                      {/* Drawer Header */}
                      <div className="flex items-center justify-between px-4 py-2 border-b bg-black/40 border-white/5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveConsoleTab('input')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                              activeConsoleTab === 'input' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200'
                            }`}
                          >
                            <Terminal className="w-3.5 h-3.5 text-cyan-400"/>
                            <span>Custom Input (stdin)</span>
                          </button>
                          <button
                            onClick={() => setActiveConsoleTab('output')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                              activeConsoleTab === 'output' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#39FF14]"/>
                            <span>Execution Result</span>
                            {executionResult && (
                              <span className={`w-2 h-2 rounded-full ${executionResult.status?.id === 3 ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            )}
                          </button>
                        </div>

                        <button
                          onClick={() => setShowConsole(false)}
                          className="p-1 text-gray-500 hover:text-white rounded-md hover:bg-white/5 transition-all"
                          title="Hide Console"
                        >
                          <ChevronDown className="w-4 h-4"/>
                        </button>
                      </div>

                      {/* Drawer Content */}
                      <div className="flex-1 p-3 overflow-auto font-mono text-xs">
                        {activeConsoleTab === 'input' ? (
                          <div className="h-full flex flex-col space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Standard Input (stdin)</span>
                            <textarea
                              value={stdinInput}
                              onChange={e => setStdinInput(e.target.value)}
                              placeholder="Enter custom input values here (e.g. 5 10)..."
                              className="flex-1 w-full p-2.5 rounded-lg bg-black/30 border border-white/5 text-gray-200 font-mono outline-none resize-none focus:border-cyan-500/40 transition-colors"
                            />
                          </div>
                        ) : (
                          <div className="h-full flex flex-col space-y-2">
                            {isRunningCode ? (
                              <div className="flex-1 flex items-center justify-center flex-col gap-2 text-gray-400">
                                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                                <span className="text-xs font-semibold text-cyan-300">Executing on Azure Judge0 Engine...</span>
                              </div>
                            ) : executionResult ? (
                              <div className="space-y-2">
                                {/* Status Header */}
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                  <div className="flex items-center gap-2">
                                    {executionResult.status?.id === 3 ? (
                                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4"/>
                                        {executionResult.status?.description || 'Accepted'}
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1.5">
                                        <AlertCircle className="w-4 h-4"/>
                                        {executionResult.status?.description || 'Error'}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                                    <span>Runtime: <strong className="text-emerald-400">{executionResult.timeMs || 0} ms</strong></span>
                                    <span>Memory: <strong className="text-cyan-400">{executionResult.memoryMb || 0} MB</strong></span>
                                  </div>
                                </div>

                                {/* Stdout / Output */}
                                {executionResult.stdout && (
                                  <div>
                                    <div className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Standard Output (stdout)</div>
                                    <pre className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-emerald-300 whitespace-pre-wrap overflow-x-auto max-h-28">
                                      {executionResult.stdout}
                                    </pre>
                                  </div>
                                )}

                                {/* Compile / Stderr error */}
                                {(executionResult.compile_output || executionResult.stderr) && (
                                  <div>
                                    <div className="text-[10px] text-red-400 uppercase font-semibold mb-1 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3"/> Error Output
                                    </div>
                                    <pre className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/20 text-red-300 whitespace-pre-wrap overflow-x-auto max-h-28">
                                      {executionResult.compile_output || executionResult.stderr}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex-1 flex items-center justify-center text-gray-500 text-xs">
                                Click "Run Code" below to compile and execute your solution!
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ══ Footer ═══════════════════════════════════════════════════ */}
              <div
                className="flex items-center justify-between px-4 py-3 border-t"
                style={{ background:'rgba(255,255,255,0.02)', borderColor:'rgba(255,255,255,0.06)' }}
              >
                {/* Left: Run Code & Toggle Console */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunCode}
                    disabled={isRunningCode}
                    className="px-4 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 font-bold rounded-lg border border-cyan-500/30 transition-all flex items-center gap-2 text-xs shadow-lg shadow-cyan-500/10 disabled:opacity-50"
                  >
                    {isRunningCode ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300"/>
                    ) : (
                      <Play className="w-3.5 h-3.5 text-cyan-300 fill-cyan-300"/>
                    )}
                    <span>{isRunningCode ? 'Running...' : 'Run Code'}</span>
                  </button>

                  <button
                    onClick={() => setShowConsole(p => !p)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-semibold border border-white/10 transition-all flex items-center gap-1.5"
                  >
                    <Terminal className="w-3.5 h-3.5 text-gray-400"/>
                    <span>Console</span>
                    {showConsole ? <ChevronDown className="w-3 h-3"/> : <ChevronUp className="w-3 h-3"/>}
                  </button>
                </div>

                {/* Right: Metadata & Save */}
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
