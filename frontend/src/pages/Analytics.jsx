import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  Target, Code, BookOpen, Zap, Globe, Clock,
  TrendingUp, CheckCircle2, AlertCircle, RotateCcw, ListTodo,
  Flame, Award, Timer, ArrowUpRight, ChevronRight,
  BarChart3, PieChartIcon, Activity, Layers, Trophy, ExternalLink, RefreshCw, Code2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useProblemStore from '../store/problemStore';
import useSheetStore from '../store/sheetStore';
import { useAuthStore } from '../store/authStore';
import { useAnalyticsStore } from '../store/analyticsStore';
import {
  LeetCodeStatsWidget,
  CodeforcesStatsWidget,
  CodeChefStatsWidget,
  CodeChefRatingWidget,
  LeetCodeRatingWidget,
  CodeforcesRatingWidget,
} from '../components/dashboard/Widgets';
import GlassCard from '../components/ui/GlassCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// ── Color Palette & Theme Tokens ─────────────────────────────────────────
const THEME_CHART_COLORS = [
  'var(--color-accent, #6366f1)',
  'rgb(var(--color-accent-rgb) / 0.75)',
  'rgb(var(--color-accent-rgb) / 0.5)',
  'rgb(var(--color-accent-rgb) / 0.3)',
  'rgba(255, 255, 255, 0.25)',
];

const DIFFICULTY_COLORS = { easy: '#10b981', medium: '#f59e0b', hard: '#f43f5e', unknown: '#64748b' };
const STATUS_CONFIG = {
  solved: { color: 'var(--color-accent, #6366f1)', icon: CheckCircle2, label: 'Solved' },
  attempted: { color: 'rgba(var(--color-accent-rgb), 0.75)', icon: AlertCircle, label: 'Attempted' },
  revisit: { color: 'rgba(var(--color-accent-rgb), 0.5)', icon: RotateCcw, label: 'Revisit' },
  todo: { color: 'rgba(255, 255, 255, 0.25)', icon: ListTodo, label: 'Todo' },
};

// ── Helper: Day of week label ──
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ── Custom Recharts Tooltip ──
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-900/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-dark-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold text-white">
          {p.name}: <span className="text-neon-green">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ── Stat Card Component ──
const StatCard = ({ icon: Icon, label, value, sub, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="glass-card p-4 md:p-5 flex items-center gap-4 group hover:border-white/20 transition-all"
  >
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-neon-green/10 border border-neon-green/25 text-neon-green transition-transform group-hover:scale-105"
    >
      <Icon size={20} />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs text-dark-400 truncate">{label}</p>
      {sub && <p className="text-[11px] mt-0.5 text-dark-300 font-medium">{sub}</p>}
    </div>
  </motion.div>
);

// ── Sheet Progress Card ──
const SheetCard = ({ sheet, index }) => {
  const pct = sheet.totalProblems > 0
    ? Math.round((sheet.solvedProblems / sheet.totalProblems) * 100)
    : 0;
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const accentColor = 'var(--color-accent, #6366f1)';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="glass-card p-5 min-w-[260px] max-w-[300px] flex-shrink-0 hover:border-white/20 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-white truncate">{sheet.name}</h3>
          <span
            className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
            style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}30` }}
          >
            {sheet.category}
          </span>
        </div>

        {/* Circular Progress */}
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
            <circle
              cx="40" cy="40" r="36" fill="none"
              stroke={accentColor}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-white">{pct}%</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
        <span>{sheet.solvedProblems} / {sheet.totalProblems} solved</span>
        <span>{sheet.topics?.length || 0} topics</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay: index * 0.1 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)` }}
        />
      </div>

      {/* Target Date */}
      {sheet.targetDate && (
        <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1">
          <Target size={11} />
          Target: {new Date(sheet.targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
    </motion.div>
  );
};

// ── Activity Heatmap ──
const ActivityHeatmap = ({ problems }) => {
  // Build week-column data aligned to proper weekday rows (Sun=0 ... Sat=6)
  const { weeks, monthLabels, totalActive, totalSolved } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const numWeeks = 20;

    // Count problems per date
    const dateMap = {};
    problems.forEach(p => {
      const d = p.solvedAt || p.createdAt;
      if (!d) return;
      const key = new Date(d).toISOString().split('T')[0];
      dateMap[key] = (dateMap[key] || 0) + 1;
    });

    // Find the start: go back numWeeks weeks, align to Sunday
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (numWeeks * 7) + 1);
    // Align start to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const weeksArr = [];
    const monthLabelsArr = [];
    let currentDate = new Date(startDate);
    let totalAct = 0;
    let totalSol = 0;
    let lastMonth = -1;

    while (currentDate <= endDate) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateClone = new Date(currentDate);
        if (dateClone > endDate) {
          week.push(null);
        } else {
          const key = dateClone.toISOString().split('T')[0];
          const count = dateMap[key] || 0;
          const level = count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4;
          if (count > 0) { totalAct++; totalSol += count; }

          // Track month labels at start of each new month
          const month = dateClone.getMonth();
          if (month !== lastMonth && d === 0) {
            monthLabelsArr.push({ label: MONTH_LABELS[month], weekIdx: weeksArr.length });
            lastMonth = month;
          } else if (month !== lastMonth && weeksArr.length === 0) {
            monthLabelsArr.push({ label: MONTH_LABELS[month], weekIdx: weeksArr.length });
            lastMonth = month;
          }

          week.push({ date: key, count, level, dayOfWeek: d });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeksArr.push(week);
    }

    return { weeks: weeksArr, monthLabels: monthLabelsArr, totalActive: totalAct, totalSolved: totalSol };
  }, [problems]);

  const levelColors = ['rgba(255,255,255,0.04)', 'rgb(var(--color-accent-rgb) / 0.3)', 'rgb(var(--color-accent-rgb) / 0.55)', 'rgb(var(--color-accent-rgb) / 0.8)', 'var(--color-accent, #6366f1)'];
  const tileSize = 'minmax(12px, 1fr)';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity size={20} className="text-neon-green" />
            Problem Solving Activity
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {totalSolved} problems across {totalActive} active days (last 20 weeks)
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span>Less</span>
          {levelColors.map((c, i) => (
            <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="w-full">
        {/* Month labels row */}
        <div className="flex mb-1" style={{ paddingLeft: '32px' }}>
          <div
            className="flex-1 grid gap-[3px]"
            style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}
          >
            {weeks.map((_, weekIdx) => {
              const monthLabel = monthLabels.find(m => m.weekIdx === weekIdx);
              return (
                <div key={weekIdx} className="text-[10px] text-gray-500 truncate leading-none">
                  {monthLabel?.label || ''}
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid: day labels + tiles */}
        <div className="flex gap-0 w-full">
          {/* Day-of-week labels */}
          <div className="flex flex-col gap-[3px] shrink-0 w-8">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
              <div key={i} className="h-[16px] text-[10px] text-gray-600 flex items-center leading-none">
                {i % 2 === 1 ? d : ''}
              </div>
            ))}
          </div>

          {/* Heatmap tile grid — stretches to fill remaining width */}
          <div
            className="flex-1 grid gap-[3px]"
            style={{
              gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
              gridTemplateRows: 'repeat(7, 16px)',
            }}
          >
            {/* Render row by row (day 0-6) across all weeks */}
            {[0, 1, 2, 3, 4, 5, 6].map(dayIdx =>
              weeks.map((week, weekIdx) => {
                const day = week[dayIdx];
                if (!day) return <div key={`${dayIdx}-${weekIdx}`} className="rounded-sm" />;
                return (
                  <div
                    key={`${dayIdx}-${weekIdx}`}
                    className="rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-white/40 hover:brightness-125"
                    style={{ background: levelColors[day.level] }}
                    title={`${day.date}: ${day.count} problem${day.count !== 1 ? 's' : ''}`}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// ── MAIN ANALYTICS COMPONENT ──
// ══════════════════════════════════════════════════════════════════════════
const Analytics = () => {
  const { user } = useAuthStore();
  const { problems, fetchProblems, loading: problemsLoading } = useProblemStore();
  const { sheets, fetchSheets, loading: sheetsLoading } = useSheetStore();
  const [isLoaded, setIsLoaded] = useState(false);

  const {
    leetcodeStats,
    codeforcesStats,
    codechefStats,
    isPlatformLoading,
    fetchLeetCodeStats,
    fetchCodeforcesStats,
    fetchCodechefStats,
  } = useAnalyticsStore();

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchProblems({ limit: 5000 }),
        fetchSheets(true),
      ]);
      setIsLoaded(true);
    };
    loadData();
  }, [fetchProblems, fetchSheets]);

  useEffect(() => {
    if (user?.leetcodeHandle) fetchLeetCodeStats(user.leetcodeHandle);
    if (user?.codeforcesHandle) fetchCodeforcesStats(user.codeforcesHandle);
    if (user?.codechefHandle) fetchCodechefStats(user.codechefHandle);
  }, [user, fetchLeetCodeStats, fetchCodeforcesStats, fetchCodechefStats]);

  // ── Journey Stats ──
  const journeyStats = useMemo(() => {
    const startDate = user?.startDate ? new Date(user.startDate) : new Date();
    const now = new Date();
    const dayNumber = Math.max(1, Math.floor((now - startDate) / (1000 * 60 * 60 * 24)) + 1);
    const totalProblems = problems.length;
    const totalSheetProblems = sheets.reduce((s, sh) => s + (sh.totalProblems || 0), 0);
    const solvedSheetProblems = sheets.reduce((s, sh) => s + (sh.solvedProblems || 0), 0);
    const sheetPct = totalSheetProblems > 0 ? Math.round((solvedSheetProblems / totalSheetProblems) * 100) : 0;
    const avgPerDay = dayNumber > 0 ? (totalProblems / dayNumber).toFixed(1) : '0';

    // Unique languages
    const langSet = new Set();
    problems.forEach(p => {
      (p.solutions || []).forEach(s => { if (s.language) langSet.add(s.language); });
      if (p.language) langSet.add(p.language);
    });

    return { dayNumber, totalProblems, sheetPct, solvedSheetProblems, totalSheetProblems, avgPerDay, langCount: langSet.size };
  }, [user, problems, sheets]);

  // ── Difficulty Breakdown ──
  const difficultyData = useMemo(() => {
    const counts = { easy: 0, medium: 0, hard: 0, unknown: 0 };
    problems.forEach(p => { counts[p.difficulty || 'unknown']++; });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, color: DIFFICULTY_COLORS[name] }));
  }, [problems]);

  // ── Language Distribution ──
  const languageData = useMemo(() => {
    const langMap = {};
    problems.forEach(p => {
      (p.solutions || []).forEach(s => {
        if (s.language) langMap[s.language] = (langMap[s.language] || 0) + 1;
      });
      if (p.language && !(p.solutions?.length)) langMap[p.language] = (langMap[p.language] || 0) + 1;
    });
    return Object.entries(langMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value], i) => ({
        name: name === 'cpp' ? 'C++' : name === 'javascript' ? 'JS' : name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: THEME_CHART_COLORS[i % THEME_CHART_COLORS.length],
      }));
  }, [problems]);

  // ── Status Pipeline ──
  const statusData = useMemo(() => {
    const counts = { solved: 0, attempted: 0, revisit: 0, todo: 0 };
    problems.forEach(p => { counts[p.status || 'solved']++; });
    const total = problems.length || 1;
    return Object.entries(counts).map(([key, value]) => ({
      key,
      ...STATUS_CONFIG[key],
      value,
      pct: Math.round((value / total) * 100),
    }));
  }, [problems]);

  // ── Tag / Topic Cloud ──
  const tagData = useMemo(() => {
    const tagMap = {};
    // First try problem tags
    problems.forEach(p => {
      (p.tags || []).forEach(t => { tagMap[t] = (tagMap[t] || 0) + 1; });
    });
    // If no tags found, pull from sheet topics instead
    if (Object.keys(tagMap).length === 0) {
      sheets.forEach(sh => {
        (sh.topics || []).forEach(t => {
          if (t.name && t.solvedProblems > 0) {
            tagMap[t.name] = (tagMap[t.name] || 0) + (t.solvedProblems || 0);
          }
        });
      });
    }
    return Object.entries(tagMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));
  }, [problems, sheets]);

  // ── Best Day of Week ──
  const dayOfWeekData = useMemo(() => {
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    problems.forEach(p => {
      const d = p.solvedAt || p.createdAt;
      if (d) dayCounts[new Date(d).getDay()]++;
    });
    const max = Math.max(...dayCounts, 1);
    return DAY_LABELS.map((label, i) => ({ label, count: dayCounts[i], pct: Math.round((dayCounts[i] / max) * 100) }));
  }, [problems]);

  // ── Time Analysis ──
  const timeAnalysis = useMemo(() => {
    const byDiff = { easy: [], medium: [], hard: [] };
    problems.forEach(p => {
      if (p.timeSpent && p.timeSpent > 0 && byDiff[p.difficulty]) {
        byDiff[p.difficulty].push(p.timeSpent);
      }
    });
    const avg = (arr) => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;
    const hasTimeData = Object.values(byDiff).some(a => a.length > 0);

    // Fastest solves
    const fastest = problems
      .filter(p => p.timeSpent && p.timeSpent > 0 && p.status === 'solved')
      .sort((a, b) => a.timeSpent - b.timeSpent)
      .slice(0, 5);

    return {
      hasTimeData,
      avgByDifficulty: [
        { name: 'Easy', avg: avg(byDiff.easy), color: DIFFICULTY_COLORS.easy, count: byDiff.easy.length },
        { name: 'Medium', avg: avg(byDiff.medium), color: DIFFICULTY_COLORS.medium, count: byDiff.medium.length },
        { name: 'Hard', avg: avg(byDiff.hard), color: DIFFICULTY_COLORS.hard, count: byDiff.hard.length },
      ],
      fastest,
    };
  }, [problems]);

  // ── Problem Sources Data ──
  const sourceData = useMemo(() => {
    const counts = { 'Manual Log': 0, 'TrackEx Extension': 0, 'GitHub Sync': 0, 'Sheet / Study Plan': 0 };
    problems.forEach(p => {
      if (p.sheet || p.sheetProblem) {
        counts['Sheet / Study Plan']++;
      } else if (p.source === 'track-ex') {
        counts['TrackEx Extension']++;
      } else if (p.source === 'github-sync') {
        counts['GitHub Sync']++;
      } else {
        counts['Manual Log']++;
      }
    });
    return Object.entries(counts)
      .filter(([, val]) => val > 0)
      .map(([name, value], i) => ({
        name,
        value,
        color: THEME_CHART_COLORS[i % THEME_CHART_COLORS.length],
      }));
  }, [problems]);

  // ── Radar Chart Data ──
  const radarData = useMemo(() => {
    const counts = { Easy: 0, Medium: 0, Hard: 0 };
    problems.forEach(p => {
      if (p.difficulty === 'easy') counts.Easy++;
      else if (p.difficulty === 'medium') counts.Medium++;
      else if (p.difficulty === 'hard') counts.Hard++;
    });
    return Object.entries(counts).map(([subject, value]) => ({ subject, value, fullMark: Math.max(...Object.values(counts), 1) * 1.2 }));
  }, [problems]);

  const isLoading = !isLoaded || problemsLoading || sheetsLoading;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const activeSheets = sheets.filter(s => s.isActive !== false);
  const tagColors = THEME_CHART_COLORS;

  return (
    <div className="space-y-6 pb-8">

      {/* ═══ Section 1: Journey Stats Bar ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={Target} label="Journey Day" value={`Day ${journeyStats.dayNumber}`} sub="of 75 days" delay={0} />
        <StatCard icon={Code} label="Problems Logged" value={journeyStats.totalProblems} sub={`${journeyStats.avgPerDay}/day avg`} delay={0.05} />
        <StatCard icon={BookOpen} label="Sheets Progress" value={`${journeyStats.sheetPct}%`} sub={`${journeyStats.solvedSheetProblems}/${journeyStats.totalSheetProblems} solved`} delay={0.1} />
        <StatCard icon={Zap} label="Avg / Day" value={journeyStats.avgPerDay} sub="problems per day" delay={0.15} />
        <StatCard icon={Globe} label="Languages" value={journeyStats.langCount} sub="coding languages used" delay={0.2} />
      </div>

      {/* ═══ Section 2: Sheet Progress Cards ═══ */}
      {activeSheets.length > 0 && (
        <GlassCard hover={false} padding="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen size={20} className="text-neon-green" />
              Sheet Progress Overview
            </h2>
            <span className="text-xs text-gray-500">{activeSheets.length} active sheets</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
            {activeSheets.map((sheet, i) => (
              <SheetCard key={sheet._id} sheet={sheet} index={i} />
            ))}
          </div>
        </GlassCard>
      )}

      {/* ═══ Section 3: Radar + Language Distribution ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Difficulty Mastery Radar */}
        <GlassCard hover={false} padding="p-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <PieChartIcon size={20} className="text-neon-green" />
            Difficulty Mastery
          </h3>
          {difficultyData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData} cx="50%" cy="50%">
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 13, fontWeight: 600 }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar name="Problems" dataKey="value" stroke="var(--color-accent, #6366f1)" fill="var(--color-accent, #6366f1)" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex gap-4 mt-2">
                {difficultyData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs text-gray-400">{d.name}: <strong className="text-white">{d.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No problem data yet</div>
          )}
        </GlassCard>

        {/* Language Distribution Donut */}
        <GlassCard hover={false} padding="p-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Globe size={20} className="text-neon-green" />
            Language Distribution
          </h3>
          {languageData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={languageData}
                    cx="50%" cy="50%"
                    innerRadius={65} outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={200} animationDuration={800}
                  >
                    {languageData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {languageData.map(l => (
                  <div key={l.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                    <span className="text-xs text-gray-400">{l.name}: <strong className="text-white">{l.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No solution data yet</div>
          )}
        </GlassCard>
      </div>

      {/* ═══ Section 4: Status Pipeline + Tag Cloud ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Pipeline */}
        <GlassCard hover={false} padding="p-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
            <TrendingUp size={20} className="text-neon-green" />
            Problem Status Pipeline
          </h3>
          <div className="space-y-4">
            {statusData.map((s, i) => {
              const IconComp = s.icon;
              return (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                    <IconComp size={16} style={{ color: s.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-300">{s.label}</span>
                      <span className="text-sm font-bold text-white">{s.value} <span className="text-xs text-gray-500">({s.pct}%)</span></span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.15 }}
                        className="h-full rounded-full"
                        style={{ background: s.color }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </GlassCard>

        {/* Tag / Topic Cloud */}
        <GlassCard hover={false} padding="p-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
            <BarChart3 size={20} className="text-neon-green" />
            Most Practiced Topics
          </h3>
          {tagData.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tagData.map((t, i) => {
                const color = THEME_CHART_COLORS[i % THEME_CHART_COLORS.length];
                const maxCount = tagData[0]?.count || 1;
                return (
                  <motion.div
                    key={t.tag}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 20 }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-default transition-all hover:scale-105"
                    style={{
                      background: `rgba(var(--color-accent-rgb), 0.1)`,
                      border: `1px solid rgba(var(--color-accent-rgb), 0.25)`,
                      color: 'var(--color-accent)',
                      fontSize: `${Math.max(11, 11 + (t.count / maxCount) * 4)}px`,
                    }}
                    title={`${t.tag}: ${t.count} problems`}
                  >
                    {t.tag}
                    <span className="ml-1.5 opacity-60">{t.count}</span>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
              No tags found. Add tags to your problems to see topic analysis.
            </div>
          )}
        </GlassCard>
      </div>

      {/* ═══ Section 5: Activity Heatmap + Day of Week ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Heatmap */}
        <GlassCard hover={false} padding="p-5">
          <ActivityHeatmap problems={problems} />
        </GlassCard>

        {/* Best Day of Week (1/3 width) */}
        <GlassCard hover={false} padding="p-5" className="self-start">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Flame size={20} className="text-neon-green" />
            Best Days
          </h3>
          <div className="space-y-3">
            {dayOfWeekData.map((d, i) => {
              const isMax = d.pct === 100 && d.count > 0;
              return (
                <div key={d.label} className="flex items-center gap-3">
                  <span className={`text-xs font-mono w-8 ${isMax ? 'text-neon-green font-bold' : 'text-gray-500'}`}>
                    {d.label}
                  </span>
                  <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${d.pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.08 }}
                      className="h-full rounded-full"
                      style={{
                        background: isMax
                          ? 'var(--color-accent, #6366f1)'
                          : 'rgba(var(--color-accent-rgb), 0.2)',
                      }}
                    />
                  </div>
                  <span className={`text-xs font-bold w-6 text-right ${isMax ? 'text-neon-green' : 'text-gray-400'}`}>
                    {d.count}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* ═══ Section 6: Time & Efficiency Analysis ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Avg Time + Problem Sources */}
        <div className="space-y-4">
          {/* Avg Time by Difficulty */}
          <GlassCard hover={false} padding="p-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Timer size={20} className="text-neon-green" />
              Avg Solve Time by Difficulty
            </h3>
            {timeAnalysis.hasTimeData ? (
              <div className="space-y-4 mt-2">
                {timeAnalysis.avgByDifficulty.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <div className="w-16 text-xs font-semibold" style={{ color: d.color }}>{d.name}</div>
                    <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (d.avg / Math.max(...timeAnalysis.avgByDifficulty.map(x => x.avg), 1)) * 100)}%` }}
                        transition={{ duration: 0.8, delay: i * 0.15 }}
                        className="h-full rounded-lg flex items-center justify-end pr-2"
                        style={{ background: `${d.color}30`, borderRight: `3px solid ${d.color}` }}
                      >
                        <span className="text-[11px] font-bold text-white">{d.avg} min</span>
                      </motion.div>
                    </div>
                    <span className="text-[11px] text-gray-500 w-14 text-right">{d.count} solves</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500 gap-3">
                <Clock size={28} className="opacity-30" />
                <div className="text-center">
                  <p className="text-sm">No time data yet</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Time is automatically tracked when you open a problem link and mark it solved in Sheets.
                  </p>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Problem Sources */}
          <GlassCard hover={false} padding="p-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Layers size={20} className="text-neon-green" />
              Problem Sources
            </h3>
            {sourceData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-1/2 h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%" cy="50%"
                        innerRadius={35} outerRadius={60}
                        paddingAngle={3}
                        dataKey="value"
                        animationBegin={200} animationDuration={800}
                      >
                        {sourceData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 space-y-2">
                  {sourceData.map(s => {
                    const total = problems.length || 1;
                    const pct = Math.round((s.value / total) * 100);
                    return (
                      <div key={s.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                          <span className="text-gray-300 truncate">{s.name}</span>
                        </div>
                        <span className="font-bold text-white ml-2">{s.value} <span className="text-gray-500 font-normal">({pct}%)</span></span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-36 text-gray-500 text-sm">No problem sources found</div>
            )}
          </GlassCard>
        </div>

        {/* Fastest Solves */}
        <GlassCard hover={false} padding="p-5" className="self-start">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Award size={20} className="text-neon-green" />
            Fastest Solves
          </h3>
          {timeAnalysis.fastest.length > 0 ? (
            <div className="space-y-2.5">
              {timeAnalysis.fastest.map((p, i) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                    i === 0 ? 'bg-white/15 text-white border border-white/20' :
                    i === 1 ? 'bg-white/10 text-dark-300 border border-white/10' :
                    i === 2 ? 'bg-white/5 text-dark-400 border border-white/5' :
                    'bg-white/5 text-dark-500 border border-white/5'
                  }`}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-200 truncate">{p.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                        style={{ background: `${DIFFICULTY_COLORS[p.difficulty]}20`, color: DIFFICULTY_COLORS[p.difficulty] }}>
                        {p.difficulty}
                      </span>
                      {p.platform && (
                        <span className="text-[10px] text-gray-500">{p.platform}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-neon-green">{p.timeSpent} min</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500 gap-3">
              <Award size={28} className="opacity-30" />
              <div className="text-center">
                <p className="text-sm">No timed solves yet</p>
                <p className="text-xs text-gray-600 mt-1">
                  Solve problems from Sheets to automatically track your speed.
                </p>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* ═══ Section 7: Competitive Programming & Platform Integrations ═══ */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Trophy className="w-6 h-6 text-neon-green" />
              Competitive Programming & Platform Integrations
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Live statistics, rating trajectories, and activity heatmaps from LeetCode, CodeChef, and Codeforces
            </p>
          </div>
          <Link
            to="/profile"
            className="text-xs font-semibold text-neon-green hover:text-white flex items-center gap-1 transition-colors bg-neon-green/10 hover:bg-neon-green/20 px-3 py-1.5 rounded-lg border border-neon-green/20"
          >
            Configure Handles <ExternalLink size={14} />
          </Link>
        </div>

        {!user?.leetcodeHandle && !user?.codeforcesHandle && !user?.codechefHandle ? (
          <GlassCard hover={false} padding="p-8">
            <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 py-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-500/20 via-orange-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                <Code2 className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">No Platforms Connected</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Connect your LeetCode, CodeChef, and Codeforces handles in Profile Settings to unlock live stats, rating histories, and activity heatmaps here.
                </p>
              </div>
              <Link
                to="/profile"
                className="px-5 py-2.5 bg-gradient-to-r from-neon-green to-emerald-500 text-dark-900 font-bold text-xs rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-neon-green/20"
              >
                Connect Platform Handles
              </Link>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            {/* Row 1: LeetCode (Heatmap + Problem Count | Rating Graph) */}
            {user?.leetcodeHandle && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                <LeetCodeStatsWidget
                  user={user}
                  leetcodeStats={leetcodeStats}
                  isPlatformLoading={isPlatformLoading}
                  fetchLeetCodeStats={fetchLeetCodeStats}
                />
                <LeetCodeRatingWidget
                  user={user}
                  leetcodeStats={leetcodeStats}
                />
              </div>
            )}

            {/* Row 2: CodeChef (Heatmap + Solved Count | Rating Graph) */}
            {user?.codechefHandle && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                <CodeChefStatsWidget
                  user={user}
                  codechefStats={codechefStats}
                  isPlatformLoading={isPlatformLoading}
                  fetchCodechefStats={fetchCodechefStats}
                />
                <CodeChefRatingWidget
                  user={user}
                  codechefStats={codechefStats}
                />
              </div>
            )}

            {/* Row 3: Codeforces (Stats | Rating Graph) */}
            {user?.codeforcesHandle && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                <CodeforcesStatsWidget
                  user={user}
                  codeforcesStats={codeforcesStats}
                  isPlatformLoading={isPlatformLoading}
                  fetchCodeforcesStats={fetchCodeforcesStats}
                />
                <CodeforcesRatingWidget
                  user={user}
                  codeforcesStats={codeforcesStats}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
