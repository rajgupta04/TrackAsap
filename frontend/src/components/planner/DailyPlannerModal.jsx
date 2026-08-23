import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Flame,
  Coffee,
  Zap,
  X,
  Sparkles,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Layers,
  Utensils,
  Moon,
  TrendingUp,
  History,
  RotateCcw,
  Check,
  Edit3,
  BarChart3,
  GripVertical,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useDailyPlanStore from '../../store/dailyPlanStore';
import useSheetStore from '../../store/sheetStore';
import GlassCard from '../ui/GlassCard';

// Preset sample subjects for quick-add
const SAMPLE_SUBJECTS = [
  { name: 'DSA - Graph', type: 'revision' },
  { name: 'OS', type: 'revision' },
  { name: 'CN', type: 'revision' },
  { name: 'SQL Sheet', type: 'revision' },
  { name: 'System Design', type: 'new' },
  { name: 'Dynamic Programming', type: 'practice' },
  { name: 'Trees & BST', type: 'revision' },
];

export const DailyPlannerModal = () => {
  const {
    isModalOpen,
    closeModal,
    step,
    setStep,
    mode,
    setMode,
    totalHours,
    setTotalHours,
    subjects,
    setSubjects,
    addSubject,
    removeSubject,
    meals,
    setMeals,
    breaks,
    setBreaks,
    powerNap,
    setPowerNap,
    beverage,
    setBeverage,
    generatedOptions,
    selectedPlanChoice,
    isGenerating,
    generatePlans,
    selectPlan,
    currentPlan,
    updateLocalTasks,
    startSession,
    toggleTask,
    endSession,
    fetchActiveSession,
    history,
    fetchHistory,
    isLoadingHistory,
    createNewPlan,
    repeatPlan,
  } = useDailyPlanStore();

  const { sheets, fetchSheets } = useSheetStore();

  // Local Form state
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [customSubjectType, setCustomSubjectType] = useState('revision');
  const [editingTaskIndex, setEditingTaskIndex] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState(45);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [glitchModalData, setGlitchModalData] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    fetchActiveSession();
    fetchSheets(true);
  }, []);

  // Timer countdown for active session
  useEffect(() => {
    if (currentPlan?.status !== 'active' || !currentPlan?.sessionStartedAt || !currentPlan?.durationSecondsPlanned) {
      return;
    }

    const updateTimer = () => {
      const startMs = new Date(currentPlan.sessionStartedAt).getTime();
      const totalPlannedMs = currentPlan.durationSecondsPlanned * 1000;
      const endMs = startMs + totalPlannedMs;
      const diffMs = Math.max(0, endMs - Date.now());
      setRemainingSeconds(Math.floor(diffMs / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentPlan]);

  if (!isModalOpen) return null;

  const formatCountdown = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const handleAddCustomSubject = (e) => {
    e?.preventDefault();
    if (!customSubjectName.trim()) return;
    addSubject({ name: customSubjectName.trim(), type: customSubjectType });
    setCustomSubjectName('');
  };

  const handleAddSampleSubject = (sample) => {
    const exists = subjects.some((s) => s.name.toLowerCase() === sample.name.toLowerCase());
    if (exists) {
      toast('Subject already added', { icon: 'ℹ️' });
      return;
    }
    addSubject(sample);
  };

  // Easter egg Matrix glitch check on checking off tasks too early
  const handleTaskCheckClick = (task) => {
    if (task.completed) {
      toggleTask(task.id);
      return;
    }

    const sessionStartMs = currentPlan?.sessionStartedAt
      ? new Date(currentPlan.sessionStartedAt).getTime()
      : Date.now();
    const elapsedMinutes = Math.max(0, Math.floor((Date.now() - sessionStartMs) / 60000));
    const taskDuration = Math.max(1, Number(task.duration) || 30);

    // If task duration >= 15 min and checked when < 25% of required duration has passed
    if (taskDuration >= 15 && elapsedMinutes < Math.floor(taskDuration * 0.25)) {
      setGlitchModalData({
        task,
        elapsedMinutes,
        taskDuration,
      });
      return;
    }

    toggleTask(task.id);
  };

  // Reorder task helper (move up / down)
  const moveTask = (fromIndex, toIndex) => {
    if (!currentPlan?.plan?.tasks) return;
    const tasks = [...currentPlan.plan.tasks];
    if (toIndex < 0 || toIndex >= tasks.length) return;
    const [moved] = tasks.splice(fromIndex, 1);
    tasks.splice(toIndex, 0, moved);
    updateLocalTasks(tasks);
  };

  const handleDeleteTask = (index) => {
    if (!currentPlan?.plan?.tasks) return;
    const tasks = currentPlan.plan.tasks.filter((_, i) => i !== index);
    updateLocalTasks(tasks);
  };

  const handleAddNewTaskToPlan = () => {
    if (!newTaskTitle.trim() || !currentPlan?.plan?.tasks) return;
    const tasks = [
      ...currentPlan.plan.tasks,
      {
        id: `custom-task-${Date.now()}`,
        time: 'Custom',
        duration: Number(newTaskDuration) || 30,
        title: newTaskTitle.trim(),
        category: 'study',
        icon: '📝',
        completed: false,
      },
    ];
    updateLocalTasks(tasks);
    setNewTaskTitle('');
    setNewTaskDuration(45);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md overflow-y-auto ${
        isFullScreen ? 'p-0' : 'p-2 sm:p-4'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className={`flex flex-col bg-dark-900/95 border border-white/15 shadow-2xl shadow-neon-green/10 overflow-hidden text-white transition-all duration-200 ${
          isFullScreen
            ? 'w-screen h-screen max-w-full max-h-full rounded-none border-none'
            : 'w-full max-w-4xl max-h-[92vh] rounded-2xl my-auto'
        }`}
      >
        {/* ── macOS Window Header ── */}
        <div className="px-4 py-3 bg-dark-950 border-b border-white/10 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <div className="group/traffic flex items-center gap-1.5 mr-2">
              {/* Red dot: Cross back to Home */}
              <button
                type="button"
                onClick={() => setStep('greeting')}
                className="w-3 h-3 rounded-full bg-[#FF5F57] hover:brightness-110 active:brightness-90 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-2 h-2 text-black/80 opacity-0 group-hover/traffic:opacity-100 stroke-[3] transition-opacity" />
              </button>
              {/* Yellow dot: Minus means Minimize to floating bubble */}
              <button
                type="button"
                onClick={closeModal}
                className="w-3 h-3 rounded-full bg-[#FEBC2E] hover:brightness-110 active:brightness-90 flex items-center justify-center transition-all cursor-pointer"
              >
                <Minus className="w-2 h-2 text-black/80 opacity-0 group-hover/traffic:opacity-100 stroke-[3] transition-opacity" />
              </button>
              {/* Green dot: Plus means Full Screen mode */}
              <button
                type="button"
                onClick={() => setIsFullScreen((prev) => !prev)}
                className="w-3 h-3 rounded-full bg-[#28C840] hover:brightness-110 active:brightness-90 flex items-center justify-center transition-all cursor-pointer"
              >
                <Plus className="w-2 h-2 text-black/80 opacity-0 group-hover/traffic:opacity-100 stroke-[3] transition-opacity" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-neon-green" />
              <span className="text-xs font-bold text-gray-200 tracking-wide">
                TrackAsap AI Daily Planner
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentPlan?.status === 'active' && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neon-green/15 border border-neon-green/30 text-neon-green text-[11px] font-mono font-bold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                {formatCountdown(remainingSeconds)}
              </div>
            )}
            <button
              onClick={() => {
                fetchHistory();
                setStep('history');
              }}
              className="p-1.5 text-dark-300 hover:text-white hover:bg-white/10 rounded-lg transition-all text-xs flex items-center gap-1"
              title="Previous Sessions"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
            </button>
            <button
              onClick={closeModal}
              className="p-1.5 text-dark-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Modal Content Container ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
          {/* ════════════════════════════════════════════════════════════════ */}
          {/* ── STEP 1: GREETING & MODE SELECTION ─────────────────────────── */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {step === 'greeting' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 text-center py-4"
            >
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" /> AI Focus Engine
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Let's plan your day with AI.
                </h2>
                <p className="text-sm text-dark-300 max-w-lg mx-auto">
                  Pick your wavelength for this session. We'll balance your subjects, breaks, and track your progress in real-time.
                </p>
              </div>

              {/* 3 Modes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-2">
                {/* Chill Mode */}
                <button
                  type="button"
                  onClick={() => {
                    setMode('chill');
                    setStep('input');
                  }}
                  className={`p-5 rounded-2xl border transition-all text-left group relative overflow-hidden ${
                    mode === 'chill'
                      ? 'bg-cyan-500/15 border-cyan-400/50 shadow-lg shadow-cyan-500/10'
                      : 'bg-dark-800/60 border-white/10 hover:border-cyan-400/40 hover:bg-dark-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    ☕ Chill Mode
                  </h3>
                  <p className="text-xs text-dark-300 mt-1 leading-relaxed">
                    Easy pace, steady revision, frequent breathers. Perfect for low energy or conceptual review.
                  </p>
                  <span className="inline-block mt-3 text-[11px] font-semibold text-cyan-400">
                    Select Mode →
                  </span>
                </button>

                {/* Grind Mode */}
                <button
                  type="button"
                  onClick={() => {
                    setMode('grind');
                    setStep('input');
                  }}
                  className={`p-5 rounded-2xl border transition-all text-left group relative overflow-hidden ${
                    mode === 'grind'
                      ? 'bg-amber-500/15 border-amber-400/50 shadow-lg shadow-amber-500/10'
                      : 'bg-dark-800/60 border-white/10 hover:border-amber-400/40 hover:bg-dark-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Flame className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    🔥 Grind Mode
                  </h3>
                  <p className="text-xs text-dark-300 mt-1 leading-relaxed">
                    High focus, structured Pomodoro intervals, solid targets. Ideal for problem sheet solving.
                  </p>
                  <span className="inline-block mt-3 text-[11px] font-semibold text-amber-400">
                    Select Mode →
                  </span>
                </button>

                {/* All In Mode */}
                <button
                  type="button"
                  onClick={() => {
                    setMode('allin');
                    setStep('input');
                  }}
                  className={`p-5 rounded-2xl border transition-all text-left group relative overflow-hidden ${
                    mode === 'allin'
                      ? 'bg-pink-500/15 border-pink-400/50 shadow-lg shadow-pink-500/10'
                      : 'bg-dark-800/60 border-white/10 hover:border-pink-400/40 hover:bg-dark-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition-colors">
                    ⚡ All In Mode
                  </h3>
                  <p className="text-xs text-dark-300 mt-1 leading-relaxed">
                    Zero distractions, aggressive deep-work sprints, maximum output. Full send lock-in.
                  </p>
                  <span className="inline-block mt-3 text-[11px] font-semibold text-pink-400">
                    Select Mode →
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {/* ── STEP 2: INTERACTIVE PROMPT FORM ───────────────────────────── */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {step === 'input' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto w-full space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <button
                  onClick={() => setStep('greeting')}
                  className="flex items-center gap-1.5 text-xs text-dark-300 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Modes
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-dark-400">Target Mode:</span>
                  <span
                    className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      mode === 'chill'
                        ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300'
                        : mode === 'allin'
                        ? 'bg-pink-500/15 border-pink-400/40 text-pink-300'
                        : 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                    }`}
                  >
                    {mode}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Form Controls */}
                <div className="lg:col-span-7 space-y-5">
                  {/* 1. Hours available */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-neon-green" /> How many hours do you have?
                      </label>
                      <span className="text-base font-extrabold text-neon-green">{totalHours} Hours</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="14"
                      step="0.5"
                      value={totalHours}
                      onChange={(e) => setTotalHours(parseFloat(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-green"
                    />
                    <div className="flex gap-2 pt-1 flex-wrap">
                      {[2, 3, 4, 6, 8, 10].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setTotalHours(h)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            totalHours === h
                              ? 'bg-neon-green text-black border-neon-green font-bold'
                              : 'bg-white/5 border-white/10 text-dark-300 hover:text-white'
                          }`}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Subjects to study */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" /> What are the subjects you want to study?
                    </label>

                    {/* Custom Input */}
                    <form onSubmit={handleAddCustomSubject} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Graph revision, System design, Redis..."
                        value={customSubjectName}
                        onChange={(e) => setCustomSubjectName(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-neon-green"
                      />
                      <select
                        value={customSubjectType}
                        onChange={(e) => setCustomSubjectType(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-xs text-dark-200 focus:outline-none focus:border-neon-green"
                      >
                        <option value="revision">Revision</option>
                        <option value="new">New Topic</option>
                        <option value="practice">Practice Qs</option>
                      </select>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </form>

                    {/* Added Subjects List */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {subjects.map((sub, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-xs text-cyan-300 font-medium"
                        >
                          <span>{sub.name}</span>
                          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 font-bold">
                            {sub.type}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSubject(idx)}
                            className="hover:text-red-400 transition-colors ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Breaks, Meals, Nap, Beverage Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                    {/* Meals */}
                    <div className="p-3 rounded-xl bg-dark-800/50 border border-white/10 space-y-1.5">
                      <label className="text-[11px] font-bold text-dark-300 flex items-center gap-1">
                        <Utensils className="w-3 h-3 text-amber-400" /> Meals Left
                      </label>
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setMeals(m)}
                            className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                              meals === m
                                ? 'bg-amber-500 text-black'
                                : 'bg-white/5 text-dark-400 hover:text-white'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Breaks */}
                    <div className="p-3 rounded-xl bg-dark-800/50 border border-white/10 space-y-1.5">
                      <label className="text-[11px] font-bold text-dark-300 flex items-center gap-1">
                        <Coffee className="w-3 h-3 text-emerald-400" /> Breaks
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setBreaks(b)}
                            className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                              breaks === b
                                ? 'bg-emerald-500 text-black'
                                : 'bg-white/5 text-dark-400 hover:text-white'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Power Nap */}
                    <div className="p-3 rounded-xl bg-dark-800/50 border border-white/10 space-y-1.5">
                      <label className="text-[11px] font-bold text-dark-300 flex items-center gap-1">
                        <Moon className="w-3 h-3 text-indigo-400" /> Power Nap?
                      </label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setPowerNap(false)}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                            !powerNap ? 'bg-white/20 text-white' : 'bg-white/5 text-dark-400'
                          }`}
                        >
                          No
                        </button>
                        <button
                          type="button"
                          onClick={() => setPowerNap(true)}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                            powerNap ? 'bg-indigo-500 text-white' : 'bg-white/5 text-dark-400'
                          }`}
                        >
                          20m 💤
                        </button>
                      </div>
                    </div>

                    {/* Beverage */}
                    <div className="p-3 rounded-xl bg-dark-800/50 border border-white/10 space-y-1.5">
                      <label className="text-[11px] font-bold text-dark-300 flex items-center gap-1">
                        ☕ Beverage
                      </label>
                      <div className="grid grid-cols-4 gap-1 text-[11px]">
                        {[
                          { id: 'chai', label: '🍵' },
                          { id: 'coffee', label: '☕' },
                          { id: 'water', label: '💧' },
                          { id: 'none', label: '🚫' },
                        ].map((bev) => (
                          <button
                            key={bev.id}
                            type="button"
                            onClick={() => setBeverage(bev.id)}
                            className={`py-1 rounded-lg font-bold transition-all ${
                              beverage === bev.id
                                ? 'bg-amber-400/20 border border-amber-400/50 text-amber-300'
                                : 'bg-white/5 text-dark-400 hover:text-white'
                            }`}
                          >
                            {bev.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={generatePlans}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-neon-green to-emerald-400 text-black font-extrabold text-sm shadow-lg shadow-neon-green/20 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin text-black" />
                        <span className="font-bold">🐇 Rabbit is Running... crafting your master schedule!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate AI Plans ✨</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Right Column: Mode Architecture & Live Calculation Breakdown */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Architecture Card */}
                  <div className="p-5 rounded-2xl bg-dark-800/80 border border-white/15 space-y-3.5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-neon-green" /> Session Architecture
                      </span>
                      <span className="text-xs font-mono text-neon-green font-bold">
                        {totalHours}h Session
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <div className="font-mono text-sm font-extrabold text-white">
                          {Math.max(
                            1,
                            Math.round(
                              ((totalHours * 60 -
                                (meals * 35 +
                                  breaks * (mode === 'allin' ? 5 : mode === 'chill' ? 15 : 10) +
                                  (powerNap ? 20 : 0) +
                                  Math.max(1, Math.ceil(totalHours / 6)) * 15 +
                                  20)) /
                                60) *
                                10
                            ) / 10
                          )}h
                        </div>
                        <div className="text-[10px] text-dark-400 mt-0.5">Deep Focus</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <div className="font-mono text-sm font-extrabold text-emerald-400">
                          {breaks * (mode === 'allin' ? 5 : mode === 'chill' ? 15 : 10) +
                            Math.max(1, Math.ceil(totalHours / 6)) * 15}m
                        </div>
                        <div className="text-[10px] text-dark-400 mt-0.5">Breaks & Tea</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <div className="font-mono text-sm font-extrabold text-amber-400">
                          {meals * 35 + (powerNap ? 20 : 0)}m
                        </div>
                        <div className="text-[10px] text-dark-400 mt-0.5">Meals & Nap</div>
                      </div>
                    </div>

                    <p className="text-xs text-dark-300 leading-relaxed border-t border-white/5 pt-3">
                      {mode === 'chill' &&
                        '☕ Relaxed 45m study blocks interspersed with 15m rejuvenation breaks to prevent burnout.'}
                      {mode === 'grind' &&
                        '🔥 Classic 60m Pomodoro power sessions with 10m agile breaks and synchronized sheet tracking.'}
                      {mode === 'allin' &&
                        '⚡ High-intensity 90m deep-work blocks with rapid 5m recharge intervals. Maximum velocity.'}
                    </p>
                  </div>

                  {/* Quick Add Curated Subjects */}
                  <div className="p-4 rounded-2xl bg-dark-800/50 border border-white/10 space-y-2.5">
                    <div className="text-xs font-bold text-dark-300">Quick Subject & Sheet Suggestions:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {SAMPLE_SUBJECTS.map((sample, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleAddSampleSubject(sample)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 text-xs text-dark-300 hover:text-cyan-300 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>+ {sample.name}</span>
                          <span className="text-[10px] text-dark-500">({sample.type})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* ── STEP 3: COMPARE & SELECT PLAN (A vs B) ────────────────────── */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {step === 'compare' && generatedOptions && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <button
                  onClick={() => setStep('input')}
                  className="flex items-center gap-1.5 text-xs text-dark-300 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Inputs
                </button>
                <button
                  onClick={generatePlans}
                  disabled={isGenerating}
                  className="flex items-center gap-1 text-xs text-neon-green hover:underline font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Regenerate with AI
                </button>
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-xl font-extrabold text-white">
                  Compare Your 2 AI Study Plans
                </h3>
                <p className="text-xs text-dark-300">
                  Select the plan that best matches your flow today. You can adjust and edit all tasks next.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Plan A Card */}
                <div className="flex flex-col rounded-2xl bg-dark-800/80 border border-white/15 overflow-hidden hover:border-neon-green/40 transition-all shadow-lg">
                  {/* Traffic Light Mini Header */}
                  <div className="px-3.5 py-2.5 bg-dark-950/80 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                      <span className="text-[11px] font-bold text-gray-300 ml-1">Plan A</span>
                    </div>
                    <span className="text-[10px] text-neon-green font-semibold uppercase">
                      {generatedOptions.planA?.tasks?.length || 0} Tasks
                    </span>
                  </div>

                  <div className="p-4 flex-1 space-y-3">
                    <h4 className="text-sm font-bold text-white">
                      {generatedOptions.planA?.title || 'Option A'}
                    </h4>

                    {/* Task Timeline List */}
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                      {generatedOptions.planA?.tasks?.map((t, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span>{t.icon || '📝'}</span>
                            <span className="font-medium text-white truncate">{t.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {t.linkedSheetName && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                                📊 {t.linkedSheetName}
                              </span>
                            )}
                            <span className="text-[10px] text-dark-400 font-mono">
                              {t.duration}m
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 border-t border-white/10 bg-dark-950/50">
                    <button
                      type="button"
                      onClick={() => selectPlan('planA')}
                      className="w-full py-2.5 rounded-xl bg-neon-green text-black font-extrabold text-xs hover:bg-neon-green/90 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Pick Plan A & Edit
                    </button>
                  </div>
                </div>

                {/* Plan B Card */}
                <div className="flex flex-col rounded-2xl bg-dark-800/80 border border-white/15 overflow-hidden hover:border-amber-400/40 transition-all shadow-lg">
                  {/* Traffic Light Mini Header */}
                  <div className="px-3.5 py-2.5 bg-dark-950/80 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                      <span className="text-[11px] font-bold text-gray-300 ml-1">Plan B</span>
                    </div>
                    <span className="text-[10px] text-amber-400 font-semibold uppercase">
                      {generatedOptions.planB?.tasks?.length || 0} Tasks
                    </span>
                  </div>

                  <div className="p-4 flex-1 space-y-3">
                    <h4 className="text-sm font-bold text-white">
                      {generatedOptions.planB?.title || 'Option B'}
                    </h4>

                    {/* Task Timeline List */}
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                      {generatedOptions.planB?.tasks?.map((t, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span>{t.icon || '⚡'}</span>
                            <span className="font-medium text-white truncate">{t.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {t.linkedSheetName && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                                📊 {t.linkedSheetName}
                              </span>
                            )}
                            <span className="text-[10px] text-dark-400 font-mono">
                              {t.duration}m
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 border-t border-white/10 bg-dark-950/50">
                    <button
                      type="button"
                      onClick={() => selectPlan('planB')}
                      className="w-full py-2.5 rounded-xl bg-amber-400 text-black font-extrabold text-xs hover:bg-amber-300 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Pick Plan B & Edit
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* ── STEP 4: EDITABLE MAC-STYLE PLANNER ────────────────────────── */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {step === 'edit' && currentPlan?.plan && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto w-full space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <button
                  onClick={() => setStep('compare')}
                  className="flex items-center gap-1.5 text-xs text-dark-300 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change Plan Selection
                </button>
                <span className="text-xs font-semibold text-neon-green">
                  {currentPlan.plan.tasks?.length || 0} Tasks Scheduled
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Plan Control & Actions */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Title & Timing Info */}
                  <div className="p-4 rounded-2xl bg-dark-800/90 border border-white/15 space-y-2 shadow-lg">
                    <label className="text-[11px] font-bold text-dark-400 uppercase tracking-wider">Plan Name</label>
                    <input
                      type="text"
                      value={currentPlan.plan.title}
                      onChange={(e) => updateLocalTasks(currentPlan.plan.tasks, e.target.value)}
                      className="text-base font-extrabold bg-transparent text-white border-b border-white/20 focus:border-neon-green outline-none w-full"
                    />
                    <p className="text-xs text-dark-300 pt-1">
                      Mode: <span className="text-neon-green capitalize font-semibold">{mode}</span> • Sheet Monitoring active
                    </p>
                  </div>

                  {/* Dynamic Surplus / Deficit Live Indicator Bar */}
                  {(() => {
                    const totalPlannedMins = Math.round((totalHours || 4) * 60);
                    const totalAllocatedMins = (currentPlan.plan.tasks || []).reduce(
                      (sum, t) => sum + (Math.max(1, Number(t.duration)) || 0),
                      0
                    );
                    const diffMins = totalAllocatedMins - totalPlannedMins;
                    const formatHM = (mins) => {
                      const h = Math.floor(mins / 60);
                      const m = mins % 60;
                      if (h > 0 && m > 0) return `${h}h ${m}m`;
                      if (h > 0) return `${h}h`;
                      return `${m}m`;
                    };

                    return (
                      <div className="p-4 rounded-2xl bg-dark-950/80 border border-white/10 space-y-2.5 shadow-inner">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-dark-300 flex items-center gap-1.5 font-bold">
                            <Clock className="w-3.5 h-3.5 text-neon-green" /> Schedule Balance
                          </span>
                          <span className="font-mono text-white font-extrabold">
                            {formatHM(totalAllocatedMins)} / {totalHours}h
                          </span>
                        </div>
                        <div>
                          {diffMins > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono">
                              ⚡ Surplus: +{diffMins}m ({formatHM(totalAllocatedMins)} total)
                            </span>
                          ) : diffMins < 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-bold font-mono">
                              ⏳ Deficit: -{Math.abs(diffMins)}m unallocated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                              ✓ Balanced ({totalHours}h)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Add Custom Task Card */}
                  <div className="p-4 rounded-2xl bg-dark-800/80 border border-white/10 space-y-2.5">
                    <label className="text-xs font-bold text-dark-300">Add Task to Sequence</label>
                    <input
                      type="text"
                      placeholder="e.g. Solve 2 Hard LeetCode problems..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-dark-500 focus:outline-none focus:border-neon-green"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="5"
                        max="180"
                        step="5"
                        value={newTaskDuration}
                        onChange={(e) => setNewTaskDuration(e.target.value)}
                        className="w-20 px-2 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-center text-neon-green font-bold focus:outline-none focus:border-neon-green"
                        title="Duration in minutes"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewTaskToPlan}
                        className="flex-1 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Task
                      </button>
                    </div>
                  </div>

                  {/* Big Start Button */}
                  <button
                    onClick={startSession}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-neon-green via-emerald-400 to-cyan-400 text-black font-extrabold text-sm shadow-xl shadow-neon-green/20 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Start Non-Stop Session</span>
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>

                {/* Right Column: Task Items Table (Editable & Reorderable) */}
                <div className="lg:col-span-7 space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <h4 className="text-xs font-bold text-dark-400 uppercase tracking-wider">
                      Task Sequence & Allocations ({currentPlan.plan.tasks?.length || 0})
                    </h4>
                    <span className="text-[11px] text-dark-400">
                      Reordering auto-adjusts sequential times
                    </span>
                  </div>

                  <div
                    className={`space-y-2 overflow-y-auto pr-1 scrollbar-thin ${
                      isFullScreen ? 'max-h-[calc(100vh-230px)]' : 'max-h-80'
                    }`}
                  >
                    {currentPlan.plan.tasks?.map((t, idx) => (
                      <div
                        key={t.id || idx}
                        className="group flex items-center justify-between p-3 rounded-xl bg-dark-800/90 border border-white/10 hover:border-white/20 transition-all gap-3"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Reorder Buttons */}
                          <div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => moveTask(idx, idx - 1)}
                              disabled={idx === 0}
                              className="text-[10px] hover:text-neon-green disabled:opacity-20"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => moveTask(idx, idx + 1)}
                              disabled={idx === currentPlan.plan.tasks.length - 1}
                              className="text-[10px] hover:text-neon-green disabled:opacity-20"
                            >
                              ▼
                            </button>
                          </div>

                          <span className="text-lg shrink-0">{t.icon || '📝'}</span>

                          {/* Title & Time */}
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={t.title}
                              onChange={(e) => {
                                const updated = [...currentPlan.plan.tasks];
                                updated[idx].title = e.target.value;
                                updateLocalTasks(updated);
                              }}
                              className="text-xs font-semibold text-white bg-transparent border-b border-transparent hover:border-white/20 focus:border-neon-green outline-none w-full"
                            />
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] text-dark-400 font-mono">{t.time}</span>
                              {/* Sheet Linker Selector */}
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-dark-400">Sheet:</span>
                                <select
                                  value={t.linkedSheetId || ''}
                                  onChange={(e) => {
                                    const selectedId = e.target.value;
                                    const selectedSheet = sheets.find((s) => s._id === selectedId);
                                    const updated = [...currentPlan.plan.tasks];
                                    updated[idx].linkedSheetId = selectedId || undefined;
                                    updated[idx].linkedSheetName = selectedSheet?.name || undefined;
                                    updateLocalTasks(updated);
                                  }}
                                  className="text-[10px] font-semibold bg-dark-900/90 border border-white/15 rounded-md px-1.5 py-0.5 text-cyan-300 focus:border-cyan-400 focus:outline-none cursor-pointer max-w-[140px] truncate"
                                >
                                  <option value="" className="text-dark-400">Auto (Platform Sync)</option>
                                  {sheets.map((s) => (
                                    <option key={s._id} value={s._id} className="text-white bg-dark-900">
                                      📊 {s.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Duration & Delete */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                            <input
                              type="number"
                              min="5"
                              max="300"
                              step="5"
                              value={t.duration}
                              onChange={(e) => {
                                const updated = [...currentPlan.plan.tasks];
                                updated[idx].duration = Number(e.target.value);
                                updateLocalTasks(updated);
                              }}
                              className="w-10 bg-transparent text-xs font-mono text-center text-neon-green font-bold outline-none"
                            />
                            <span className="text-[10px] text-dark-400">min</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteTask(idx)}
                            className="p-1.5 text-dark-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Remove task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* ── STEP 5: ACTIVE SESSION RUNNER ─────────────────────────────── */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {step === 'session' && currentPlan?.plan && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto w-full space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Clock & Actions */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Header Clock */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-dark-950 to-dark-900 border border-neon-green/30 text-center space-y-4 relative overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between text-xs text-dark-400">
                      <div className="flex items-center gap-1.5 text-neon-green font-semibold">
                        <span className="w-2 h-2 rounded-full bg-neon-green animate-ping" />
                        <span>SESSION ACTIVE • NON-STOP</span>
                      </div>
                      <span>Mode: <strong className="capitalize text-white">{currentPlan.mode}</strong></span>
                    </div>

                    <div className="font-mono text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-widest drop-shadow-[0_0_25px_rgba(57,255,20,0.35)] py-2">
                      {formatCountdown(remainingSeconds)}
                    </div>

                    <p className="text-xs text-dark-300 font-medium">
                      {currentPlan.plan.title}
                    </p>

                    {/* Progress bar */}
                    <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-neon-green to-emerald-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            currentPlan.plan.tasks?.length > 0
                              ? Math.round(
                                  ((currentPlan.plan.tasks.filter((t) => t.completed).length) /
                                    currentPlan.plan.tasks.length) *
                                    100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Monitored Sheets Bar */}
                  {currentPlan.sheetSnapshotsStart?.length > 0 && (
                    <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div>
                          <span className="font-bold text-white">Live Sheet Monitoring: </span>
                          <span className="text-cyan-300">
                            {currentPlan.sheetSnapshotsStart.map((s) => s.sheetName).join(', ')}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200 font-mono font-bold shrink-0">
                        Syncing
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={endSession}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600/90 to-rose-600/90 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-lg shadow-red-500/20 border border-red-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Finish Session & View Report 🏁</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('edit')}
                      className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-dark-300 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Adjust Plan / Add Tasks
                    </button>
                  </div>
                </div>

                {/* Right Column: Task Checklist */}
                <div className="lg:col-span-7 space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <h4 className="text-xs font-bold text-dark-400 uppercase tracking-wider">
                      Task Checklist ({currentPlan.plan.tasks?.filter((t) => t.completed).length} / {currentPlan.plan.tasks?.length} Done)
                    </h4>
                    <span className="text-[11px] text-neon-green">Check off as you complete</span>
                  </div>

                  <div
                    className={`space-y-2 overflow-y-auto pr-1 scrollbar-thin ${
                      isFullScreen ? 'max-h-[calc(100vh-230px)]' : 'max-h-72'
                    }`}
                  >
                    {currentPlan.plan.tasks?.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleTaskCheckClick(t)}
                        className={`cursor-pointer flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                          t.completed
                            ? 'bg-neon-green/10 border-neon-green/30 text-dark-300'
                            : 'bg-dark-800/80 border-white/10 hover:border-white/20 text-white shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                              t.completed
                                ? 'bg-neon-green border-neon-green text-black font-bold'
                                : 'border-white/30 hover:border-white'
                            }`}
                          >
                            {t.completed && <Check className="w-3.5 h-3.5" />}
                          </button>
                          <span className="text-base">{t.icon || '📝'}</span>
                          <div className="min-w-0">
                            <span
                              className={`text-xs font-semibold truncate block ${
                                t.completed ? 'line-through text-dark-400' : 'text-white'
                              }`}
                            >
                              {t.title}
                            </span>
                            <span className="text-[10px] text-dark-400 font-mono">{t.time}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {t.linkedSheetName && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-medium">
                              📊 {t.linkedSheetName}
                            </span>
                          )}
                          <span className="text-[10px] text-dark-400 font-mono">{t.duration}m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* ── STEP 6: POST-SESSION MOTIVATIONAL REPORT ───────────────────── */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {step === 'report' && currentPlan?.report && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 text-center py-2"
            >
              {/* Typography Animation Sequence */}
              <div className="space-y-3 py-2">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="inline-block text-4xl"
                >
                  🎉
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-emerald-300 to-cyan-400"
                >
                  Give yourself a pat on your back! 👏
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-sm font-medium text-dark-200 max-w-lg mx-auto"
                >
                  "Not everyone clears the first step of planning things out. Vision is not clear until you write it down and execute."
                </motion.p>
              </div>

              {/* Stats Metrics Dashboard */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-neon-green font-mono">
                    {currentPlan.report.totalTasksCompleted} / {currentPlan.report.totalTasksPlanned}
                  </div>
                  <div className="text-[11px] text-dark-400 mt-1 font-semibold">Tasks Completed</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">
                    +{currentPlan.report.problemsSolvedDelta || 0}
                  </div>
                  <div className="text-[11px] text-dark-400 mt-1 font-semibold">Problems Solved</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                    +{currentPlan.report.revisionsDelta || 0}
                  </div>
                  <div className="text-[11px] text-dark-400 mt-1 font-semibold">Revisions Marked</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-pink-400 font-mono">
                    {currentPlan.report.focusScore || 0}%
                  </div>
                  <div className="text-[11px] text-dark-400 mt-1 font-semibold">Focus Score</div>
                </div>
              </div>

              {/* Sheet Monitoring Breakdown */}
              {currentPlan.report.sheetsMonitored?.length > 0 && (
                <div className="text-left space-y-2 p-4 rounded-2xl bg-dark-950/60 border border-white/10">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-neon-green" /> Monitored Sheets Activity
                  </h4>
                  <div className="space-y-1.5">
                    {currentPlan.report.sheetsMonitored.map((s, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-2 rounded-lg bg-white/5 text-xs"
                      >
                        <span className="font-semibold text-white">{s.sheetName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-mono">
                            +{s.solvedDelta} solved
                          </span>
                          <span className="text-amber-400 font-mono">
                            +{s.revisionDelta} revisions
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => repeatPlan(currentPlan)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-neon-green via-emerald-400 to-cyan-400 text-black font-extrabold text-xs shadow-lg shadow-neon-green/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> Let's do this again 🔁
                </button>
                <button
                  type="button"
                  onClick={createNewPlan}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  + New Plan ✨
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-3 rounded-xl bg-transparent hover:bg-white/5 text-dark-300 hover:text-white text-xs transition-all cursor-pointer"
                >
                  Back to Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* ── STEP 7: PAST SESSIONS HISTORY ─────────────────────────────── */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {step === 'history' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto w-full space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-neon-green" /> Past Study Sessions
                </h3>
                <button
                  onClick={() => setStep('greeting')}
                  className="px-3 py-1 rounded-lg bg-neon-green text-black text-xs font-bold hover:bg-neon-green/90 cursor-pointer"
                >
                  + New Session
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="text-center py-10 text-dark-400 text-xs">
                  Loading past sessions...
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-10 text-dark-400 text-xs">
                  No completed sessions yet. Start your first session today!
                </div>
              ) : (
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1 scrollbar-thin ${
                    isFullScreen ? 'max-h-[calc(100vh-230px)]' : 'max-h-96'
                  }`}
                >
                  {history.map((h) => (
                    <div
                      key={h._id}
                      className="p-4 rounded-2xl bg-dark-800/80 border border-white/10 space-y-3 hover:border-white/20 transition-all flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-white">
                            {h.plan?.title || 'Study Session'}
                          </h4>
                          <span className="text-[11px] text-dark-400">
                            {new Date(h.createdAt).toLocaleDateString()} • {h.totalHours} hrs • Mode:{' '}
                            <strong className="text-neon-green capitalize">{h.mode}</strong>
                          </span>
                        </div>
                        {h.report && (
                          <div className="text-right">
                            <span className="text-xs font-bold text-neon-green font-mono">
                              {h.report.focusScore}% Focus
                            </span>
                            <div className="text-[10px] text-dark-400">
                              {h.report.totalTasksCompleted}/{h.report.totalTasksPlanned} tasks
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Let's do this again button */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-white/10 mt-auto">
                        <span className="text-[10px] text-dark-400 font-mono truncate max-w-[180px]">
                          {h.plan?.tasks?.length || 0} tasks • {h.subjects?.map((s) => s.name).join(', ') || 'General DSA'}
                        </span>
                        <button
                          type="button"
                          onClick={() => repeatPlan(h)}
                          className="px-3 py-1.5 rounded-xl bg-neon-green text-black text-xs font-extrabold shadow-sm hover:brightness-110 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Let's do this again 🔁
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── MATRIX GLITCH EASTER EGG POPUP ────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {glitchModalData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl select-none"
          >
            {/* Matrix Digital Scanlines Backdrop */}
            <div className="absolute inset-0 bg-[radial-gradient(#00FF66_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 20 }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative max-w-md w-full p-6 sm:p-7 rounded-3xl bg-dark-950/95 border-2 border-emerald-500/50 shadow-[0_0_60px_rgba(0,255,102,0.3)] text-center space-y-5 overflow-hidden"
            >
              {/* Pulsing Status Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/40 text-emerald-400 font-mono text-[11px] font-bold tracking-widest uppercase animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Matrix Anomaly Detected</span>
              </div>

              <div className="space-y-2">
                <div className="text-4xl">🕶️ 💊</div>
                <h3 className="text-xl font-mono font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 tracking-tight">
                  Is there a glitch in the Matrix or what?
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-black/80 border border-emerald-500/20 font-mono text-xs text-left space-y-2.5">
                <div className="text-emerald-400/80 text-[10px]">&gt; ERROR: TEMPORAL FLOW MISMATCH</div>
                <div className="text-white text-xs leading-relaxed">
                  Timer says only <span className="text-emerald-400 font-extrabold underline">{glitchModalData.elapsedMinutes} minute{glitchModalData.elapsedMinutes === 1 ? '' : 's'}</span> {glitchModalData.elapsedMinutes === 0 ? 'have barely' : 'have'} passed, but you're checking off a task that requires <span className="text-pink-400 font-extrabold underline">{glitchModalData.taskDuration} minutes</span>:
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-emerald-300 font-bold flex items-center gap-2">
                  <span>{glitchModalData.task.icon || '📝'}</span>
                  <span className="truncate flex-1">{glitchModalData.task.title}</span>
                  <span className="text-[10px] text-dark-400 font-mono">({glitchModalData.taskDuration}m)</span>
                </div>
                <div className="text-amber-300 text-[11px] pt-1">
                  Are there any other pills except <span className="text-rose-400 font-bold">Red</span> and <span className="text-cyan-400 font-bold">Blue</span>? 🤔
                </div>
              </div>

              {/* Pill Choices */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    toggleTask(glitchModalData.task.id);
                    setGlitchModalData(null);
                    toast('🔴 Red Pill taken. Reality bent.', { icon: '🕶️' });
                  }}
                  className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-mono font-bold text-xs shadow-lg shadow-red-500/30 border border-red-400/50 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🔴 Red Pill (I'm that fast)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGlitchModalData(null)}
                  className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-mono font-bold text-xs shadow-lg shadow-cyan-500/30 border border-cyan-400/50 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🔵 Blue Pill (Back to reality)</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DailyPlannerModal;
