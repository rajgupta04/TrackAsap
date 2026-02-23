import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, ExternalLink, Clock, Tag, ChevronDown } from 'lucide-react';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import GlassCard from './ui/GlassCard';

const LANGUAGE_MAP = {
  cpp: 'cpp',
  java: 'java',
  python: 'python',
  javascript: 'javascript',
  c: 'c',
  go: 'go',
  rust: 'rust',
  other: 'plaintext',
};

const DIFFICULTY_COLORS = {
  easy: '#00B8A3',
  medium: '#FFC01E',
  hard: '#FF375F',
  unknown: '#888888',
};

const CodeViewer = ({ isOpen, onClose, problem }) => {
  const [copied, setCopied] = useState(false);
  const editorRef = useRef(null);

  const handleCopy = async () => {
    if (problem?.code) {
      try {
        await navigator.clipboard.writeText(problem.code);
        setCopied(true);
        toast.success('Code copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.error('Failed to copy code');
      }
    }
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  if (!isOpen || !problem) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-5xl h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassCard className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-white truncate">
                      {problem.title}
                    </h2>
                    <span
                      className="px-2 py-0.5 text-xs font-medium rounded-full capitalize"
                      style={{
                        backgroundColor: `${DIFFICULTY_COLORS[problem.difficulty]}20`,
                        color: DIFFICULTY_COLORS[problem.difficulty],
                      }}
                    >
                      {problem.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="capitalize">{problem.platform}</span>
                    <span>•</span>
                    <span className="uppercase">{problem.language}</span>
                    {problem.timeSpent > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {problem.timeSpent} mins
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={problem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-neon-green hover:bg-white/10 rounded-lg transition-all"
                    title="Open problem link"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                  <button
                    onClick={handleCopy}
                    className={`p-2 rounded-lg transition-all ${
                      copied
                        ? 'text-neon-green bg-neon-green/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                    title="Copy code"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              {problem.tags && problem.tags.length > 0 && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Tag className="w-3.5 h-3.5 text-gray-500" />
                  {problem.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 text-xs bg-white/5 text-gray-300 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Code Editor */}
            <div className="flex-1 min-h-0">
              {problem.code ? (
                <Editor
                  height="100%"
                  language={LANGUAGE_MAP[problem.language] || 'plaintext'}
                  value={problem.code}
                  theme="vs-dark"
                  onMount={handleEditorDidMount}
                  options={{
                    readOnly: true,
                    minimap: { enabled: true },
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    padding: { top: 16, bottom: 16 },
                    automaticLayout: true,
                    scrollbar: {
                      verticalScrollbarSize: 8,
                      horizontalScrollbarSize: 8,
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No code saved for this problem
                </div>
              )}
            </div>

            {/* Notes Section */}
            {problem.notes && (
              <div className="p-4 border-t border-white/10 max-h-32 overflow-auto">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Notes</h3>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{problem.notes}</p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CodeViewer;
