import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
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
  Sparkles,
  GripVertical,
  Move,
  FolderInput,
  Sliders,
} from 'lucide-react';
import toast from 'react-hot-toast';
import CodeViewer from '../CodeViewer';
import GlassCard from '../ui/GlassCard';
import sheetProblemService from '../../services/sheetProblemService';
import githubService from '../../services/githubService';
import aiService from '../../services/aiService';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import localforage from 'localforage';

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

const SheetProblemsView = ({ sheet, onStatsUpdate, onDelete }) => {
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
  const [githubSyncing, setGithubSyncing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef(null);
  const expandedTopicsRef = useRef({});
  const lastSheetIdRef = useRef(null);

  // Edit mode & management state
  const [editMode, setEditMode] = useState(false);
  const [showDeleteProblemModal, setShowDeleteProblemModal] = useState(false);
  const [problemToDelete, setProblemToDelete] = useState(null);
  const [showDeleteTopicModal, setShowDeleteTopicModal] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);
  const [showMoveTopicModal, setShowMoveTopicModal] = useState(false);
  const [problemToMove, setProblemToMove] = useState(null);
  const [targetTopic, setTargetTopic] = useState('');
  const [isManaging, setIsManaging] = useState(false);

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
      try {
        const cachedData = await localforage.getItem(`sheetProblems_${sheet._id}`);
        if (cachedData) {
          setProblems(cachedData.problems);
          setRawProblems(cachedData.rawProblems);
          setStats(cachedData.stats);
          if (!silent) setLoading(false);
          silent = true; // prevent loading spinner for network fetch
        }
      } catch (err) {
        console.warn('Failed to read problems from cache', err);
      }

      if (!silent) setLoading(true);
      const data = await sheetProblemService.getProblems(sheet._id);
      setProblems(data.problems);
      setRawProblems(data.rawProblems);
      setStats(data.stats);
      localforage.setItem(`sheetProblems_${sheet._id}`, data).catch(console.warn);
      
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

  const handleSaveCode = async (problemId, code, language, solutions = []) => {
    try {
      await sheetProblemService.updateProblem(problemId, { code, language, solutions });
      toast.success('Code saved! 🎉');
      await fetchProblems(true);
      setShowCodeModal(false);
      setSelectedProblemForCode(null);
    } catch (error) {
      toast.error('Failed to save code');
    }
  };

  const handleDeleteProblemConfirm = async () => {
    if (!problemToDelete) return;
    setIsManaging(true);
    try {
      await sheetProblemService.deleteProblem(problemToDelete._id);
      toast.success('Problem deleted');
      await fetchProblems(true);
      setShowDeleteProblemModal(false);
      setProblemToDelete(null);
    } catch (error) {
      toast.error(error.message || 'Failed to delete problem');
    } finally {
      setIsManaging(false);
    }
  };

  const handleDeleteTopicConfirm = async () => {
    if (!topicToDelete) return;
    setIsManaging(true);
    try {
      await sheetProblemService.deleteTopic(sheet._id, topicToDelete);
      toast.success(`Deleted section "${topicToDelete}"`);
      await fetchProblems(true);
      setShowDeleteTopicModal(false);
      setTopicToDelete(null);
    } catch (error) {
      toast.error(error.message || 'Failed to delete section');
    } finally {
      setIsManaging(false);
    }
  };

  const handleMoveProblemConfirm = async () => {
    if (!problemToMove || !targetTopic.trim()) return;
    if (targetTopic.trim() === problemToMove.topic) {
      toast.error('Please select a different section');
      return;
    }
    setIsManaging(true);
    try {
      await sheetProblemService.updateProblem(problemToMove._id, { topic: targetTopic.trim() });
      toast.success(`Moved problem to "${targetTopic.trim()}"`);
      await fetchProblems(true);
      setShowMoveTopicModal(false);
      setProblemToMove(null);
      setTargetTopic('');
    } catch (error) {
      toast.error(error.message || 'Failed to move problem');
    } finally {
      setIsManaging(false);
    }
  };

  const handleReorderTopicProblems = async (topic, newOrderedProblems) => {
    setProblems(prev => ({
      ...prev,
      [topic]: newOrderedProblems,
    }));
    try {
      const orderedIds = newOrderedProblems.map(p => p._id);
      await sheetProblemService.reorderProblems(sheet._id, { orderedIds });
      toast.success('Order saved', { id: 'reorder-toast', duration: 1500 });
    } catch (error) {
      toast.error('Failed to save order');
      fetchProblems(true);
    }
  };

  const handleReorderTopics = async (newTopicOrder) => {
    const reorderedProblems = {};
    newTopicOrder.forEach(t => {
      if (problems[t]) reorderedProblems[t] = problems[t];
    });
    setProblems(reorderedProblems);
    try {
      await sheetProblemService.reorderProblems(sheet._id, { topicOrder: newTopicOrder });
      toast.success('Section order saved', { id: 'reorder-topic-toast', duration: 1500 });
    } catch (error) {
      toast.error('Failed to save section order');
      fetchProblems(true);
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
    <div className="space-y-6 min-w-0 max-w-full w-full">
      {/* Header & Quick Actions */}
      <div className="space-y-4 min-w-0 max-w-full">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white break-words">{sheet.name}</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5 break-words">{sheet.description}</p>
        </div>

        {/* Mobile App Tile Actions (Visible on small screens) */}
        <div className="grid grid-cols-2 gap-2 sm:hidden w-full min-w-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="col-span-2 flex items-center justify-center gap-2 py-3 bg-neon-green active:scale-[0.98] rounded-xl font-bold text-black text-xs shadow-lg shadow-neon-green/10 transition-all"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Add Problem</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-xl transition-all text-xs text-white font-medium min-w-0"
          >
            <Upload className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="truncate">Import Excel</span>
          </button>

          <button
            onClick={async () => {
              const { githubStatus } = useAuthStore.getState();
              if (!githubStatus?.connected) {
                toast.error('Connect GitHub first from Profile page');
                return;
              }
              setGithubSyncing(true);
              try {
                const result = await githubService.sync();
                toast.success(`Synced ${result.filesCount} files to GitHub!`);
              } catch (error) {
                toast.error(error.response?.data?.message || 'Sync failed');
              } finally {
                setGithubSyncing(false);
              }
            }}
            disabled={githubSyncing}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-xl transition-all text-xs text-white font-medium disabled:opacity-50 min-w-0"
          >
            <svg className={`w-4 h-4 text-purple-400 shrink-0 ${githubSyncing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            <span className="truncate">{githubSyncing ? 'Syncing...' : 'Sync Git'}</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-xl transition-all text-xs text-white font-medium min-w-0"
          >
            <Download className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Export</span>
          </button>

          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 border rounded-xl transition-all text-xs font-medium min-w-0 ${
              editMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span className="truncate">{editMode ? 'Exit Edit' : 'Edit Mode'}</span>
          </button>

          <button
            onClick={() => {
              setDeleteConfirmText('');
              setShowDeleteModal(true);
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-red-500/10 hover:bg-red-500/20 active:scale-95 border border-red-500/20 rounded-xl transition-all text-xs font-bold text-red-400 min-w-0"
          >
            <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
            <span className="truncate">Delete Sheet</span>
          </button>
        </div>

        {/* Desktop Actions Bar (Hidden on small screens) */}
        <div className="hidden sm:flex items-center flex-wrap gap-2.5">
          <button
            onClick={async () => {
              const { githubStatus } = useAuthStore.getState();
              if (!githubStatus?.connected) {
                toast.error('Connect GitHub first from Profile page');
                return;
              }
              setGithubSyncing(true);
              try {
                const result = await githubService.sync();
                toast.success(`Synced ${result.filesCount} files to GitHub!`);
              } catch (error) {
                toast.error(error.response?.data?.message || 'Sync failed');
              } finally {
                setGithubSyncing(false);
              }
            }}
            disabled={githubSyncing}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-white disabled:opacity-50 text-sm"
          >
            <svg className={`w-4 h-4 ${githubSyncing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            <span>{githubSyncing ? 'Syncing...' : 'Sync GitHub'}</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-white text-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Import Excel</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-white text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-2 px-3.5 py-2 border rounded-lg transition-all text-sm font-medium ${
              editMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{editMode ? 'Exit Edit Mode' : 'Edit Mode'}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-neon-green text-black font-semibold rounded-lg hover:bg-neon-green/90 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Problem</span>
          </button>
          <button
            onClick={() => {
              setDeleteConfirmText('');
              setShowDeleteModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-all text-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Mobile Unified Dashboard Tile (Visible on mobile) */}
      <div className="lg:hidden min-w-0 max-w-full w-full">
        <GlassCard className="p-3.5 space-y-3 min-w-0 max-w-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300">Sheet Completion</span>
            <span className="text-sm font-bold text-neon-green">{completionPercent}%</span>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden w-full">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercent}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-neon-green to-emerald-400 rounded-full"
            />
          </div>

          <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 pt-1 w-full min-w-0">
            <div className="bg-white/5 p-2 rounded-lg text-center min-w-0">
              <div className="text-base font-bold text-white truncate">{stats.total}</div>
              <div className="text-[10px] text-gray-400 font-medium">Total</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 p-2 rounded-lg text-center min-w-0">
              <div className="text-base font-bold text-green-400 truncate">{stats.solved}</div>
              <div className="text-[10px] text-green-400/80 font-medium">Solved</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-2 rounded-lg text-center min-w-0">
              <div className="text-base font-bold text-yellow-400 truncate">{stats.revision}</div>
              <div className="text-[10px] text-yellow-400/80 font-medium">Review</div>
            </div>
            <div className="bg-white/5 p-2 rounded-lg text-center min-w-0">
              <div className="text-base font-bold text-gray-400 truncate">{stats.pending}</div>
              <div className="text-[10px] text-gray-400 font-medium">Pending</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-white/10">
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-green-500/5 border border-green-500/10">
              <span className="text-[10px] text-gray-400">Easy</span>
              <span className="text-xs font-bold text-green-400">{stats.easy}</span>
            </div>
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-yellow-500/5 border border-yellow-500/10">
              <span className="text-[10px] text-gray-400">Med</span>
              <span className="text-xs font-bold text-yellow-400">{stats.medium}</span>
            </div>
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-red-500/5 border border-red-500/10">
              <span className="text-[10px] text-gray-400">Hard</span>
              <span className="text-xs font-bold text-red-400">{stats.hard}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Desktop Stats Cards (Hidden on mobile) */}
      <div className="hidden lg:grid grid-cols-7 gap-3">
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

      {/* Desktop Progress Bar */}
      <div className="hidden lg:block">
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
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search problems or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 sm:py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2.5 sm:gap-3">
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-neon-green w-full sm:w-auto"
          >
            <option value="all">All Difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-neon-green w-full sm:w-auto"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="solved">Solved</option>
            <option value="revision">Revision</option>
          </select>
        </div>
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
          {editMode && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs sm:text-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  <strong>Edit Mode Active:</strong> Drag handles to reorder sections or problems. You can also delete problems/sections or move problems between sections.
                </span>
              </div>
              <button
                onClick={() => setEditMode(false)}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold rounded-lg text-xs transition-colors shrink-0"
              >
                Done
              </button>
            </div>
          )}
          <Reorder.Group axis="y" values={Object.keys(filteredProblems)} onReorder={handleReorderTopics} className="space-y-4">
            {Object.entries(filteredProblems).map(([topic, topicProblems]) => {
              const topicSolved = topicProblems.filter(p => p.status === 'solved').length;
              const isExpanded = expandedTopics[topic];

              return (
                <Reorder.Item key={topic} value={topic} dragListener={editMode} className="list-none">
                  <GlassCard className="overflow-hidden min-w-0 max-w-full">
                    {/* Topic Header */}
                    <button
                      onClick={() => toggleTopic(topic)}
                      className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-2.5 hover:bg-white/5 transition-colors min-w-0 text-left"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        {editMode && (
                          <div
                            className="p-1 text-gray-400 hover:text-white cursor-grab active:cursor-grabbing shrink-0"
                            title="Drag section to reorder"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="w-5 h-5" />
                          </div>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-neon-green shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                        )}
                        <h3 className="text-sm sm:text-lg font-bold text-white truncate min-w-0">{topic}</h3>
                        <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-white/10 rounded-full text-gray-300 font-semibold shrink-0">
                          {topicSolved}/{topicProblems.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-16 sm:w-24 h-1.5 bg-white/10 rounded-full overflow-hidden hidden xs:block">
                          <div
                            className="h-full bg-neon-green rounded-full transition-all"
                            style={{ width: `${(topicSolved / topicProblems.length) * 100}%` }}
                          />
                        </div>
                        {editMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTopicToDelete(topic);
                              setShowDeleteTopicModal(true);
                            }}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Delete section & its problems"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
                      <Reorder.Group axis="y" values={topicProblems} onReorder={(newOrder) => handleReorderTopicProblems(topic, newOrder)} className="md:hidden border-t border-white/10 p-2.5 space-y-2.5">
                        {topicProblems.map((problem, idx) => {
                          const StatusIcon = STATUS_ICONS[problem.status];
                          const diffColors = DIFFICULTY_COLORS[problem.difficulty];

                          return (
                            <Reorder.Item
                              key={problem._id}
                              value={problem}
                              dragListener={editMode}
                              className={`p-3.5 rounded-xl border border-white/10 transition-all list-none ${
                                problem.status === 'solved' ? 'bg-green-500/[0.07] border-green-500/20' : 'bg-white/[0.03]'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <button
                                  onClick={() => handleStatusChange(problem._id, problem.status)}
                                  className="transition-transform active:scale-90 mt-0.5 p-1 rounded-full hover:bg-white/10"
                                >
                                  <StatusIcon
                                    className={`w-6 h-6 ${
                                      problem.status === 'solved'
                                        ? 'text-green-400'
                                        : problem.status === 'revision'
                                        ? 'text-yellow-400'
                                        : 'text-gray-400 hover:text-neon-green'
                                    }`}
                                  />
                                </button>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={`text-sm font-bold leading-snug break-words ${problem.status === 'solved' ? 'text-green-300/90' : 'text-white'}`}>
                                      {idx + 1}. {problem.title}
                                    </p>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {editMode && (
                                        <>
                                          <div className="p-1 text-gray-400 hover:text-white cursor-grab active:cursor-grabbing" title="Drag to reorder">
                                            <GripVertical className="w-4 h-4" />
                                          </div>
                                          <button
                                            onClick={() => {
                                              setProblemToMove(problem);
                                              setTargetTopic(problem.topic);
                                              setShowMoveTopicModal(true);
                                            }}
                                            className="p-1 text-cyan-400 hover:bg-cyan-500/10 rounded"
                                            title="Move section"
                                          >
                                            <FolderInput className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              setProblemToDelete(problem);
                                              setShowDeleteProblemModal(true);
                                            }}
                                            className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                                            title="Delete problem"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </>
                                      )}
                                      <span
                                        className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${diffColors.bg} ${diffColors.text}`}
                                      >
                                        {problem.difficulty}
                                      </span>
                                    </div>
                                  </div>

                                  {problem.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {problem.tags.slice(0, 4).map((tag, i) => (
                                        <span
                                          key={i}
                                          className="px-1.5 py-0.5 text-[10px] bg-white/5 border border-white/10 rounded font-medium text-gray-400"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-2.5 border-t border-white/5">
                                    <div className="flex flex-wrap items-center gap-1">
                                      {problem.problemLink && (
                                        <a
                                          href={problem.problemLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-medium shrink-0"
                                          title="Problem"
                                        >
                                          <Code2 className="w-3.5 h-3.5" />
                                          <span>Solve</span>
                                        </a>
                                      )}
                                      {problem.articleLink && (
                                        <a
                                          href={problem.articleLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg transition-colors shrink-0"
                                          title="Article"
                                        >
                                          <FileText className="w-3.5 h-3.5" />
                                        </a>
                                      )}
                                      {problem.youtubeLink && (
                                        <a
                                          href={problem.youtubeLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors shrink-0"
                                          title="YouTube"
                                        >
                                          <Youtube className="w-3.5 h-3.5" />
                                        </a>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        onClick={() => handleOpenNotes(problem)}
                                        className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-[11px] font-medium ${
                                          problem.notes
                                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                            : 'bg-white/5 text-gray-400 hover:text-white'
                                        }`}
                                        title={problem.notes ? 'View notes' : 'Add notes'}
                                      >
                                        <StickyNote className="w-3.5 h-3.5" />
                                        {problem.notes && <span>Notes</span>}
                                      </button>
                                      <button
                                        onClick={() => handleOpenCode(problem)}
                                        className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-[11px] font-medium ${
                                          (problem.code || problem.solutions?.some(s => s.code?.trim()))
                                            ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                                            : 'bg-white/5 text-gray-400 hover:text-white'
                                        }`}
                                        title={problem.code ? 'View code' : 'Add code'}
                                      >
                                        <Terminal className="w-3.5 h-3.5" />
                                        {(problem.code || problem.solutions?.some(s => s.code?.trim())) && <span>Code</span>}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Reorder.Item>
                          );
                        })}
                      </Reorder.Group>

                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full min-w-[760px] lg:min-w-0">
                          <thead>
                            <tr className="border-t border-white/10 bg-white/5">
                              {editMode && (
                                <th className="px-3 py-3 text-center text-xs font-medium text-amber-400 uppercase tracking-wider w-24">
                                  Manage
                                </th>
                              )}
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
                          <Reorder.Group
                            as="tbody"
                            axis="y"
                            values={topicProblems}
                            onReorder={(newOrder) => handleReorderTopicProblems(topic, newOrder)}
                            className="divide-y divide-white/5"
                          >
                            {topicProblems.map((problem, idx) => {
                              const StatusIcon = STATUS_ICONS[problem.status];
                              const diffColors = DIFFICULTY_COLORS[problem.difficulty];

                              return (
                                <Reorder.Item
                                  as="tr"
                                  key={problem._id}
                                  value={problem}
                                  dragListener={editMode}
                                  className={`hover:bg-white/5 transition-colors ${
                                    problem.status === 'solved' ? 'bg-green-500/5' : ''
                                  }`}
                                >
                                  {editMode && (
                                    <td className="px-3 py-3 text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <div className="p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-white" title="Drag to reorder">
                                          <GripVertical className="w-4 h-4" />
                                        </div>
                                        <button
                                          onClick={() => {
                                            setProblemToMove(problem);
                                            setTargetTopic(problem.topic);
                                            setShowMoveTopicModal(true);
                                          }}
                                          className="p-1 text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors"
                                          title="Move to different section"
                                        >
                                          <FolderInput className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setProblemToDelete(problem);
                                            setShowDeleteProblemModal(true);
                                          }}
                                          className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                          title="Delete problem"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  )}
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
                                        {problem.tags.slice(0, 4).map((tag, i) => (
                                          <span
                                            key={i}
                                            className="px-1.5 py-0.5 text-[10px] bg-white/5 border border-white/10 rounded font-medium text-gray-400"
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
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {problem.problemLink && (
                                        <a
                                          href={problem.problemLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                                          title="Problem"
                                        >
                                          <Code2 className="w-4 h-4" />
                                        </a>
                                      )}
                                      {problem.articleLink && (
                                        <a
                                          href={problem.articleLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg transition-colors"
                                          title="Article"
                                        >
                                          <FileText className="w-4 h-4" />
                                        </a>
                                      )}
                                      {problem.youtubeLink && (
                                        <a
                                          href={problem.youtubeLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                          title="YouTube"
                                        >
                                          <Youtube className="w-4 h-4" />
                                        </a>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => handleOpenNotes(problem)}
                                      className={`p-1.5 rounded-lg transition-all ${
                                        problem.notes
                                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                          : 'bg-white/5 text-gray-400 hover:text-white'
                                      }`}
                                      title={problem.notes ? 'View notes' : 'Add notes'}
                                    >
                                      <StickyNote className="w-4 h-4" />
                                    </button>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => handleOpenCode(problem)}
                                      className={`p-1.5 rounded-lg transition-all ${
                                        (problem.code || problem.solutions?.some(s => s.code?.trim()))
                                          ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                                          : 'bg-white/5 text-gray-400 hover:text-white'
                                      }`}
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
                                </Reorder.Item>
                              );
                            })}
                          </Reorder.Group>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </Reorder.Item>
            );
          })}
          </Reorder.Group>
        </div>
      )}

      {/* Delete Problem Confirmation Modal */}
      <AnimatePresence>
        {showDeleteProblemModal && problemToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteProblemModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-red-400" />
                    <h2 className="text-lg font-bold text-white">Delete Problem</h2>
                  </div>
                  <button
                    onClick={() => setShowDeleteProblemModal(false)}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-300 text-sm mb-6">
                  Are you sure you want to delete <span className="text-white font-semibold">"{problemToDelete.title}"</span>? This action cannot be undone.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteProblemModal(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteProblemConfirm}
                    disabled={isManaging}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {isManaging ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Section Confirmation Modal */}
      <AnimatePresence>
        {showDeleteTopicModal && topicToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteTopicModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-red-400" />
                    <h2 className="text-lg font-bold text-white">Delete Section</h2>
                  </div>
                  <button
                    onClick={() => setShowDeleteTopicModal(false)}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-300 text-sm mb-6">
                  Are you sure you want to delete section <span className="text-white font-semibold">"{topicToDelete}"</span> and all <span className="text-red-400 font-semibold">{problems[topicToDelete]?.length || 0} problems</span> in it? This action cannot be undone.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteTopicModal(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteTopicConfirm}
                    disabled={isManaging}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {isManaging ? 'Deleting Section...' : 'Delete Section'}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Move Problem Confirmation Modal */}
      <AnimatePresence>
        {showMoveTopicModal && problemToMove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowMoveTopicModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FolderInput className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg font-bold text-white">Move Problem to Section</h2>
                  </div>
                  <button
                    onClick={() => setShowMoveTopicModal(false)}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4 mb-6">
                  <p className="text-gray-300 text-sm">
                    Move <span className="text-white font-semibold">"{problemToMove.title}"</span> from <span className="text-gray-400">"{problemToMove.topic}"</span> to:
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Select Target Section</label>
                    <select
                      value={targetTopic}
                      onChange={(e) => setTargetTopic(e.target.value)}
                      className="w-full p-2.5 bg-black/40 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-cyan-400"
                    >
                      {Object.keys(problems).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs flex items-start gap-2">
                    <span className="font-semibold shrink-0">⚠️ Notice:</span>
                    <span>Are you sure? This will move the problem to a different section of the sheet.</span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowMoveTopicModal(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMoveProblemConfirm}
                    disabled={isManaging || !targetTopic.trim() || targetTopic.trim() === problemToMove.topic}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    {isManaging ? 'Moving...' : 'Move Problem'}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
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
                  <h2 className="text-xl font-bold text-red-500">Delete Sheet</h2>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Are you sure you want to delete <span className="text-white font-semibold">{sheet.name}</span>? 
                    This action cannot be undone.
                  </p>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Please type <span className="text-red-400 font-bold select-all">delete</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type delete here..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeleteConfirmText('');
                      }}
                      className="px-6 py-2.5 text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (deleteConfirmText.toLowerCase() === 'delete' && onDelete) {
                          setIsDeleting(true);
                          await onDelete();
                          setIsDeleting(false);
                          setShowDeleteModal(false);
                        }
                      }}
                      disabled={deleteConfirmText.toLowerCase() !== 'delete' || isDeleting}
                      className="px-6 py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
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
            sheet={sheet}
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

      {/* Code Viewer / Editor Modal */}
      <CodeViewer
        isOpen={showCodeModal}
        onClose={() => {
          setShowCodeModal(false);
          setSelectedProblemForCode(null);
        }}
        problem={selectedProblemForCode}
        onSave={handleSaveCode}
      />
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full h-[100dvh] sm:h-auto sm:max-w-lg rounded-none sm:rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard className="p-4 sm:p-6 h-full sm:h-auto overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-purple-400" />
                Notes
              </h2>
              <p className="text-sm text-gray-400 mt-1 truncate max-w-[220px] sm:max-w-[300px]">{problem.title}</p>
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


// Add Problem Modal Component
const AddProblemModal = ({ sheet, onClose, onSuccess }) => {
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
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingLocal, setIsSearchingLocal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.topic) {
      toast.error('Title and Topic are required');
      return;
    }

    try {
      setLoading(true);
      await sheetProblemService.addProblem(sheet._id, {
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

  const handleLocalSearch = async () => {
    if (!formData.title && !formData.problemLink) {
      toast.error('Please enter a title or link to search');
      return;
    }
    
    try {
      setIsSearchingLocal(true);
      const query = formData.title || formData.problemLink;
      const res = await api.get(`/problems/search-global?q=${encodeURIComponent(query)}&limit=5`);
      
      if (res.data.problems && res.data.problems.length > 0) {
        setSearchResults(res.data.problems);
        toast.success(`Found ${res.data.problems.length} matches!`);
      } else {
        setSearchResults([]);
        toast.error('No matching problems found in your database.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search local problems');
    } finally {
      setIsSearchingLocal(false);
    }
  };
  
  const applyLocalResult = (problem) => {
    setFormData(prev => ({
      ...prev,
      title: problem.title || prev.title,
      difficulty: problem.difficulty || prev.difficulty,
      platform: problem.platform || prev.platform,
      problemLink: problem.link || prev.problemLink,
      tags: (problem.tags || []).join(', ') || prev.tags,
    }));
    setSearchResults([]);
    toast.success('Fields auto-filled from database!');
  };

  const handleAIAutofill = async () => {
    if (!formData.problemLink && !formData.title) {
      toast.error('Please enter a problem link or title first');
      return;
    }

    try {
      setLoading(true);
      const sheetTopics = sheet?.topics?.map(t => t.name) || [];
      const data = await aiService.autofillProblem(formData.problemLink, formData.title, sheetTopics);
      
      setFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        difficulty: data.difficulty || prev.difficulty,
        topic: data.topic || prev.topic,
        platform: data.platform || prev.platform,
        tags: (data.tags || []).join(', ') || prev.tags,
      }));
      toast.success('Fields auto-filled successfully! ✨');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to auto-fill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full h-[100dvh] sm:h-auto sm:max-w-lg sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard className="p-4 sm:p-6 h-full sm:h-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Add Problem</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-purple-300">AI Auto-fill</h3>
              <p className="text-xs text-gray-400 mt-1 mb-2">
                Paste a link or type a title below, then let AI extract the difficulty, topic, and tags automatically!
              </p>
              <button
                type="button"
                onClick={handleAIAutofill}
                disabled={loading || (!formData.problemLink && !formData.title)}
                className="px-4 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-semibold border border-purple-500/30 rounded-lg transition-all disabled:opacity-50"
              >
                ✨ Auto-fill fields
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Title *</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Two Sum"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 pr-12 text-white placeholder-gray-500 focus:border-neon-green outline-none"
                />
                <button
                  type="button"
                  onClick={handleLocalSearch}
                  disabled={isSearchingLocal || (!formData.title && !formData.problemLink)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-neon-green hover:bg-white/5 rounded-md transition-colors disabled:opacity-50"
                  title="Search local database"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                    <div className="text-xs font-bold text-gray-400 flex items-center justify-between mb-2">
                      <span>Found Local Matches</span>
                      <button 
                        type="button" 
                        onClick={() => setSearchResults([])}
                        className="hover:text-white"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                      {searchResults.map((result) => (
                        <div 
                          key={result._id}
                          onClick={() => applyLocalResult(result)}
                          className="bg-black/20 hover:bg-white/10 border border-white/5 hover:border-neon-green/30 rounded-lg p-2.5 cursor-pointer transition-all group flex items-center justify-between"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <h4 className="text-sm font-bold text-white truncate group-hover:text-neon-green transition-colors">{result.title}</h4>
                            <div className="flex items-center gap-2 mt-1 text-[10px] uppercase font-bold tracking-wider">
                              <span className={
                                result.difficulty === 'easy' ? 'text-green-400' :
                                result.difficulty === 'medium' ? 'text-yellow-400' :
                                'text-red-400'
                              }>
                                {result.difficulty}
                              </span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-400 truncate">{result.platform}</span>
                            </div>
                          </div>
                          <div className="shrink-0 text-neon-green bg-neon-green/10 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
