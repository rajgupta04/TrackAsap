import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Terminal, RotateCcw, Copy, Check, Sparkles,
  ChevronUp, ChevronDown, CheckCircle2, AlertCircle, AlertTriangle,
  Loader2, Code2, Trash2, AlignLeft, Maximize2, Minimize2
} from 'lucide-react';
import toast from 'react-hot-toast';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { sql } from '@codemirror/lang-sql';
import { EditorView } from '@codemirror/view';
import { autocompletion } from '@codemirror/autocomplete';
import { linter } from '@codemirror/lint';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { githubDark } from '@uiw/codemirror-theme-github';
import { nord } from '@uiw/codemirror-theme-nord';
import jsBeautify from 'js-beautify';
import compilerService from '../services/compilerService';

const LANG_OPTIONS = [
  { value: 'cpp', label: 'C++', color: '#00599C', filename: 'main.cpp' },
  { value: 'python', label: 'Python', color: '#3B82F6', filename: 'solution.py' },
  { value: 'javascript', label: 'JavaScript', color: '#EAB308', filename: 'index.js' },
  { value: 'java', label: 'Java', color: '#f97316', filename: 'Main.java' },
  { value: 'c', label: 'C', color: '#5C6BC0', filename: 'script.c' },
  { value: 'sql', label: 'SQL', color: '#E38C00', filename: 'query.sql' },
];

const THEME_OPTIONS = [
  { value: 'tokyoNight', label: 'Tokyo Night', theme: tokyoNight },
  { value: 'dracula', label: 'Dracula', theme: dracula },
  { value: 'githubDark', label: 'GitHub Dark', theme: githubDark },
  { value: 'nord', label: 'Nord', theme: nord },
];
const THEME_MAP = Object.fromEntries(THEME_OPTIONS.map(t => [t.value, t]));

const DEFAULT_TEMPLATES = {
  cpp: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    cout << "🚀 Hello from TrackAsap Playground!" << endl;
    
    vector<int> nums = {5, 2, 8, 1, 9};
    sort(nums.begin(), nums.end());
    
    cout << "Sorted array: ";
    for(int n : nums) {
        cout << n << " ";
    }
    cout << endl;
    return 0;
}`,
  python: `#!/usr/bin/env python3
# TrackAsap Playground - Python 3

def main():
    print("🚀 Hello from TrackAsap Playground!")
    
    nums = [5, 2, 8, 1, 9]
    nums.sort()
    print(f"Sorted list: {nums}")

if __name__ == "__main__":
    main()`,
  javascript: `// TrackAsap Playground - Node.js / JavaScript

console.log("🚀 Hello from TrackAsap Playground!");

const nums = [5, 2, 8, 1, 9];
nums.sort((a, b) => a - b);

console.log("Sorted array:", nums);`,
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("🚀 Hello from TrackAsap Playground!");
        
        List<Integer> nums = new ArrayList<>(Arrays.asList(5, 2, 8, 1, 9));
        Collections.sort(nums);
        
        System.out.println("Sorted list: " + nums);
    }
}`,
  c: `#include <stdio.h>
#include <stdlib.h>

int main() {
    printf("🚀 Hello from TrackAsap Playground!\\n");
    return 0;
}`,
  sql: `-- TrackAsap Playground - SQL
CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    rating INT
);

INSERT INTO users VALUES 
(1, 'Alex', 1850),
(2, 'Sarah', 2100),
(3, 'David', 1620);

SELECT name, rating FROM users ORDER BY rating DESC;`,
};

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

function codeSyntaxLinter(view) {
  const diagnostics = [];
  const doc = view.state.doc.toString();
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
  return diagnostics;
}

const getLanguageExtension = (lang) => {
  switch (lang) {
    case 'cpp':
    case 'c':
      return cpp();
    case 'java':
      return java();
    case 'python':
      return python();
    case 'javascript':
      return javascript();
    case 'sql':
      return sql();
    default:
      return cpp();
  }
};

const Playground = () => {
  const [activeLang, setActiveLang] = useState(() => localStorage.getItem('playground_lang') || 'cpp');
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('playground_theme') || 'tokyoNight');
  const [codeMap, setCodeMap] = useState(() => {
    const saved = {};
    for (const lang of LANG_OPTIONS) {
      let savedCode = localStorage.getItem(`playground_code_${lang.value}`);
      if (savedCode && (savedCode.includes('Antigravity') || savedCode.includes('antigravity'))) {
        savedCode = savedCode
          .replaceAll('Antigravity macOS Playground', 'TrackAsap Playground')
          .replaceAll('Antigravity', 'TrackAsap');
        localStorage.setItem(`playground_code_${lang.value}`, savedCode);
      }
      saved[lang.value] = savedCode !== null ? savedCode : DEFAULT_TEMPLATES[lang.value];
    }
    return saved;
  });

  const [stdinInput, setStdinInput] = useState(() => localStorage.getItem('playground_stdin') || '');
  const [showConsole, setShowConsole] = useState(true);
  const [activeConsoleTab, setActiveConsoleTab] = useState('output'); // 'output' | 'input'
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const currentCode = codeMap[activeLang] || DEFAULT_TEMPLATES[activeLang];
  const activeLangObj = LANG_OPTIONS.find(l => l.value === activeLang) || LANG_OPTIONS[0];

  useEffect(() => {
    localStorage.setItem('playground_lang', activeLang);
  }, [activeLang]);

  useEffect(() => {
    localStorage.setItem('playground_theme', activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    localStorage.setItem(`playground_code_${activeLang}`, currentCode);
  }, [activeLang, currentCode]);

  useEffect(() => {
    localStorage.setItem('playground_stdin', stdinInput);
  }, [stdinInput]);

  const updateCode = useCallback((newCode) => {
    setCodeMap(prev => ({
      ...prev,
      [activeLang]: newCode,
    }));
  }, [activeLang]);

  const handleResetTemplate = () => {
    const defaultCode = DEFAULT_TEMPLATES[activeLang];
    updateCode(defaultCode);
    toast.success('Reset to starter template');
  };

  const handleCopyCode = async () => {
    if (!currentCode) return;
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  const handleFormatCode = useCallback(() => {
    if (!currentCode || !currentCode.trim()) return;
    const formatted = formatCode(currentCode, activeLang);
    if (formatted !== currentCode) {
      updateCode(formatted);
      toast.success('Code Formatted!');
    }
  }, [currentCode, activeLang, updateCode]);

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

  // Keyboard shortcut: Alt+Shift+F (Format), Ctrl/Cmd+Enter (Run)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleFormatCode();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFormatCode, handleRunCode]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        setIsFullScreen(p => !p);
      });
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => { });
      setIsFullScreen(false);
    }
  };

  return (
    <div className={`flex flex-col w-full ${isFullScreen ? 'fixed inset-0 z-50 bg-dark-950 p-3' : 'h-[calc(100vh-88px)]'}`}>
      <style>{`
        .pg-traffic:hover .pg-dot-icon { opacity: 1; }
        .pg-dot-icon { opacity: 0; transition: opacity 0.15s; }
        .pg-traffic:hover button { animation: pg-wobble 0.5s ease-in-out; }
        .pg-traffic:hover button:nth-child(2) { animation-delay:0.05s; }
        .pg-traffic:hover button:nth-child(3) { animation-delay:0.1s; }
        @keyframes pg-wobble {
          0%,100%{ transform: scale(1) rotate(0deg); }
          20%{ transform: scale(1.15) rotate(-8deg); }
          40%{ transform: scale(1.05) rotate(6deg); }
          60%{ transform: scale(1.1) rotate(-4deg); }
          80%{ transform: scale(1.02) rotate(2deg); }
        }
        .cm-editor { background: #1a1b26 !important; height: 100% !important; }
        .cm-gutters { background: #1a1b26 !important; border-right: 1px solid rgba(255,255,255,0.05) !important; color: #3b3d52 !important; }
        .cm-activeLineGutter { background: rgba(255,255,255,0.03) !important; }
        .cm-content { padding: 12px 0 !important; }
        .cm-line { font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace !important; font-size: 14px !important; }

        /* CodeMirror Autocomplete Dropdown Theme */
        .cm-tooltip-autocomplete { background: #1e1f31 !important; border: 1px solid rgba(255,255,255,0.12) !important; border-radius: 8px !important; box-shadow: 0 15px 35px rgba(0,0,0,0.6) !important; }
        .cm-tooltip-autocomplete > ul { font-family: 'JetBrains Mono', monospace !important; font-size: 13px !important; }
        .cm-tooltip-autocomplete > ul > li { color: #a9b1d6 !important; padding: 6px 12px !important; }
        .cm-tooltip-autocomplete > ul > li[aria-selected] { background: rgba(57,255,20,0.15) !important; color: #39FF14 !important; border-radius: 4px !important; font-weight: 600; }
      `}</style>

      {/* ── macOS Code Window Container ── */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#1a1b26] rounded-2xl border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.6)] overflow-hidden">

        {/* ── macOS Titlebar ── */}
        <div
          className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b select-none shrink-0 gap-2"
          style={{
            background: 'linear-gradient(180deg, #2a2b3d 0%, #1e1f31 100%)',
            borderColor: 'rgba(255,255,255,0.06)'
          }}
          onDoubleClick={toggleFullScreen}
        >
          {/* Left: Authentic macOS Traffic Light Dots */}
          <div className="pg-traffic flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => toast.error('Playground is your live scratchpad!')}
              className="w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-full bg-[#FF5F57] hover:brightness-90 transition-all flex items-center justify-center relative"
              title="Close"
            >
              <svg className="pg-dot-icon w-[8px] h-[8px] absolute" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="#4D0000" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
            <button
              onClick={() => setShowConsole(p => !p)}
              className="w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-full bg-[#FEBC2E] hover:brightness-90 transition-all flex items-center justify-center relative"
              title="Toggle Console"
            >
              <svg className="pg-dot-icon w-[8px] h-[8px] absolute" viewBox="0 0 12 12" fill="none"><path d="M2.5 6H9.5" stroke="#995700" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
            <button
              onClick={toggleFullScreen}
              className="w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-full bg-[#28C840] hover:brightness-90 transition-all flex items-center justify-center relative"
              title="Toggle Fullscreen"
            >
              <svg className="pg-dot-icon w-[7px] h-[7px] absolute" viewBox="0 0 12 12" fill="none">
                {isFullScreen
                  ? <><path d="M3.5 8.5L8.5 3.5" stroke="#006500" strokeWidth="1.4" strokeLinecap="round" /><path d="M4 3.5H8.5V8" stroke="#006500" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 8.5H3.5V4" stroke="#006500" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></>
                  : <path d="M2 10L10 2M10 2H4.5M10 2V7.5" stroke="#006500" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
              </svg>
            </button>
          </div>

          {/* Center: File name & Status */}
          <div className="flex items-center gap-2 hidden md:flex min-w-0">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse shadow-[0_0_8px_rgba(57,255,20,0.6)] shrink-0" />
            <span className="text-sm font-semibold text-gray-300 tracking-wide font-mono truncate">
              {activeLangObj.filename}
            </span>
            <span className="text-xs text-gray-500 hidden sm:inline truncate">
              — Auto-saved to scratchpad
            </span>
          </div>

          {/* Right: Controls & Run Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Language Dropdown */}
            <select
              value={activeLang}
              onChange={(e) => setActiveLang(e.target.value)}
              className="bg-black/40 text-gray-200 border border-white/10 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold focus:outline-none focus:border-neon-green/50 cursor-pointer"
            >
              {LANG_OPTIONS.map(l => (
                <option key={l.value} value={l.value} className="bg-[#1e1f31] text-white">
                  {l.label}
                </option>
              ))}
            </select>

            {/* Theme Dropdown */}
            <select
              value={activeTheme}
              onChange={(e) => setActiveTheme(e.target.value)}
              className="bg-black/30 text-gray-300 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-white/20 hidden sm:inline-block cursor-pointer"
            >
              {THEME_OPTIONS.map(t => (
                <option key={t.value} value={t.value} className="bg-[#1e1f31] text-white">
                  {t.label}
                </option>
              ))}
            </select>

            {/* Format Button */}
            <button
              onClick={handleFormatCode}
              title="Format Code (Alt+Shift+F)"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5 hidden sm:inline-block"
            >
              <AlignLeft size={15} />
            </button>

            {/* Copy Button */}
            <button
              onClick={handleCopyCode}
              title="Copy source code"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5 hidden sm:inline-block"
            >
              {copied ? <Check size={15} className="text-neon-green" /> : <Copy size={15} />}
            </button>

            {/* Reset Template Button */}
            <button
              onClick={handleResetTemplate}
              title="Reset to starter template"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5 hidden sm:inline-block"
            >
              <RotateCcw size={15} />
            </button>

            {/* RUN CODE BUTTON */}
            <button
              onClick={handleRunCode}
              disabled={isRunningCode}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 bg-neon-green/20 hover:bg-neon-green/30 text-neon-green border border-neon-green/40 hover:border-neon-green rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(57,255,20,0.2)] disabled:opacity-50 cursor-pointer shrink-0"
              title="Run Code (Ctrl/Cmd + Enter)"
            >
              {isRunningCode ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Running</span>
                </>
              ) : (
                <>
                  <Play size={13} fill="currentColor" />
                  <span>Run</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Main Editor Area ── */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="flex-1 min-h-0 overflow-hidden">
            <CodeMirror
              value={currentCode}
              onChange={(value) => updateCode(value)}
              theme={THEME_MAP[activeTheme]?.theme || tokyoNight}
              extensions={[
                getLanguageExtension(activeLang),
                autocompletion(),
                linter(codeSyntaxLinter),
                EditorView.lineWrapping,
              ]}
              height="100%"
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                highlightActiveLine: true,
                foldGutter: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                indentOnInput: true,
              }}
            />
          </div>

          {/* ── Resizable/Toggleable Bottom Console Drawer ── */}
          <div className="border-t border-white/10 bg-[#141520] flex flex-col shrink-0 transition-all duration-300">
            {/* Drawer Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#1a1b26]/90 border-b border-white/5 text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setShowConsole(true); setActiveConsoleTab('output'); }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${showConsole && activeConsoleTab === 'output'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  <Terminal size={13} className="text-neon-green" />
                  <span>Terminal / Output</span>
                  {executionResult && (
                    <span className={`w-2 h-2 rounded-full ${executionResult.status?.id === 3 ? 'bg-neon-green' : 'bg-red-500'
                      }`} />
                  )}
                </button>

                <button
                  onClick={() => { setShowConsole(true); setActiveConsoleTab('input'); }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${showConsole && activeConsoleTab === 'input'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  <Code2 size={13} className="text-purple-400" />
                  <span>Custom Stdin</span>
                  {stdinInput && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {executionResult && activeConsoleTab === 'output' && (
                  <button
                    onClick={() => setExecutionResult(null)}
                    className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/5 transition-all"
                  >
                    <Trash2 size={12} />
                    <span>Clear</span>
                  </button>
                )}

                <button
                  onClick={() => setShowConsole(p => !p)}
                  className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                  title={showConsole ? 'Minimize Console' : 'Expand Console'}
                >
                  {showConsole ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <AnimatePresence initial={false}>
              {showConsole && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 210, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden flex flex-col bg-[#11121b]"
                >
                  {activeConsoleTab === 'output' ? (
                    <div className="flex-1 overflow-y-auto p-4 font-mono text-xs flex flex-col">
                      {isRunningCode ? (
                        <div className="flex items-center justify-center h-full gap-3 text-gray-400">
                          <Loader2 size={18} className="animate-spin text-neon-green" />
                          <span>Running code on Azure Compiler Engine...</span>
                        </div>
                      ) : executionResult ? (
                        <div className="space-y-3">
                          {/* Status Badge & Metrics */}
                          <div className="flex flex-wrap items-center gap-3 pb-2 border-b border-white/5">
                            {executionResult.status?.id === 3 ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                                <CheckCircle2 size={14} />
                                <span>Accepted</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 font-bold">
                                <AlertTriangle size={14} />
                                <span>{executionResult.status?.description || 'Error'}</span>
                              </div>
                            )}

                            {executionResult.timeMs !== undefined && (
                              <span className="text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                Time: <strong className="text-white">{executionResult.timeMs}ms</strong>
                              </span>
                            )}
                            {executionResult.memoryKB !== undefined && (
                              <span className="text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                Memory: <strong className="text-white">{executionResult.memoryKB} KB</strong>
                              </span>
                            )}
                          </div>

                          {/* Stdout */}
                          {executionResult.stdout && (
                            <div>
                              <div className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">Standard Output</div>
                              <pre className="p-3 bg-black/40 rounded-lg text-emerald-300 font-mono whitespace-pre-wrap overflow-x-auto border border-white/5 leading-relaxed">
                                {executionResult.stdout}
                              </pre>
                            </div>
                          )}

                          {/* Stderr / Compile Error */}
                          {(executionResult.stderr || executionResult.compile_output) && (
                            <div>
                              <div className="text-[10px] uppercase font-bold text-red-400/80 mb-1 tracking-wider">Error Output</div>
                              <pre className="p-3 bg-red-950/20 rounded-lg text-red-300 font-mono whitespace-pre-wrap overflow-x-auto border border-red-500/20 leading-relaxed">
                                {executionResult.stderr || executionResult.compile_output}
                              </pre>
                            </div>
                          )}

                          {!executionResult.stdout && !executionResult.stderr && !executionResult.compile_output && (
                            <div className="text-gray-500 italic">Program finished with no output.</div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                          <Terminal size={24} className="opacity-30" />
                          <p>Click <strong className="text-neon-green">Run</strong> or press <strong className="text-white">Ctrl/Cmd + Enter</strong> to execute your code.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col p-4 bg-[#11121b]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-400">
                          Custom Standard Input (stdin)
                        </span>
                        {stdinInput && (
                          <button
                            onClick={() => setStdinInput('')}
                            className="text-[11px] text-gray-500 hover:text-white transition-colors"
                          >
                            Clear Input
                          </button>
                        )}
                      </div>
                      <textarea
                        value={stdinInput}
                        onChange={(e) => setStdinInput(e.target.value)}
                        placeholder="Enter custom input test case here (e.g. numbers, strings, or array sizes on separate lines)..."
                        className="flex-1 w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-neon-green/50 resize-none custom-scrollbar"
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Playground;
