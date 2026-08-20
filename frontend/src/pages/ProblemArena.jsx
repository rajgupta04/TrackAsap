import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Code2,
  Search,
  CheckCircle2,
  Circle,
  Filter,
  Sparkles,
  Flame,
  ArrowUpRight,
  PlusCircle,
  BookOpen,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import judgeService from '../services/judgeService';

const DIFFICULTY_COLORS = {
  Easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Hard: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

const COMMON_TAGS = [
  'All',
  'Array',
  'String',
  'Dynamic Programming',
  'Math',
  'Tree',
  'Graph',
  'Two Pointers',
  'Binary Search',
  'Hash Table',
  'Greedy',
];

const ProblemArena = () => {
  const { user } = useAuthStore();
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // All | Solved | Unsolved

  const isSetterOrAdmin = user && (user.role === 'setter' || user.role === 'admin');

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setIsLoading(true);
      const res = await judgeService.getProblems();
      if (res.success) {
        setProblems(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load arena problems:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      // Search
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      // Difficulty
      const matchesDiff =
        selectedDifficulty === 'All' || p.difficulty === selectedDifficulty;

      // Tag
      const matchesTag =
        selectedTag === 'All' || p.tags.includes(selectedTag);

      // Status
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Solved' && p.isSolved) ||
        (statusFilter === 'Unsolved' && !p.isSolved);

      return matchesSearch && matchesDiff && matchesTag && matchesStatus;
    });
  }, [problems, searchQuery, selectedDifficulty, selectedTag, statusFilter]);

  const stats = useMemo(() => {
    const total = problems.length;
    const solved = problems.filter((p) => p.isSolved).length;
    const easyCount = problems.filter((p) => p.difficulty === 'Easy').length;
    const mediumCount = problems.filter((p) => p.difficulty === 'Medium').length;
    const hardCount = problems.filter((p) => p.difficulty === 'Hard').length;

    return { total, solved, easyCount, mediumCount, hardCount };
  }, [problems]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-28 md:pb-12 px-2 sm:px-4">
      {/* Streamlined Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-dark-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Flame className="w-6 h-6 text-neon-green" />
            Problem Arena
          </h1>
          <p className="text-dark-400 text-xs mt-1">
            Curated coding problems with official testcase evaluations.
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl bg-dark-950 border border-white/10 text-xs text-dark-300 flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-sm">
          <span className="text-neon-green font-bold">{stats.solved}</span> / {stats.total} Solved
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search problems by title or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-900/80 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder:text-dark-400 focus:outline-none focus:border-neon-green/60 transition shadow-inner"
          />
        </div>

        {/* Difficulty & Status Pills Row (Smooth Horizontal Touch Scroll on Mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {/* Difficulty Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer shrink-0 ${
                  selectedDifficulty === diff
                    ? 'bg-neon-green text-dark-950 border-neon-green shadow-sm shadow-neon-green/20'
                    : 'bg-dark-900/80 text-dark-300 border-white/10 hover:border-white/20'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-white/10 mx-1 shrink-0" />

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            {['All', 'Solved', 'Unsolved'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer shrink-0 ${
                  statusFilter === st
                    ? 'bg-white/20 text-white border-white/40 shadow-sm'
                    : 'bg-dark-900/80 text-dark-400 border-white/10 hover:border-white/20'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Topic Tags Horizontal Scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {COMMON_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1 rounded-full text-[11px] whitespace-nowrap transition border shrink-0 cursor-pointer ${
              selectedTag === tag
                ? 'bg-neon-green/15 text-neon-green border-neon-green/40 font-bold'
                : 'bg-dark-900/50 text-dark-400 border-white/5 hover:text-white hover:border-white/15'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Problems Container */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-dark-900/50 backdrop-blur-sm shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center text-dark-400 text-xs sm:text-sm animate-pulse">
            Loading problem arena...
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="p-12 text-center text-dark-400 space-y-3">
            <Code2 className="w-10 h-10 mx-auto text-dark-500" />
            <p className="text-sm">No problems found matching your filters.</p>
            {isSetterOrAdmin && (
              <Link
                to="/studio"
                className="inline-flex items-center gap-2 text-xs text-neon-green hover:underline"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Author the first problem in Studio
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* 📱 Mobile Problem Cards (Visible on screens < 768px) */}
            <div className="block md:hidden divide-y divide-white/5">
              {filteredProblems.map((prob, idx) => (
                <Link
                  key={prob._id}
                  to={`/solve/${prob.slug}`}
                  className="p-4 flex flex-col gap-2.5 hover:bg-white/[0.03] active:bg-white/[0.06] transition block"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="pt-0.5 shrink-0">
                        {prob.isSolved ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-dark-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white text-sm leading-snug">
                          {idx + 1}. {prob.title}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 uppercase tracking-wider ${
                        DIFFICULTY_COLORS[prob.difficulty] || DIFFICULTY_COLORS.Medium
                      }`}
                    >
                      {prob.difficulty}
                    </span>
                  </div>

                  {/* Tags & Acceptance Sub-row */}
                  <div className="flex items-center justify-between gap-2 pl-6.5 text-[11px] text-dark-400">
                    <div className="flex flex-wrap gap-1 min-w-0">
                      {prob.tags && prob.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-dark-400 border border-white/5 font-mono truncate"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 text-neon-green font-semibold shrink-0 text-xs">
                      <span>Solve</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* 💻 Desktop Problem Table (Visible on screens >= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.02] text-xs text-dark-400 uppercase tracking-wider font-medium">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">Status</th>
                    <th className="py-3.5 px-4">Title</th>
                    <th className="py-3.5 px-4 w-28">Difficulty</th>
                    <th className="py-3.5 px-4 w-32">Acceptance</th>
                    <th className="py-3.5 px-4 w-28 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProblems.map((prob, idx) => (
                    <tr
                      key={prob._id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Status Checkmark */}
                      <td className="py-4 px-4 text-center">
                        {prob.isSolved ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : (
                          <Circle className="w-4 h-4 text-dark-600 mx-auto" />
                        )}
                      </td>

                      {/* Title & Tags */}
                      <td className="py-4 px-4">
                        <Link
                          to={`/solve/${prob.slug}`}
                          className="font-medium text-white group-hover:text-neon-green transition-colors inline-flex items-center gap-1.5"
                        >
                          <span>{idx + 1}. {prob.title}</span>
                        </Link>
                        {prob.tags && prob.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {prob.tags.slice(0, 4).map((t) => (
                              <span
                                key={t}
                                className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-dark-400 border border-white/5"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Difficulty Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md border ${
                            DIFFICULTY_COLORS[prob.difficulty] || DIFFICULTY_COLORS.Medium
                          }`}
                        >
                          {prob.difficulty}
                        </span>
                      </td>

                      {/* Acceptance Rate */}
                      <td className="py-4 px-4 text-dark-300 text-xs">
                        <div>{prob.acceptanceRate}%</div>
                        <div className="text-[10px] text-dark-500">
                          {prob.totalSubmissions} submissions
                        </div>
                      </td>

                      {/* Solve Link */}
                      <td className="py-4 px-4 text-center">
                        <Link
                          to={`/solve/${prob.slug}`}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-neon-green hover:text-dark-950 text-dark-300 text-xs font-medium border border-white/10 hover:border-neon-green transition-all"
                        >
                          Solve
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProblemArena;
