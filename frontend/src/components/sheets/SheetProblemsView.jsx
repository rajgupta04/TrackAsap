import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Download,
  Plus,
  ExternalLink,
  Youtube,
  FileText,
  CheckCircle2,
  Circle,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  X,
  Edit3,
  Trash2,
  Code2,
  FileSpreadsheet,
  StickyNote,
  Save,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';
import GlassCard from '../ui/GlassCard';
import sheetProblemService from '../../services/sheetProblemService';

const DIFFICULTY_COLORS = {
  easy: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  hard: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
};

const STATUS_ICONS = {
  pending: Circle,
  solved: CheckCircle2,
  revision: RotateCcw,
};

const SheetProblemsView = ({ sheet, onStatsUpdate }) => {
  const [problems, setProblems] = useState({});
  const [rawProblems, setRawProblems] = useState([]);
  const [stats, setStats] = useState({ total: 0, solved: 0, revision: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedTopics, setExpandedTopics] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedProblemForNotes, setSelectedProblemForNotes] = useState(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedProblemForCode, setSelectedProblemForCode] = useState(null);
  const fileInputRef = useRef(null);
  const expandedTopicsRef = useRef({});
  const lastSheetIdRef = useRef(null);

  useEffect(() => {
    if (sheet?._id) {
      // Reset expanded state when switching to a different sheet
      if (lastSheetIdRef.current !== sheet._id) {
        expandedTopicsRef.current = {};
        lastSheetIdRef.current = sheet._id;
      }
      fetchProblems();
    }
  }, [sheet?._id]);

  const fetchProblems = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await sheetProblemService.getProblems(sheet._id);
      setProblems(data.problems);
      setRawProblems(data.rawProblems);
      setStats(data.stats);
      
      // Handle expanded topics - preserve existing state, expand new topics
      const currentExpanded = expandedTopicsRef.current;
      if (Object.keys(currentExpanded).length === 0) {
        // Initial load - expand all
        const expanded = {};
        Object.keys(data.problems).forEach(topic => {
          expanded[topic] = true;
        });
        expandedTopicsRef.current = expanded;
        setExpandedTopics(expanded);
      } else {
        // Silent refresh - add any new topics as expanded
        const updated = { ...currentExpanded };
        Object.keys(data.problems).forEach(topic => {
          if (!(topic in updated)) {
            updated[topic] = true;
          }
        });
        if (Object.keys(updated).length !== Object.keys(currentExpanded).length) {
          expandedTopicsRef.current = updated;
          setExpandedTopics(updated);
        }
      }
    } catch (error) {
      if (!silent) toast.error('Failed to load problems');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleStatusChange = async (problemId, currentStatus) => {
    const statusCycle = { pending: 'solved', solved: 'revision', revision: 'pending' };
    const newStatus = statusCycle[currentStatus];

    // Optimistic update - update UI immediately
    setProblems(prevProblems => {
      const updated = { ...prevProblems };
      for (const topic in updated) {
        updated[topic] = updated[topic].map(p =>
          p._id === problemId ? { ...p, status: newStatus } : p
        );
      }
      return updated;
    });

    setRawProblems(prev =>
      prev.map(p => (p._id === problemId ? { ...p, status: newStatus } : p))
    );

    // Update stats optimistically
    setStats(prev => {
      const newStats = { ...prev };
      newStats[currentStatus] = Math.max(0, (newStats[currentStatus] || 0) - 1);
      newStats[newStatus] = (newStats[newStatus] || 0) + 1;
      return newStats;
    });

    if (newStatus === 'solved') {
      toast.success('Problem marked as solved! 🎉');
    }

    try {
      await sheetProblemService.updateStatus(problemId, newStatus);
      // Small delay to ensure database has committed changes
      await new Promise(resolve => setTimeout(resolve, 100));
      // Silently refresh to sync with server (no loading spinner)
      await fetchProblems(true);
      onStatsUpdate?.();
    } catch (error) {
      // Revert on error
      toast.error('Failed to update status');
      fetchProblems(true);
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await sheetProblemService.importFromExcel(sheet._id, file);
      toast.success(result.message);
      fetchProblems(true);
      onStatsUpdate?.();
      setShowImportModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import');
    }
    e.target.value = '';
  };

  const handleExport = async () => {
    try {
      const blob = await sheetProblemService.exportToExcel(sheet._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sheet.name}-problems.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Exported successfully!');
    } catch (error) {
      toast.error('Failed to export');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await sheetProblemService.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sheet-template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const toggleTopic = (topic) => {
    setExpandedTopics(prev => {
      const updated = { ...prev, [topic]: !prev[topic] };
      expandedTopicsRef.current = updated;
      return updated;
    });
  };

  const handleOpenNotes = (problem) => {
    setSelectedProblemForNotes(problem);
    setShowNotesModal(true);
  };

  const handleSaveNotes = async (problemId, notes) => {
    try {
      await sheetProblemService.updateProblem(problemId, { notes });
      toast.success('Notes saved');
      await fetchProblems(true);
      setShowNotesModal(false);
      setSelectedProblemForNotes(null);
    } catch (error) {
      toast.error('Failed to save notes');
    }
  };

  const handleOpenCode = (problem) => {
    setSelectedProblemForCode(problem);
    setShowCodeModal(true);
  };

  const handleSaveCode = async (problemId, code, language) => {
    try {
      await sheetProblemService.updateProblem(problemId, { code, language });
      toast.success('Code saved! 🎉');
      await fetchProblems(true);
      setShowCodeModal(false);
      setSelectedProblemForCode(null);
    } catch (error) {
      toast.error('Failed to save code');
    }
  };

  // Filter problems
  const getFilteredProblems = () => {
    const filtered = {};
    Object.entries(problems).forEach(([topic, topicProblems]) => {
      const filteredTopicProblems = topicProblems.filter(p => {
        const matchesSearch = !searchQuery || 
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesDifficulty = filterDifficulty === 'all' || p.difficulty === filterDifficulty;
        const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
        return matchesSearch && matchesDifficulty && matchesStatus;
      });
      if (filteredTopicProblems.length > 0) {
        filtered[topic] = filteredTopicProblems;
      }
    });
    return filtered;
  };

  const filteredProblems = getFilteredProblems();
  const completionPercent = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{sheet.name}</h1>
          <p className="text-gray-400 text-sm">{sheet.description}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-white"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import Excel</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-white"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-neon-green text-black font-semibold rounded-lg hover:bg-neon-green/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Problem</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-400">Total</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.solved}</div>
          <div className="text-xs text-gray-400">Solved</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.revision}</div>
          <div className="text-xs text-gray-400">Revision</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-400">{stats.pending}</div>
          <div className="text-xs text-gray-400">Pending</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.easy}</div>
          <div className="text-xs text-gray-400">Easy</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.medium}</div>
          <div className="text-xs text-gray-400">Medium</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{stats.hard}</div>
          <div className="text-xs text-gray-400">Hard</div>
        </GlassCard>
      </div>

      {/* Progress Bar */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium">Progress</span>
          <span className="text-neon-green font-bold">{completionPercent}%</span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-neon-green to-emerald-400 rounded-full"
          />
        </div>
      </GlassCard>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search problems or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none"
          />
        </div>
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-neon-green"
        >
          <option value="all">All Difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-neon-green"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="solved">Solved</option>
          <option value="revision">Revision</option>
        </select>
      </div>

      {/* Problems by Topic */}
      {Object.keys(filteredProblems).length === 0 ? (
        <GlassCard className="p-12 text-center">
          <FileSpreadsheet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400">No problems yet</h3>
          <p className="text-gray-500 mt-2">Import an Excel sheet or add problems manually</p>
          <button
            onClick={() => setShowImportModal(true)}
            className="mt-4 px-6 py-2 bg-neon-green text-black font-semibold rounded-lg hover:bg-neon-green/90 transition-all"
          >
            Import Excel Sheet
          </button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {Object.entries(filteredProblems).map(([topic, topicProblems]) => {
            const topicSolved = topicProblems.filter(p => p.status === 'solved').length;
            const isExpanded = expandedTopics[topic];

            return (
              <GlassCard key={topic} className="overflow-hidden">
                {/* Topic Header */}
                <button
                  onClick={() => toggleTopic(topic)}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-neon-green" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <h3 className="text-lg font-semibold text-white">{topic}</h3>
                    <span className="px-2 py-0.5 text-xs bg-white/10 rounded-full text-gray-400">
                      {topicSolved}/{topicProblems.length}
                    </span>
                  </div>
                  <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neon-green rounded-full transition-all"
                      style={{ width: `${(topicSolved / topicProblems.length) * 100}%` }}
                    />
                  </div>
                </button>

                {/* Problems Table */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-t border-white/10 bg-white/5">
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-12">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Problem
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-24">
                                Difficulty
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider w-32">
                                Links
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider w-16">
                                Notes
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider w-16">
                                Code
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider w-16">
                                Rev.
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {topicProblems.map((problem, idx) => {
                              const StatusIcon = STATUS_ICONS[problem.status];
                              const diffColors = DIFFICULTY_COLORS[problem.difficulty];

                              return (
                                <tr
                                  key={problem._id}
                                  className={`hover:bg-white/5 transition-colors ${
                                    problem.status === 'solved' ? 'bg-green-500/5' : ''
                                  }`}
                                >
                                  <td className="px-4 py-3">
                                    <button
                                      onClick={() => handleStatusChange(problem._id, problem.status)}
                                      className="transition-transform hover:scale-110"
                                    >
                                      <StatusIcon
                                        className={`w-5 h-5 ${
                                          problem.status === 'solved'
                                            ? 'text-green-400'
                                            : problem.status === 'revision'
                                            ? 'text-yellow-400'
                                            : 'text-gray-500 hover:text-neon-green'
                                        }`}
                                      />
                                    </button>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-500 text-sm">{idx + 1}.</span>
                                      <span
                                        className={`font-medium ${
                                          problem.status === 'solved'
                                            ? 'text-green-400 line-through opacity-70'
                                            : 'text-white'
                                        }`}
                                      >
                                        {problem.title}
                                      </span>
                                    </div>
                                    {problem.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {problem.tags.slice(0, 3).map((tag, i) => (
                                          <span
                                            key={i}
                                            className="px-1.5 py-0.5 text-[10px] bg-white/10 rounded text-gray-400"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${diffColors.bg} ${diffColors.text}`}
                                    >
                                      {problem.difficulty}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-2">
                                      {problem.problemLink && (
                                        <a
                                          href={problem.problemLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                          title="Problem"
                                        >
                                          <Code2 className="w-4 h-4 text-blue-400" />
                                        </a>
                                      )}
                                      {problem.articleLink && (
                                        <a
                                          href={problem.articleLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                          title="Article"
                                        >
                                          <FileText className="w-4 h-4 text-orange-400" />
                                        </a>
                                      )}
                                      {problem.youtubeLink && (
                                        <a
                                          href={problem.youtubeLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                          title="YouTube"
                                        >
                                          <Youtube className="w-4 h-4 text-red-400" />
                                        </a>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => handleOpenNotes(problem)}
                                      className={`p-1.5 hover:bg-white/10 rounded transition-colors ${problem.notes ? 'text-purple-400' : 'text-gray-500 hover:text-purple-400'}`}
                                      title={problem.notes ? 'View notes' : 'Add notes'}
                                    >
                                      <StickyNote className="w-4 h-4" />
                                    </button>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => handleOpenCode(problem)}
                                      className={`p-1.5 hover:bg-white/10 rounded transition-colors ${problem.code ? 'text-neon-green' : 'text-gray-500 hover:text-neon-green'}`}
                                      title={problem.code ? 'View code' : 'Add code'}
                                    >
                                      <Terminal className="w-4 h-4" />
                                    </button>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="text-sm text-gray-400">
                                      {problem.revisionCount}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowImportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Import from Excel</h2>
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-6 border-2 border-dashed border-white/20 rounded-xl text-center">
                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-white mb-2">Drop your Excel file here</p>
                    <p className="text-gray-500 text-sm mb-4">Supports .xlsx and .xls files</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImportExcel}
                      accept=".xlsx,.xls"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-neon-green text-black font-semibold rounded-lg hover:bg-neon-green/90 transition-all"
                    >
                      Select File
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white text-sm font-medium">Need a template?</p>
                      <p className="text-gray-500 text-xs">Download the Excel template</p>
                    </div>
                    <button
                      onClick={handleDownloadTemplate}
                      className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                    >
                      Download
                    </button>
                  </div>

                  <div className="text-xs text-gray-500">
                    <p className="font-medium text-gray-400 mb-1">Expected columns:</p>
                    <p>Topic, Title, Difficulty, Platform, Problem Link, Article Link, YouTube, Tags</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Problem Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddProblemModal
            sheetId={sheet._id}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              fetchProblems(true);
              onStatsUpdate?.();
              setShowAddModal(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Notes Modal */}
      <AnimatePresence>
        {showNotesModal && selectedProblemForNotes && (
          <NotesModal
            problem={selectedProblemForNotes}
            onClose={() => {
              setShowNotesModal(false);
              setSelectedProblemForNotes(null);
            }}
            onSave={handleSaveNotes}
          />
        )}
      </AnimatePresence>

      {/* Code Editor Modal */}
      <AnimatePresence>
        {showCodeModal && selectedProblemForCode && (
          <CodeEditorModal
            problem={selectedProblemForCode}
            onClose={() => {
              setShowCodeModal(false);
              setSelectedProblemForCode(null);
            }}
            onSave={handleSaveCode}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Notes Modal Component
const NotesModal = ({ problem, onClose, onSave }) => {
  const [notes, setNotes] = useState(problem.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(problem._id, notes);
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
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
              <p className="text-sm text-gray-400 mt-1 truncate max-w-[300px]">{problem.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-2 text-xs text-gray-500">Where did you get stuck? What clicked? Key insights...</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes here...

• Where I got stuck:
• The key insight:
• Time/Space complexity:
• Pattern to remember:"
              rows={8}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-purple-400 outline-none resize-none font-mono text-sm"
              autoFocus
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

// Code Editor Modal Component
const LANGUAGE_OPTIONS = [
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'c', label: 'C' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

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

const CodeEditorModal = ({ problem, onClose, onSave }) => {
  const [code, setCode] = useState(problem.code || '');
  const [language, setLanguage] = useState(problem.language || 'cpp');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(problem._id, code, language);
    setSaving(false);
  };

  const handleCopy = async () => {
    if (code) {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        toast.success('Code copied!');
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error('Failed to copy');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-5xl h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard className="h-full flex flex-col p-0">
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-neon-green" />
                  Code Solution
                </h2>
                <p className="text-sm text-gray-400 mt-1 truncate">{problem.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-neon-green"
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-gray-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleCopy}
                  className={`p-2 rounded-lg transition-all ${
                    copied ? 'text-neon-green bg-neon-green/10' : 'text-gray-400 hover:text-white hover:bg-white/10'
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
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={LANGUAGE_MAP[language] || 'plaintext'}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
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
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 bg-neon-green text-black font-semibold rounded-lg hover:bg-neon-green/90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Code'}
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

// Add Problem Modal Component
const AddProblemModal = ({ sheetId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    difficulty: 'medium',
    problemLink: '',
    articleLink: '',
    youtubeLink: '',
    platform: 'leetcode',
    tags: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.topic) {
      toast.error('Title and Topic are required');
      return;
    }

    try {
      setLoading(true);
      await sheetProblemService.addProblem(sheetId, {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      toast.success('Problem added!');
      onSuccess();
    } catch (error) {
      toast.error('Failed to add problem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Add Problem</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Two Sum"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-neon-green outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Topic/Day *</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., Day 1 - Arrays"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-neon-green outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-neon-green"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Platform</label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-neon-green"
                >
                  <option value="leetcode">LeetCode</option>
                  <option value="geeksforgeeks">GeeksForGeeks</option>
                  <option value="codeforces">Codeforces</option>
                  <option value="codechef">CodeChef</option>
                  <option value="hackerrank">HackerRank</option>
                  <option value="interviewbit">InterviewBit</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Problem Link</label>
              <input
                type="url"
                value={formData.problemLink}
                onChange={(e) => setFormData({ ...formData, problemLink: e.target.value })}
                placeholder="https://leetcode.com/problems/..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-neon-green outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Article/Solution Link</label>
              <input
                type="url"
                value={formData.articleLink}
                onChange={(e) => setFormData({ ...formData, articleLink: e.target.value })}
                placeholder="https://takeuforward.org/..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-neon-green outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">YouTube Link</label>
              <input
                type="url"
                value={formData.youtubeLink}
                onChange={(e) => setFormData({ ...formData, youtubeLink: e.target.value })}
                placeholder="https://youtube.com/..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-neon-green outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Tags (comma separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="array, hashmap, two-pointers"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-neon-green outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-neon-green text-black font-semibold rounded-lg hover:bg-neon-green/90 transition-all disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Problem'}
              </button>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

export default SheetProblemsView;
