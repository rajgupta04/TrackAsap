import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Copy, Check, ExternalLink, Clock, Tag, Zap, HardDrive, RotateCcw, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

const DIFFICULTY_COLORS = {
  easy: '#00B8A3',
  medium: '#FFC01E',
  hard: '#FF375F',
  unknown: '#888888',
};

const LANG_OPTIONS = [
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'c', label: 'C' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

const LANG_LABELS = LANG_OPTIONS.reduce((acc, curr) => ({ ...acc, [curr.value]: curr.label }), { other: 'Code' });

const CodeViewer = ({ isOpen, onClose, problem, onSave }) => {
  const [copied, setCopied] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState('');
  const [editedLang, setEditedLang] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const constraintsRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen && problem) {
      setEditedCode(problem.code || '');
      setEditedLang(problem.language || 'cpp');
      setIsEditing(!problem.code && !!onSave); // Auto-edit if empty and editable
    }
  }, [isOpen, problem, onSave]);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(0, { stiffness: 300, damping: 15, mass: 0.5 });
  const rotateY = useSpring(0, { stiffness: 300, damping: 15, mass: 0.5 });
  const scale = useSpring(1, { stiffness: 400, damping: 20 });

  const handleCopy = async () => {
    const textToCopy = isEditing ? editedCode : problem?.code;
    if (textToCopy) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.error('Failed to copy');
      }
    }
  };

  const handleMinimize = useCallback(() => {
    setMinimized(prev => !prev);
    if (maximized) setMaximized(false);
    scale.set(0.97);
    setTimeout(() => scale.set(1), 150);
  }, [maximized, scale]);

  const handleMaximize = useCallback(() => {
    setMaximized(prev => !prev);
    if (minimized) setMinimized(false);
    x.set(0);
    y.set(0);
    scale.set(1.02);
    setTimeout(() => scale.set(1), 200);
  }, [minimized, x, y, scale]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    scale.set(1.01);
  }, [scale]);

  const handleDrag = useCallback((event, info) => {
    const tiltX = -info.velocity.y * 0.01;
    const tiltY = info.velocity.x * 0.01;
    rotateX.set(Math.max(-3, Math.min(3, tiltX)));
    rotateY.set(Math.max(-3, Math.min(3, tiltY)));
  }, [rotateX, rotateY]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
  }, [scale, rotateX, rotateY]);

  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave(problem._id, editedCode, editedLang);
        toast.success('Code saved successfully');
        setIsEditing(false);
      } catch (err) {
        toast.error('Failed to save code');
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Allow tab spacing in textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      setEditedCode(editedCode.substring(0, start) + '    ' + editedCode.substring(end));
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  if (!isOpen || !problem) return null;

  const displayCode = isEditing ? editedCode : (problem.code || '');
  const codeLines = displayCode.split('\n');
  const lineCount = codeLines.length;
  const langLabel = LANG_LABELS[isEditing ? editedLang : problem.language] || problem.language?.toUpperCase() || 'CODE';

  return (
    <AnimatePresence>
      <motion.div
        ref={constraintsRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={onClose}
        style={{ perspective: 1200 }}
      >
        <style>{`
          .traffic-group:hover .dot-close,
          .traffic-group:hover .dot-minimize,
          .traffic-group:hover .dot-maximize {
            animation: wobble 0.5s ease-in-out;
          }
          .traffic-group:hover .dot-close { animation-delay: 0s; }
          .traffic-group:hover .dot-minimize { animation-delay: 0.05s; }
          .traffic-group:hover .dot-maximize { animation-delay: 0.1s; }
          .traffic-group:hover .dot-icon { opacity: 1; }
          .dot-icon { opacity: 0; transition: opacity 0.15s; }
          @keyframes wobble {
            0% { transform: scale(1) rotate(0deg); }
            20% { transform: scale(1.15) rotate(-8deg); }
            40% { transform: scale(1.05) rotate(6deg); }
            60% { transform: scale(1.1) rotate(-4deg); }
            80% { transform: scale(1.02) rotate(2deg); }
            100% { transform: scale(1) rotate(0deg); }
          }
          .code-window { transition: width 0.3s ease, max-height 0.3s ease; }
          .code-window.maximized {
            width: 100vw !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            height: 100vh !important;
            border-radius: 0 !important;
          }
          .titlebar-drag { cursor: grab; user-select: none; }
          .titlebar-drag:active { cursor: grabbing; }
          
          .textarea-wrapper {
             position: relative;
          }
          .textarea-code {
             background: transparent;
             color: #a9b1d6;
             font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
             font-size: 13px;
             line-height: 1.6;
             border: none;
             outline: none;
             resize: none;
             width: 100%;
             min-height: 100%;
             padding: 16px;
             white-space: pre;
             overflow-x: auto;
             tab-size: 4;
          }
        `}</style>

        <motion.div
          drag={!maximized}
          dragConstraints={constraintsRef}
          dragElastic={0.08}
          dragMomentum={true}
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
            x,
            y,
            scale,
            rotateX,
            rotateY,
            width: maximized ? '100vw' : undefined,
            maxWidth: maximized ? '100vw' : '60rem',
            maxHeight: maximized ? '100vh' : '90vh',
            boxShadow: isDragging
              ? '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.15)'
              : '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="h-full flex flex-col"
            style={{ background: '#1a1b26' }}
          >
            {/* ── Title Bar ── */}
            <div
              className="titlebar-drag flex items-center justify-between px-4 py-3 border-b"
              style={{
                background: 'linear-gradient(180deg, #2a2b3d 0%, #1e1f31 100%)',
                borderColor: 'rgba(255,255,255,0.06)',
              }}
              onDoubleClick={handleMaximize}
            >
              {/* Traffic lights */}
              <div className="traffic-group flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
                <button
                  onClick={onClose}
                  className="dot-close w-3.5 h-3.5 rounded-full bg-[#FF5F57] hover:brightness-90 transition-all flex items-center justify-center relative"
                  title="Close"
                >
                  <svg className="dot-icon w-[8px] h-[8px] absolute" viewBox="0 0 12 12" fill="none">
                    <path d="M3 3L9 9M9 3L3 9" stroke="#4D0000" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
                <button
                  onClick={handleMinimize}
                  className="dot-minimize w-3.5 h-3.5 rounded-full bg-[#FEBC2E] hover:brightness-90 transition-all flex items-center justify-center relative"
                  title={minimized ? 'Expand' : 'Minimize'}
                >
                  <svg className="dot-icon w-[8px] h-[8px] absolute" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6H9.5" stroke="#995700" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
                <button
                  onClick={handleMaximize}
                  className="dot-maximize w-3.5 h-3.5 rounded-full bg-[#28C840] hover:brightness-90 transition-all flex items-center justify-center relative"
                  title={maximized ? 'Restore' : 'Maximize'}
                >
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

              {/* Center — title */}
              <div className="flex items-center gap-2 text-sm text-gray-400 font-medium flex-1 justify-center min-w-0 px-4 select-none">
                <span className="truncate max-w-xs">{problem.title}</span>
                <span className="text-gray-600">—</span>
                <span
                  className="text-xs font-semibold capitalize"
                  style={{ color: DIFFICULTY_COLORS[problem.difficulty] }}
                >
                  {problem.difficulty}
                </span>
                {isEditing && (
                   <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-500/10 text-amber-500 ml-2">
                     Editing
                   </span>
                )}
              </div>

              {/* Right — actions */}
              <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
                {onSave && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-gray-500 hover:text-white rounded-md hover:bg-white/5 transition-all mr-1"
                    title="Edit Code"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {onSave && isEditing && (
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedCode(problem.code || '');
                      setEditedLang(problem.language || 'cpp');
                    }}
                    className="p-1.5 text-gray-500 hover:text-white rounded-md hover:bg-white/5 transition-all mr-1"
                    title="Cancel Edit"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {problem.link && (
                  <a
                    href={problem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-500 hover:text-[#8B5CF6] rounded-md hover:bg-white/5 transition-all"
                    title="Open on LeetCode"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={handleCopy}
                  className={`p-1.5 rounded-md transition-all ${
                    copied
                      ? 'text-[#28C840] bg-[#28C840]/10'
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                  title="Copy code"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* ── Collapsible body ── */}
            <motion.div
              animate={{
                height: minimized ? 0 : 'auto',
                opacity: minimized ? 0 : 1,
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              {/* Meta bar */}
              <div
                className="flex items-center gap-3 px-4 py-2 text-xs border-b flex-wrap"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.04)',
                }}
              >
                {isEditing ? (
                  <select
                    value={editedLang}
                    onChange={(e) => setEditedLang(e.target.value)}
                    className="px-2 py-0.5 rounded-md font-bold text-[#8B5CF6] outline-none"
                    style={{ background: 'rgba(139,92,246,0.1)' }}
                  >
                    {LANG_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-gray-900">{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <span className="px-2 py-0.5 rounded-md font-bold text-[#8B5CF6] tracking-wide" style={{ background: 'rgba(139,92,246,0.1)' }}>
                    {langLabel}
                  </span>
                )}
                
                <span className="text-gray-600 capitalize">{problem.platform}</span>
                {problem.timeSpent > 0 && (
                  <span className="flex items-center gap-1 text-gray-400">
                    <Clock className="w-3 h-3" /> {problem.timeSpent} min
                  </span>
                )}
                {problem.runtime && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Zap className="w-3 h-3" /> {problem.runtime}
                  </span>
                )}
                {problem.memory && (
                  <span className="flex items-center gap-1 text-cyan-400">
                    <HardDrive className="w-3 h-3" /> {problem.memory}
                  </span>
                )}
                {problem.attempts > 1 && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <RotateCcw className="w-3 h-3" /> {problem.attempts} attempts
                  </span>
                )}
                {problem.source === 'track-ex' && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-purple-500/15 text-purple-400 border border-purple-500/25 rounded tracking-wider">
                    track-Ex
                  </span>
                )}
                <span className="text-gray-600 ml-auto">{lineCount} lines</span>
              </div>

              {/* Code Area */}
              <div
                className="flex-1 overflow-auto min-h-0 relative"
                style={{
                  background: '#1a1b26',
                  maxHeight: maximized ? 'calc(100vh - 140px)' : '55vh',
                }}
              >
                {(displayCode || isEditing) ? (
                  <div className="flex min-h-full">
                    <div
                      className="sticky left-0 select-none text-right py-4 px-3 flex-shrink-0"
                      style={{
                        background: '#1a1b26',
                        borderRight: '1px solid rgba(255,255,255,0.04)',
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: '#3b3d52',
                        minWidth: lineCount >= 100 ? '52px' : '40px',
                        zIndex: 10
                      }}
                    >
                      {Math.max(1, lineCount) > 0 && Array.from({ length: Math.max(1, lineCount) }).map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>
                    
                    <div className="flex-1 textarea-wrapper flex">
                      {isEditing ? (
                        <textarea
                          ref={textareaRef}
                          value={editedCode}
                          onChange={(e) => setEditedCode(e.target.value)}
                          onKeyDown={handleKeyDown}
                          spellCheck={false}
                          className="textarea-code"
                          placeholder="Paste or type your code here..."
                        />
                      ) : (
                        <pre
                          className="py-4 px-4 flex-1 overflow-x-auto m-0 bg-transparent"
                          style={{
                            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                            fontSize: '13px',
                            lineHeight: '1.6',
                            color: '#a9b1d6',
                            tabSize: 4,
                          }}
                        >
                          <code>{problem.code}</code>
                        </pre>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-600">
                    <div className="text-center">
                      <div className="text-3xl mb-2 opacity-30">{'{ }'}</div>
                      <p className="text-sm">No code saved for this problem</p>
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

              {/* Footer */}
              <div
                className="flex items-center justify-between px-4 py-3 border-t"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.06)',
                }}
              >
                {isEditing ? (
                   <div className="w-full flex justify-end gap-3">
                     <button
                       onClick={handleSave}
                       disabled={isSaving}
                       className="px-5 py-1.5 bg-neon-green text-black font-semibold rounded-lg hover:bg-neon-green/90 transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
                     >
                       <Save className="w-3.5 h-3.5" />
                       {isSaving ? 'Saving...' : 'Save Code'}
                     </button>
                   </div>
                ) : (
                  <>
                    {problem.notes ? (
                      <div className="flex-1 min-w-0 pr-4">
                        <span className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">Notes: </span>
                        <span className="text-xs text-gray-400 truncate block sm:inline">{problem.notes}</span>
                      </div>
                    ) : (
                      <div />
                    )}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {problem.source === 'track-ex' && problem.leetcodeSlug && (
                        <a
                          href={`https://leetcode.com/problems/${problem.leetcodeSlug}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-gray-600 hover:text-[#8B5CF6] transition-colors"
                        >
                          View on LeetCode →
                        </a>
                      )}
                      <span className="text-[10px] text-gray-600">
                        {new Date(problem.solvedAt || problem.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
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
