import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Code,
  ExternalLink,
  Clock,
  Tag,
  Trash2,
  ChevronDown,
  BarChart3,
  StickyNote,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import useProblemStore from '../store/problemStore';
import GlassCard from '../components/ui/GlassCard';
import CodeViewer from '../components/CodeViewer';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const PLATFORM_COLORS = {
  leetcode: '#FFA116',
  codechef: '#5B4638',
  codeforces: '#1F8ACB',
  geeksforgeeks: '#2F8D46',
  hackerrank: '#00EA64',
  atcoder: '#222222',
  other: '#666666',
};

const DIFFICULTY_COLORS = {
  easy: '#00B8A3',
  medium: '#FFC01E',
  hard: '#FF375F',
  unknown: '#888888',
};

const Problems = () => {
  const { problems, stats, pagination, loading, fetchProblems, fetchStats, deleteProblem } =
    useProblemStore();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    platform: '',
    difficulty: '',
    status: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [notesModalProblem, setNotesModalProblem] = useState(null);

  useEffect(() => {
    fetchProblems({ page: currentPage, ...filters });
    fetchStats();
  }, [currentPage, filters]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this problem?')) {
      try {
        await deleteProblem(id);
        toast.success('Problem deleted');
      } catch (error) {
        toast.error('Failed to delete problem');
      }
    }
  };

  const filteredProblems = problems.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">My Problems</h1>
        <p className="text-sm md:text-base text-gray-400">View and manage all your solved problems</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6 md:mb-8">
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.total || 0}</p>
            <p className="text-xs text-gray-400">Total</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: DIFFICULTY_COLORS.easy }}>
              {stats.easy || 0}
            </p>
            <p className="text-xs text-gray-400">Easy</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: DIFFICULTY_COLORS.medium }}>
              {stats.medium || 0}
            </p>
            <p className="text-xs text-gray-400">Medium</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: DIFFICULTY_COLORS.hard }}>
              {stats.hard || 0}
            </p>
            <p className="text-xs text-gray-400">Hard</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-neon-green">
              {stats.totalTimeSpent ? Math.round(stats.totalTimeSpent / 60) : 0}h
            </p>
            <p className="text-xs text-gray-400">Time Spent</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">
              {stats.tagDistribution?.length || 0}
            </p>
            <p className="text-xs text-gray-400">Tags Used</p>
          </GlassCard>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-all ${
            showFilters
              ? 'border-neon-green bg-neon-green/10 text-neon-green'
              : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'
          }`}
        >
          <Filter className="w-5 h-5" />
          Filters
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filter Options */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <GlassCard className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Platform</label>
                  <select
                    value={filters.platform}
                    onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-neon-green outline-none"
                  >
                    <option value="" className="bg-gray-900">All Platforms</option>
                    <option value="leetcode" className="bg-gray-900">LeetCode</option>
                    <option value="codechef" className="bg-gray-900">CodeChef</option>
                    <option value="codeforces" className="bg-gray-900">Codeforces</option>
                    <option value="geeksforgeeks" className="bg-gray-900">GeeksforGeeks</option>
                    <option value="hackerrank" className="bg-gray-900">HackerRank</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Difficulty</label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-neon-green outline-none"
                  >
                    <option value="" className="bg-gray-900">All Difficulties</option>
                    <option value="easy" className="bg-gray-900">Easy</option>
                    <option value="medium" className="bg-gray-900">Medium</option>
                    <option value="hard" className="bg-gray-900">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-neon-green outline-none"
                  >
                    <option value="" className="bg-gray-900">All Status</option>
                    <option value="solved" className="bg-gray-900">Solved</option>
                    <option value="attempted" className="bg-gray-900">Attempted</option>
                    <option value="revisit" className="bg-gray-900">To Revisit</option>
                  </select>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Problems List */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredProblems.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Code className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400">No problems found</h3>
          <p className="text-gray-500 mt-2">Start solving problems to see them here</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filteredProblems.map((problem, index) => (
            <motion.div
              key={problem._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedProblem(problem)}
              className="cursor-pointer"
            >
              <GlassCard className="p-4 hover:border-white/20 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Platform badge */}
                    <div
                      className="w-2 h-12 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PLATFORM_COLORS[problem.platform] }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">{problem.title}</h3>
                        {problem.code && (
                          <Code className="w-4 h-4 text-neon-green flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span className="capitalize">{problem.platform}</span>
                        <span
                          className="px-2 py-0.5 text-xs rounded-full capitalize"
                          style={{
                            backgroundColor: `${DIFFICULTY_COLORS[problem.difficulty]}20`,
                            color: DIFFICULTY_COLORS[problem.difficulty],
                          }}
                        >
                          {problem.difficulty}
                        </span>
                        <span className="uppercase text-xs">{problem.language}</span>
                        {problem.timeSpent > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {problem.timeSpent}m
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Tags */}
                    {problem.tags?.length > 0 && (
                      <div className="hidden md:flex items-center gap-1">
                        {problem.tags.slice(0, 2).map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs bg-white/5 text-gray-400 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {problem.tags.length > 2 && (
                          <span className="text-xs text-gray-500">+{problem.tags.length - 2}</span>
                        )}
                      </div>
                    )}

                    {/* Date */}
                    <span className="text-xs text-gray-500 hidden sm:block">
                      {format(new Date(problem.solvedAt), 'MMM d')}
                    </span>

                    {/* Notes */}
                    {problem.notes && problem.notes.trim() && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNotesModalProblem(problem);
                        }}
                        className="p-2 text-purple-400 hover:bg-purple-400/10 rounded-lg transition-all"
                        title="View notes"
                      >
                        <StickyNote className="w-4 h-4" />
                      </button>
                    )}

                    {/* Actions */}
                    <a
                      href={problem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-gray-400 hover:text-neon-green hover:bg-white/10 rounded-lg transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={(e) => handleDelete(problem._id, e)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-10 h-10 rounded-lg font-medium transition-all ${
                currentPage === page
                  ? 'bg-neon-green text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Code Viewer Modal */}
      <CodeViewer
        isOpen={!!selectedProblem}
        onClose={() => setSelectedProblem(null)}
        problem={selectedProblem}
      />

      {/* Notes Modal */}
      <AnimatePresence>
        {notesModalProblem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setNotesModalProblem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <StickyNote className="w-5 h-5 text-purple-400" />
                      Notes
                    </h2>
                    <p className="text-sm text-gray-400 mt-1 truncate max-w-[350px]">{notesModalProblem.title}</p>
                  </div>
                  <button
                    onClick={() => setNotesModalProblem(null)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 max-h-80 overflow-y-auto">
                  <p className="text-gray-300 text-sm whitespace-pre-wrap font-mono">
                    {notesModalProblem.notes}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Problems;
