import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Users,
  Package,
  Search,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Plus,
  Upload,
  BarChart3,
  UserX,
  UserCheck,
  FileUp,
  Download,
  Activity,
  Clock,
  X,
  StickyNote,
  Code,
  Zap,
  Cpu,
  Save,
  Loader2,
  Compass,
  Check,
  ExternalLink,
  Map as MapIcon,
  Eye,
  Layers,
  Sparkles,
  Link,
  ChevronRight,
  Trophy,
  MousePointerClick,
  Globe,
  Navigation,
  Laptop,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { useAuthStore } from '../store/authStore';
import { useFeatureStore } from '../store/featureStore';
import adminService from '../services/adminService';
import judgeService from '../services/judgeService';
import toast from 'react-hot-toast';
import CodeViewer from '../components/CodeViewer';

const CSV_TEMPLATE_HEADER = 'Topic,Title,Difficulty,Platform,Problem Link,Article Link,YouTube,Tags';
const CSV_TEMPLATE_ROWS = [
  'Day 1 - Arrays,Two Sum,easy,leetcode,https://leetcode.com/problems/two-sum/,https://takeuforward.org/two-sum/,https://www.youtube.com/watch?v=UXDSeD9mN-k,"array,hashmap"',
  'Day 1 - Arrays,Best Time to Buy and Sell Stock,easy,leetcode,https://leetcode.com/problems/best-time-to-buy-and-sell-stock/,,,"array,dp"',
];

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSVToProblems(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Skip header row
  const headerLine = lines[0].toLowerCase();
  const hasHeader = headerLine.includes('topic') || headerLine.includes('title');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line, index) => {
    const cols = parseCSVLine(line);
    const [topic, title, difficulty, platform, problemLink, articleLink, youtubeLink, tags] = cols;

    return {
      topic: topic || 'General',
      title: title || '',
      difficulty: ['easy', 'medium', 'hard'].includes((difficulty || '').toLowerCase())
        ? difficulty.toLowerCase()
        : 'medium',
      platform: (platform || 'leetcode').toLowerCase(),
      problemLink: problemLink || '',
      articleLink: articleLink || '',
      youtubeLink: youtubeLink || '',
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      order: index,
    };
  }).filter((p) => p.title);
}

const BUCKET_CATEGORIES = [
  'dsa', 'cp', 'os', 'cn', 'oop', 'dev', 'database',
  'graph', 'dp', 'trees', 'strings', 'arrays', 'linked-list', 
  'stack-queue', 'binary-search', 'greedy', 'backtracking', 
  'bit-manipulation', 'math', 'system-design', 'other'
];

const Admin = () => {
  const { user, isLoading: isAuthLoading, checkAuth } = useAuthStore();
  const { 
    users, stats, pagination, isLoading, 
    fetchStats, fetchUsers, toggleBanUser, upsertBucket, 
    fetchSystemAnalytics, systemAnalytics, systemPerformance, systemFeatures, activityLogs, systemAnalyticsError,
    userDetails, fetchUserDetails, isUserDetailsLoading,
    clickstream, clickstreamPagination, isClickstreamLoading, fetchClickstream,
    userJourney, isUserJourneyLoading, fetchUserJourney,
    ipStats, fetchIpStats,
    topClicks, fetchTopClicks,
  } = useAdminStore();
  const { fetchAdminFeatures, updateAdminFeatures, isSaving: isSavingFeatures } = useFeatureStore();
  const [activeTab, setActiveTab] = useState('features');
  const [analyticsSubTab, setAnalyticsSubTab] = useState('clickstream');
  const [clickstreamFilterType, setClickstreamFilterType] = useState('all');
  const [clickstreamSearch, setClickstreamSearch] = useState('');
  const [journeySearchEmail, setJourneySearchEmail] = useState('');
  const [autoRefreshClickstream, setAutoRefreshClickstream] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [banReasonModal, setBanReasonModal] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedCodeProblem, setSelectedCodeProblem] = useState(null);
  const [selectedNotesProblem, setSelectedNotesProblem] = useState(null);

  // Feature Switches State
  const [featureSettings, setFeatureSettings] = useState({
    showProblems: false,
    showLeaderboard: false,
    compilerEnabled: true,
    compilerMaxRunsPerMinute: 15,
  });
  const [isFeaturesLoading, setIsFeaturesLoading] = useState(false);

  const loadFeatureSettings = async () => {
    try {
      setIsFeaturesLoading(true);
      const data = await fetchAdminFeatures();
      if (data) {
        setFeatureSettings({
          showProblems: !!data.showProblems,
          showLeaderboard: !!data.showLeaderboard,
          compilerEnabled: data.compilerEnabled ?? true,
          compilerMaxRunsPerMinute: data.compilerMaxRunsPerMinute ?? 15,
        });
      }
    } catch (err) {
      console.error('Failed to load feature settings:', err);
    } finally {
      setIsFeaturesLoading(false);
    }
  };

  const handleSaveFeatureSettings = async () => {
    try {
      await updateAdminFeatures(featureSettings);
      toast.success('Feature visibility and switches updated successfully! 🚀');
    } catch (err) {
      toast.error('Failed to update feature switches');
    }
  };

  // Compiler & Rate Limiter Control State
  const [compilerSettings, setCompilerSettings] = useState({ enabled: true, maxRunsPerMinute: 15 });
  const [isCompilerLoading, setIsCompilerLoading] = useState(false);
  const [isSavingCompiler, setIsSavingCompiler] = useState(false);

  const fetchCompilerSettings = async () => {
    try {
      setIsCompilerLoading(true);
      const data = await adminService.getCompilerSettings();
      if (data) setCompilerSettings(data);
    } catch (err) {
      console.error('Failed to fetch compiler settings:', err);
    } finally {
      setIsCompilerLoading(false);
    }
  };

  const handleSaveCompilerSettings = async () => {
    try {
      setIsSavingCompiler(true);
      const res = await adminService.updateCompilerSettings(compilerSettings);
      toast.success(res.message || 'Compiler settings saved!');
      if (res.settings) setCompilerSettings(res.settings);
    } catch (err) {
      toast.error('Failed to save compiler settings');
    } finally {
      setIsSavingCompiler(false);
    }
  };

  // Bucket form state
  const [bucketMode, setBucketMode] = useState('form'); // 'form' | 'json' | 'csv'
  const csvFileInputRef = useRef(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvDragOver, setCsvDragOver] = useState(false);
  const [bucketJson, setBucketJson] = useState('');
  const [bucketForm, setBucketForm] = useState({
    name: '',
    description: '',
    category: 'dsa',
    icon: 'BookOpen',
    color: '#00FF88',
    problems: [],
  });
  const [newProblem, setNewProblem] = useState({
    title: '',
    topic: '',
    difficulty: 'medium',
    problemLink: '',
    articleLink: '',
    youtubeLink: '',
  });

  // Problem Management & Approvals State
  const [pendingProblems, setPendingProblems] = useState([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [adminProblems, setAdminProblems] = useState([]);
  const [adminProblemCounts, setAdminProblemCounts] = useState({ total: 0, pending: 0, published: 0, draft: 0 });
  const [adminProblemTab, setAdminProblemTab] = useState('all');
  const [adminProblemSearch, setAdminProblemSearch] = useState('');
  const [adminProblemDifficulty, setAdminProblemDifficulty] = useState('all');
  const [isLoadingAdminProblems, setIsLoadingAdminProblems] = useState(false);
  const [deleteProblemModal, setDeleteProblemModal] = useState(null);
  const [isDeletingProblem, setIsDeletingProblem] = useState(false);

  const fetchAdminProblems = async () => {
    try {
      setIsLoadingAdminProblems(true);
      const res = await judgeService.getAllAdminProblems({
        status: adminProblemTab,
        difficulty: adminProblemDifficulty,
        search: adminProblemSearch,
      });
      if (res.success) {
        setAdminProblems(res.data || []);
        if (res.counts) {
          setAdminProblemCounts(res.counts);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin problems:', err);
    } finally {
      setIsLoadingAdminProblems(false);
    }
  };

  const fetchPendingProblems = async () => {
    try {
      setIsLoadingPending(true);
      const res = await judgeService.getPendingProblems();
      if (res.success) {
        setPendingProblems(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending problems:', err);
    } finally {
      setIsLoadingPending(false);
    }
  };

  const handleReviewProblem = async (id, status) => {
    try {
      const res = await judgeService.reviewProblem(id, status);
      toast.success(res.message || 'Problem updated successfully!');
      fetchPendingProblems();
      fetchAdminProblems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to review problem');
    }
  };

  const handleDeleteProblem = async (id) => {
    try {
      setIsDeletingProblem(true);
      const res = await judgeService.deleteProblem(id);
      toast.success(res.message || 'Problem deleted successfully!');
      setDeleteProblemModal(null);
      fetchAdminProblems();
      fetchPendingProblems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete problem');
    } finally {
      setIsDeletingProblem(false);
    }
  };

  // Roadmap Manager State
  const [roadmapWorlds, setRoadmapWorlds] = useState([]);
  const [isLoadingRoadmaps, setIsLoadingRoadmaps] = useState(false);
  const [selectedWorld, setSelectedWorld] = useState(null);
  const [isSavingWorld, setIsSavingWorld] = useState(false);
  const [newRoadmapProblem, setNewRoadmapProblem] = useState({
    title: '',
    difficulty: 'easy',
    xp: 10,
    url: '',
    tags: '',
    blind75: true,
    rabbit150: true,
    running175: true,
    judgeSlug: '',
  });

  const fetchRoadmapWorlds = async () => {
    try {
      setIsLoadingRoadmaps(true);
      const res = await adminService.getRoadmapWorlds();
      if (res.success) {
        setRoadmapWorlds(res.data || []);
        if (res.data?.length > 0 && !selectedWorld) {
          setSelectedWorld(res.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch roadmap worlds:', err);
    } finally {
      setIsLoadingRoadmaps(false);
    }
  };

  const handleSaveRoadmapWorld = async (worldData) => {
    try {
      setIsSavingWorld(true);
      const res = await adminService.upsertRoadmapWorld(worldData);
      toast.success(res.message || 'Roadmap world saved!');
      fetchRoadmapWorlds();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save roadmap world');
    } finally {
      setIsSavingWorld(false);
    }
  };

  const handleDeleteRoadmapWorld = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Roadmap World?')) return;
    try {
      const res = await adminService.deleteRoadmapWorld(id);
      toast.success(res.message || 'World deleted');
      fetchRoadmapWorlds();
      setSelectedWorld(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete world');
    }
  };

  // Easy Link Search helper state
  const [easySearchResults, setEasySearchResults] = useState([]);
  const [isSearchingEasy, setIsSearchingEasy] = useState(false);

  const handleSearchJudgeProblems = async (query) => {
    if (!query || query.trim().length < 2) {
      setEasySearchResults([]);
      return;
    }
    try {
      setIsSearchingEasy(true);
      const res = await judgeService.searchProblems(query, 6);
      if (res.success) {
        setEasySearchResults(res.data || []);
      }
    } catch (err) {
      console.error('Easy search failed:', err);
    } finally {
      setIsSearchingEasy(false);
    }
  };

  // Individual Problem Linker Modal State
  const [linkingModal, setLinkingModal] = useState(null); // { index, problem, isBoss }
  const [linkingSearchQuery, setLinkingSearchQuery] = useState('');
  const [linkingResults, setLinkingResults] = useState([]);
  const [isLinkingSearching, setIsLinkingSearching] = useState(false);
  const [customSlugInput, setCustomSlugInput] = useState('');

  const openLinkModal = async (index, problem, isBoss = false) => {
    setLinkingModal({ index, problem, isBoss });
    const cleanTitle = (problem.title || '').replace(/^\d+[\.\s\-]+/, '').trim();
    setLinkingSearchQuery(cleanTitle);
    setCustomSlugInput(problem.judgeSlug || '');
    try {
      setIsLinkingSearching(true);
      const res = await judgeService.searchProblems(cleanTitle, 8);
      if (res.success) {
        setLinkingResults(res.data || []);
      }
    } catch (err) {
      console.error('Search linking failed:', err);
    } finally {
      setIsLinkingSearching(false);
    }
  };

  const handleSearchLinking = async (q) => {
    setLinkingSearchQuery(q);
    if (!q || q.trim().length < 1) {
      setLinkingResults([]);
      return;
    }
    try {
      setIsLinkingSearching(true);
      const res = await judgeService.searchProblems(q, 8);
      if (res.success) {
        setLinkingResults(res.data || []);
      }
    } catch (err) {
      console.error('Search linking failed:', err);
    } finally {
      setIsLinkingSearching(false);
    }
  };

  const attachJudgeProblemToRow = (judgeProb) => {
    if (!linkingModal || !selectedWorld) return;
    const { index, isBoss } = linkingModal;

    if (isBoss) {
      const updatedBossProblems = [...(selectedWorld.bossLevel?.problems || [])];
      updatedBossProblems[index] = {
        ...updatedBossProblems[index],
        judgeSlug: judgeProb.slug,
        judgeProblem: judgeProb._id,
        url: `/solve/${judgeProb.slug}`,
      };
      setSelectedWorld({
        ...selectedWorld,
        bossLevel: { ...selectedWorld.bossLevel, problems: updatedBossProblems },
      });
    } else {
      const updated = [...selectedWorld.problems];
      updated[index] = {
        ...updated[index],
        judgeSlug: judgeProb.slug,
        judgeProblem: judgeProb._id,
        url: `/solve/${judgeProb.slug}`,
      };
      setSelectedWorld({ ...selectedWorld, problems: updated });
    }

    toast.success(`Linked "${judgeProb.title}" to Level #${index + 1}! ⚡`);
    setLinkingModal(null);
  };

  const attachCustomSlugToRow = () => {
    if (!linkingModal || !selectedWorld || !customSlugInput.trim()) return;
    const { index, isBoss } = linkingModal;
    const cleanSlug = customSlugInput.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '');

    if (isBoss) {
      const updatedBossProblems = [...(selectedWorld.bossLevel?.problems || [])];
      updatedBossProblems[index] = {
        ...updatedBossProblems[index],
        judgeSlug: cleanSlug,
        url: `/solve/${cleanSlug}`,
      };
      setSelectedWorld({
        ...selectedWorld,
        bossLevel: { ...selectedWorld.bossLevel, problems: updatedBossProblems },
      });
    } else {
      const updated = [...selectedWorld.problems];
      updated[index] = {
        ...updated[index],
        judgeSlug: cleanSlug,
        url: `/solve/${cleanSlug}`,
      };
      setSelectedWorld({ ...selectedWorld, problems: updated });
    }

    toast.success(`Attached slug "/solve/${cleanSlug}"! ⚡`);
    setLinkingModal(null);
  };

  const unlinkProblemFromRow = (idx, isBoss = false) => {
    if (!selectedWorld) return;
    if (isBoss) {
      const updatedBossProblems = [...(selectedWorld.bossLevel?.problems || [])];
      updatedBossProblems[idx] = {
        ...updatedBossProblems[idx],
        judgeSlug: '',
        judgeProblem: undefined,
      };
      setSelectedWorld({
        ...selectedWorld,
        bossLevel: { ...selectedWorld.bossLevel, problems: updatedBossProblems },
      });
    } else {
      const updated = [...selectedWorld.problems];
      updated[idx] = {
        ...updated[idx],
        judgeSlug: '',
        judgeProblem: undefined,
      };
      setSelectedWorld({ ...selectedWorld, problems: updated });
    }
    toast.success('Unlinked internal problem');
    if (linkingModal) setLinkingModal(null);
  };

  const handleAutoLinkAllProblems = async () => {
    if (!selectedWorld || !selectedWorld.problems || selectedWorld.problems.length === 0) {
      toast.error('No problems in this world to link');
      return;
    }
    try {
      const toastId = toast.loading('Searching Arena for matching problems...');
      const res = await judgeService.searchProblems('', 100);
      const allJudgeProbs = res.data || [];

      let matchCount = 0;
      const updatedProblems = selectedWorld.problems.map((p) => {
        if (p.judgeSlug) return p; // already linked
        const cleanTitle = (p.title || '').replace(/^\d+[\.\s\-]+/, '').toLowerCase().trim();
        const matched = allJudgeProbs.find(
          (jp) =>
            jp.title.toLowerCase().trim() === cleanTitle ||
            jp.slug.toLowerCase() === cleanTitle.replace(/[^a-z0-9]+/g, '-')
        );
        if (matched) {
          matchCount++;
          return {
            ...p,
            judgeSlug: matched.slug,
            judgeProblem: matched._id,
            url: `/solve/${matched.slug}`,
          };
        }
        return p;
      });

      setSelectedWorld({ ...selectedWorld, problems: updatedProblems });
      toast.dismiss(toastId);
      if (matchCount > 0) {
        toast.success(`Auto-linked ${matchCount} problems with Arena! 🎉`);
      } else {
        toast.info('No new exact name matches found in Arena. You can link problems manually using the "Link" button!');
      }
    } catch (err) {
      console.error('Auto link failed:', err);
      toast.error('Failed to auto-link problems');
    }
  };

  useEffect(() => {
    checkAuth?.();
    loadFeatureSettings();
    fetchStats();
    fetchUsers();
    fetchSystemAnalytics();
    fetchCompilerSettings();
    fetchPendingProblems();
    fetchAdminProblems();
    fetchRoadmapWorlds();
    fetchClickstream({ eventType: clickstreamFilterType, search: clickstreamSearch });
    fetchIpStats();
    fetchTopClicks();
  }, []);

  useEffect(() => {
    fetchAdminProblems();
  }, [adminProblemTab, adminProblemDifficulty, adminProblemSearch]);

  useEffect(() => {
    if (!autoRefreshClickstream) return;
    const interval = setInterval(() => {
      fetchClickstream({ eventType: clickstreamFilterType, search: clickstreamSearch });
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefreshClickstream, clickstreamFilterType, clickstreamSearch]);

  const handleSearch = () => {
    fetchUsers(searchQuery);
  };

  const handleToggleBan = async (userId) => {
    const targetUser = users.find((u) => u._id === userId);
    if (targetUser?.isBanned) {
      // Unban directly
      const result = await toggleBanUser(userId);
      if (result.success) {
        toast.success(result.message);
        fetchStats();
      } else {
        toast.error(result.error);
      }
    } else {
      // Show ban reason modal
      setBanReasonModal(userId);
      setBanReason('');
    }
  };

  const confirmBan = async () => {
    if (!banReasonModal) return;
    const result = await toggleBanUser(banReasonModal, banReason);
    if (result.success) {
      toast.success(result.message);
      fetchStats();
    } else {
      toast.error(result.error);
    }
    setBanReasonModal(null);
    setBanReason('');
  };

  const addProblemToForm = () => {
    if (!newProblem.title.trim() || !newProblem.topic.trim()) {
      toast.error('Problem title and topic are required');
      return;
    }
    setBucketForm((prev) => ({
      ...prev,
      problems: [...prev.problems, { ...newProblem, order: prev.problems.length }],
    }));
    setNewProblem({
      title: '',
      topic: '',
      difficulty: 'medium',
      problemLink: '',
      articleLink: '',
      youtubeLink: '',
    });
  };

  const removeProblem = (index) => {
    setBucketForm((prev) => ({
      ...prev,
      problems: prev.problems.filter((_, i) => i !== index),
    }));
  };

  const handleCsvFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a .csv file');
      return;
    }
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const problems = parseCSVToProblems(text);
      if (problems.length === 0) {
        toast.error('No valid problems found in CSV. Check the format.');
        return;
      }
      setBucketForm((prev) => ({
        ...prev,
        problems: [...prev.problems, ...problems],
      }));
      toast.success(`Parsed ${problems.length} problems from CSV`);
    };
    reader.readAsText(file);
  };

  const handleCsvDrop = (e) => {
    e.preventDefault();
    setCsvDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    handleCsvFile(file);
  };

  const downloadCsvTemplate = () => {
    const content = [CSV_TEMPLATE_HEADER, ...CSV_TEMPLATE_ROWS].join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bucket-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpsertBucket = async () => {
    let data;

    if (bucketMode === 'json') {
      try {
        data = JSON.parse(bucketJson);
      } catch {
        toast.error('Invalid JSON format');
        return;
      }
    } else {
      if (!bucketForm.name.trim()) {
        toast.error('Bucket name is required');
        return;
      }
      data = { ...bucketForm };
    }

    const result = await upsertBucket(data);
    if (result.success) {
      toast.success(`Bucket "${result.bucket.name}" saved with ${result.bucket.totalProblems} problems`);
      // Reset form
      setBucketForm({
        name: '',
        description: '',
        category: 'dsa',
        icon: 'BookOpen',
        color: '#00FF88',
        problems: [],
      });
      setBucketJson('');
      setCsvFileName('');
    } else {
      toast.error(result.error);
    }
  };

  const isAdmin = user?.role === 'admin';

  // Guard: wait for auth loading
  if (isAuthLoading && !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-white/10 border-t-neon-green rounded-full animate-spin mx-auto" />
          <p className="text-xs text-dark-400">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }

  // Guard: only admins
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-dark-400">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-red-500/20 flex items-center justify-center border border-amber-500/30">
          <Shield className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm text-dark-400">Manage users and content</p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            { label: 'Total Users', value: stats.totalUsers || 0, icon: Users, color: '#4ECDC4' },
            { label: 'Active Users', value: stats.activeUsers || 0, icon: UserCheck, color: '#39FF14' },
            { label: 'Banned Users', value: stats.bannedUsers || 0, icon: UserX, color: '#FF6B6B' },
            { label: 'Total Posts', value: stats.totalPosts || 0, icon: BarChart3, color: '#45B7D1' },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={16} style={{ color: stat.color }} />
                <span className="text-xs text-dark-400">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Tab Buttons */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'features', label: 'Feature Switches', icon: Zap },
          { 
            id: 'approvals', 
            label: 'Problem Management & Approvals', 
            icon: Code, 
            badge: (adminProblemCounts?.pending || (Array.isArray(pendingProblems) ? pendingProblems.length : 0)) 
          },
          { id: 'roadmaps', label: 'Roadmap Manager', icon: MapIcon },
          { id: 'buckets', label: 'Bucket Manager', icon: Package },
          { id: 'analytics', label: 'System Analytics', icon: Activity },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'compiler', label: 'Compiler & Rate Limiter', icon: Cpu },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                : 'bg-dark-800/50 text-dark-400 hover:text-white border border-dark-700/50 hover:border-dark-600'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {typeof tab.badge === 'number' && tab.badge > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold animate-pulse">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Feature Switches Tab */}
      {activeTab === 'features' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="text-neon-green" size={20} />
                Feature Switches & Section Visibility
              </h2>
              <p className="text-xs text-dark-400 mt-1">
                Toggle public sections and platform modules on or off without redeploying.
              </p>
            </div>
            <button
              onClick={loadFeatureSettings}
              disabled={isFeaturesLoading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-xs font-medium text-white border border-dark-700 transition"
            >
              <Clock className={`w-3.5 h-3.5 text-neon-green ${isFeaturesLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Problems Section Switch */}
            <div className={`p-5 rounded-2xl border transition-all ${
              featureSettings.showProblems
                ? 'bg-neon-green/5 border-neon-green/30 shadow-[0_0_25px_rgba(57,255,20,0.05)]'
                : 'bg-dark-800/50 border-dark-700/60 opacity-90'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    featureSettings.showProblems
                      ? 'bg-neon-green/10 text-neon-green border-neon-green/30'
                      : 'bg-dark-700/50 text-dark-400 border-white/5'
                  }`}>
                    <Code size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Problems Section</h3>
                    <p className="text-xs text-dark-400 mt-0.5">
                      Legacy problems directory and problem search.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFeatureSettings(prev => ({ ...prev, showProblems: !prev.showProblems }))}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                    featureSettings.showProblems ? 'bg-neon-green justify-end' : 'bg-dark-700 justify-start'
                  }`}
                >
                  <motion.div
                    layout
                    className={`w-4 h-4 rounded-full shadow-md ${
                      featureSettings.showProblems ? 'bg-dark-950' : 'bg-dark-400'
                    }`}
                  />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-dark-400">Current Status:</span>
                <span className={`font-semibold px-2.5 py-0.5 rounded-full ${
                  featureSettings.showProblems
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                }`}>
                  {featureSettings.showProblems ? '● Visible to Users' : '○ Hidden from Sidebar'}
                </span>
              </div>
            </div>

            {/* Leaderboard Section Switch */}
            <div className={`p-5 rounded-2xl border transition-all ${
              featureSettings.showLeaderboard
                ? 'bg-neon-green/5 border-neon-green/30 shadow-[0_0_25px_rgba(57,255,20,0.05)]'
                : 'bg-dark-800/50 border-dark-700/60 opacity-90'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    featureSettings.showLeaderboard
                      ? 'bg-neon-green/10 text-neon-green border-neon-green/30'
                      : 'bg-dark-700/50 text-dark-400 border-white/5'
                  }`}>
                    <Trophy size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Leaderboard Section</h3>
                    <p className="text-xs text-dark-400 mt-0.5">
                      Global, weekly, and monthly competition standings.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFeatureSettings(prev => ({ ...prev, showLeaderboard: !prev.showLeaderboard }))}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                    featureSettings.showLeaderboard ? 'bg-neon-green justify-end' : 'bg-dark-700 justify-start'
                  }`}
                >
                  <motion.div
                    layout
                    className={`w-4 h-4 rounded-full shadow-md ${
                      featureSettings.showLeaderboard ? 'bg-dark-950' : 'bg-dark-400'
                    }`}
                  />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-dark-400">Current Status:</span>
                <span className={`font-semibold px-2.5 py-0.5 rounded-full ${
                  featureSettings.showLeaderboard
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                }`}>
                  {featureSettings.showLeaderboard ? '● Visible to Users' : '○ Hidden from Sidebar'}
                </span>
              </div>
            </div>
          </div>

          {/* Save Action Card */}
          <div className="flex items-center justify-between p-5 rounded-2xl bg-dark-800/50 border border-dark-700/50">
            <div>
              <p className="text-sm font-semibold text-white">Apply Feature Switch Changes</p>
              <p className="text-xs text-dark-400 mt-0.5">
                Updates are pushed immediately across all client sessions.
              </p>
            </div>
            <button
              onClick={handleSaveFeatureSettings}
              disabled={isSavingFeatures}
              className="px-6 py-2.5 rounded-xl bg-neon-green hover:brightness-110 text-dark-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-neon-green/20 disabled:opacity-50 transition active:scale-95 cursor-pointer"
            >
              {isSavingFeatures ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSavingFeatures ? 'Saving...' : 'Save Switches'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Compiler Tab */}
      {activeTab === 'compiler' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6 space-y-6"
        >
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Cpu className="text-neon-green" size={20} />
              Compiler & Code Execution Controls
            </h2>
            <p className="text-xs text-dark-400 mt-1">
              Configure judge execution servers and client rate limits for code runs.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-dark-900/50 border border-dark-700/50">
              <div>
                <h4 className="font-semibold text-white text-sm">Enable Code Execution</h4>
                <p className="text-xs text-dark-400 mt-0.5">Toggle live sandbox execution in Playground and Arena</p>
              </div>
              <button
                type="button"
                onClick={() => setCompilerSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                  compilerSettings.enabled ? 'bg-neon-green justify-end' : 'bg-dark-700 justify-start'
                }`}
              >
                <div className={`w-4 h-4 rounded-full shadow-md ${compilerSettings.enabled ? 'bg-dark-950' : 'bg-dark-400'}`} />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-dark-900/50 border border-dark-700/50 space-y-2">
              <label className="block text-sm font-semibold text-white">Max Code Runs / Minute per User</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={compilerSettings.maxRunsPerMinute}
                  onChange={(e) => setCompilerSettings(prev => ({ ...prev, maxRunsPerMinute: parseInt(e.target.value) || 15 }))}
                  className="bg-dark-800 border border-dark-600/50 rounded-xl px-4 py-2 text-white text-sm w-32 focus:outline-none focus:border-neon-green"
                />
                <span className="text-xs text-dark-400">Default is 15 runs/min to prevent judge abuse.</span>
              </div>
            </div>

            <button
              onClick={handleSaveCompilerSettings}
              disabled={isSavingCompiler}
              className="px-6 py-2.5 rounded-xl bg-neon-green hover:brightness-110 text-dark-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-neon-green/20 disabled:opacity-50 transition"
            >
              {isSavingCompiler ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Compiler Settings
            </button>
          </div>
        </motion.div>
      )}

      {/* Problem Management & Approvals Tab */}
      {activeTab === 'approvals' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header & Quick Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-4 sm:p-5">
            <div>
              <div className="flex items-center gap-2">
                <Code className="text-neon-green" size={22} />
                <h2 className="text-xl font-bold text-white">Problem Management & Approvals</h2>
              </div>
              <p className="text-xs text-dark-400 mt-1">
                Manage, edit, publish, reject, and permanently delete coding problems across the Arena and Roadmaps.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/studio"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neon-green hover:brightness-110 text-dark-950 text-xs font-bold transition shadow-md shadow-neon-green/20"
              >
                <Plus size={15} /> Create Problem in Studio
              </a>
              <button
                onClick={() => {
                  fetchAdminProblems();
                  fetchPendingProblems();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dark-700 hover:bg-dark-600 text-xs font-semibold text-white border border-dark-600 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-neon-green" /> Refresh
              </button>
            </div>
          </div>

          {/* Sub-Filters / Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All Problems', count: adminProblemCounts?.total },
              { id: 'pending', label: 'Pending Review', count: adminProblemCounts?.pending, isAmber: true },
              { id: 'published', label: 'Published & Live', count: adminProblemCounts?.published, isGreen: true },
              { id: 'draft', label: 'Drafts & Rejected', count: adminProblemCounts?.draft },
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setAdminProblemTab(sub.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  adminProblemTab === sub.id
                    ? 'bg-neon-green text-dark-950 shadow-md shadow-neon-green/20'
                    : 'bg-dark-800/60 text-dark-300 hover:text-white border border-dark-700/60 hover:border-dark-600'
                }`}
              >
                {sub.label}
                {typeof sub.count === 'number' && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    adminProblemTab === sub.id 
                      ? 'bg-dark-950/20 text-dark-950' 
                      : sub.isAmber && sub.count > 0 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : sub.isGreen && sub.count > 0
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-dark-700 text-dark-300'
                  }`}>
                    {sub.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search & Difficulty Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-dark-800/40 border border-dark-700/50 rounded-2xl p-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                type="text"
                value={adminProblemSearch}
                onChange={(e) => setAdminProblemSearch(e.target.value)}
                placeholder="Search problem title, slug, tags, or author..."
                className="w-full bg-dark-900 border border-dark-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/50"
              />
            </div>

            <select
              value={adminProblemDifficulty}
              onChange={(e) => setAdminProblemDifficulty(e.target.value)}
              className="bg-dark-900 border border-dark-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-green/50"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Problems Table */}
          <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl overflow-hidden shadow-xl">
            {isLoadingAdminProblems && adminProblems.length === 0 ? (
              <div className="p-16 text-center text-dark-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-neon-green mb-2" />
                Loading problems from database...
              </div>
            ) : !Array.isArray(adminProblems) || adminProblems.length === 0 ? (
              <div className="p-16 text-center text-dark-400 space-y-3">
                <Code className="w-10 h-10 mx-auto text-dark-600" />
                <h3 className="text-base font-bold text-white">No Problems Found</h3>
                <p className="text-xs text-dark-500 max-w-sm mx-auto">
                  {adminProblemSearch ? 'No problems matched your search criteria.' : 'Create new coding problems in Problem Setter Studio to start.'}
                </p>
                <a
                  href="/studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neon-green text-dark-950 text-xs font-bold transition shadow-md shadow-neon-green/20"
                >
                  <Plus size={14} /> Open Studio
                </a>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-dark-700/50 bg-white/[0.02]">
                      <th className="px-4 py-3.5 text-xs font-bold text-dark-400 uppercase tracking-wider">Problem Details</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-dark-400 uppercase tracking-wider">Difficulty</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-dark-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-dark-400 uppercase tracking-wider">Author / Setter</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-dark-400 uppercase tracking-wider">Testcases</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-dark-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/30">
                    {adminProblems.map((prob) => {
                      const isPending = prob.status === 'pending';
                      const isPublished = prob.status === 'published';
                      return (
                        <tr key={prob._id} className="hover:bg-white/[0.02] transition text-xs">
                          {/* Title & Slug */}
                          <td className="px-4 py-3.5">
                            <div className="space-y-1">
                              <div className="font-bold text-white text-sm hover:text-neon-green transition">
                                {prob.title}
                              </div>
                              <div className="text-[11px] text-dark-400 font-mono flex items-center gap-1.5">
                                <span>/solve/{prob.slug}</span>
                              </div>
                              {Array.isArray(prob.tags) && prob.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {prob.tags.slice(0, 4).map((t, idx) => (
                                    <span key={idx} className="text-[10px] px-1.5 py-0.2 rounded bg-dark-900 text-dark-300 border border-white/5 font-mono">
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Difficulty */}
                          <td className="px-4 py-3.5">
                            <span
                              className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                                prob.difficulty === 'Easy'
                                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                                  : prob.difficulty === 'Medium'
                                  ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                                  : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                              }`}
                            >
                              {prob.difficulty}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            {isPublished ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Live
                              </span>
                            ) : isPending ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit animate-pulse">
                                <Clock size={11} />
                                Pending Review
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-dark-700 text-dark-400 border border-dark-600 flex items-center gap-1 w-fit">
                                Draft
                              </span>
                            )}
                          </td>

                          {/* Author */}
                          <td className="px-4 py-3.5">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-white truncate max-w-[130px]">{prob.author?.name || 'Admin'}</div>
                              <div className="text-[11px] text-dark-400 truncate max-w-[130px]">{prob.author?.email || 'System'}</div>
                            </div>
                          </td>

                          {/* Testcases Count */}
                          <td className="px-4 py-3.5">
                            <div className="text-dark-300 font-mono text-[11px]">
                              <span>{prob.examples?.length || 0} ex · {prob.visibleTestcases?.length || 0} testcases</span>
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Preview / Solve */}
                              <a
                                href={`/solve/${prob.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition border border-white/5 cursor-pointer"
                                title="Solve / Preview Problem"
                              >
                                <Eye size={14} />
                              </a>

                              {/* Edit in Studio */}
                              <a
                                href={`/studio`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-cyan-400 transition border border-white/5 cursor-pointer"
                                title="Edit in Studio"
                              >
                                <ExternalLink size={14} />
                              </a>

                              {/* Quick Status Toggle */}
                              {isPending ? (
                                <>
                                  <button
                                    onClick={() => handleReviewProblem(prob._id, 'draft')}
                                    className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-[11px] font-semibold border border-rose-500/20 transition cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                  <button
                                    onClick={() => handleReviewProblem(prob._id, 'published')}
                                    className="px-2.5 py-1 rounded-lg bg-neon-green hover:brightness-110 text-dark-950 text-[11px] font-bold transition shadow-sm cursor-pointer"
                                  >
                                    Publish ✨
                                  </button>
                                </>
                              ) : isPublished ? (
                                <button
                                  onClick={() => handleReviewProblem(prob._id, 'draft')}
                                  className="px-2 py-1 rounded-lg bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white text-[11px] font-medium border border-dark-600 transition cursor-pointer"
                                  title="Unpublish and set to draft"
                                >
                                  Unpublish
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReviewProblem(prob._id, 'published')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-dark-950 text-[11px] font-semibold border border-emerald-500/30 transition cursor-pointer"
                                  title="Publish immediately"
                                >
                                  Publish
                                </button>
                              )}

                              {/* Delete Problem Button */}
                              <button
                                onClick={() => setDeleteProblemModal(prob)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition border border-rose-500/20 cursor-pointer"
                                title="Delete Problem permanently"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Delete Problem Confirmation Modal */}
          <AnimatePresence>
            {deleteProblemModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-dark-900 border border-dark-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
                >
                  <div className="flex items-center gap-3 text-rose-400">
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Permanently Delete Problem?</h3>
                      <p className="text-xs text-dark-400">This action cannot be undone.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-dark-950 border border-white/5 space-y-1 text-xs">
                    <div className="font-bold text-white">{deleteProblemModal.title}</div>
                    <div className="font-mono text-dark-400">/solve/{deleteProblemModal.slug}</div>
                    <div className="text-dark-500 pt-1">
                      Deleting this will remove all associated testcases and problem references.
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteProblemModal(null)}
                      disabled={isDeletingProblem}
                      className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-xs font-semibold text-white border border-dark-700 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProblem(deleteProblemModal._id)}
                      disabled={isDeletingProblem}
                      className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-xs font-bold text-white shadow-lg shadow-rose-500/20 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {isDeletingProblem ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      {isDeletingProblem ? 'Deleting...' : 'Yes, Delete Problem'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Roadmap Manager Tab */}
      {activeTab === 'roadmaps' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MapIcon className="text-neon-green" size={20} />
                Dynamic Roadmap Game Worlds
              </h2>
              <p className="text-xs text-dark-400 mt-1">
                Manage themed worlds, problem levels, boss challenges, and visual styles stored live in Azure Cosmos DB.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newW = {
                    id: `world-${Date.now().toString().slice(-4)}`,
                    name: 'New Adventure World',
                    emoji: '🌟',
                    difficulty: 3,
                    estimatedTime: '4-6 hours',
                    description: 'Explore new algorithmic concepts and unlock achievements.',
                    order: roadmapWorlds.length,
                    theme: {
                      bgColor: '#022c22',
                      nodeColor: '#10b981',
                      accent: 'emerald',
                      particleColors: ['#39FF14', '#10b981'],
                      glowColor: 'rgba(16, 185, 129, 0.4)',
                      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
                    },
                    problems: [],
                    bossLevel: {
                      id: `boss-${Date.now().toString().slice(-4)}`,
                      title: 'World Overlord',
                      description: 'Defeat the final boss to unlock the next world.',
                      xp: 100,
                      problems: [],
                    },
                    isActive: true,
                  };
                  setSelectedWorld(newW);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-green text-dark-950 font-bold text-xs hover:brightness-110 transition shadow-md shadow-neon-green/20"
              >
                <Plus className="w-4 h-4" /> Create New World
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* World List Sidebar */}
            <div className="lg:col-span-1 space-y-3">
              <div className="text-xs font-semibold text-dark-400 uppercase tracking-wider px-1">
                Worlds in Cosmos DB ({roadmapWorlds.length})
              </div>
              <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
                {isLoadingRoadmaps ? (
                  <div className="p-8 text-center text-dark-400 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-neon-green mb-2" />
                    Loading worlds...
                  </div>
                ) : roadmapWorlds.length === 0 ? (
                  <div className="p-8 text-center text-dark-400 text-xs border border-dark-700/50 rounded-xl">
                    No worlds found. Click "Create New World".
                  </div>
                ) : (
                  roadmapWorlds.map((w, idx) => (
                    <div
                      key={w.id || idx}
                      onClick={() => setSelectedWorld({ ...w })}
                      className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        selectedWorld?.id === w.id
                          ? 'bg-neon-green/10 border-neon-green/40 shadow-lg shadow-neon-green/5'
                          : 'bg-dark-800/40 border-dark-700/50 hover:border-dark-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{w.emoji || '🏰'}</span>
                        <div>
                          <div className="text-sm font-bold text-white">{w.name}</div>
                          <div className="text-[11px] text-dark-400 font-mono">
                            {w.problems?.length || 0} levels · {w.difficulty}★
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${selectedWorld?.id === w.id ? 'text-neon-green' : 'text-dark-500'}`} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* World Editor Main Area */}
            <div className="lg:col-span-2">
              {selectedWorld ? (
                <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-dark-700/50 pb-4">
                    <div>
                      <span className="text-[10px] text-neon-green font-bold uppercase tracking-wider">World Editor</span>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {selectedWorld.emoji} {selectedWorld.name || 'Untitled World'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteRoadmapWorld(selectedWorld.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition"
                        title="Delete World"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSaveRoadmapWorld(selectedWorld)}
                        disabled={isSavingWorld}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-green hover:brightness-110 text-dark-950 font-bold text-xs transition shadow-md shadow-neon-green/20 disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {isSavingWorld ? 'Saving...' : 'Save World to DB'}
                      </button>
                    </div>
                  </div>

                  {/* World Info Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-dark-400 mb-1 block">World Name *</label>
                      <input
                        type="text"
                        value={selectedWorld.name}
                        onChange={(e) => setSelectedWorld({ ...selectedWorld, name: e.target.value })}
                        className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-green/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-dark-400 mb-1 block">World ID (Slug) *</label>
                      <input
                        type="text"
                        value={selectedWorld.id}
                        onChange={(e) => setSelectedWorld({ ...selectedWorld, id: e.target.value })}
                        className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-neon-green/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-dark-400 mb-1 block">Emoji</label>
                        <input
                          type="text"
                          value={selectedWorld.emoji}
                          onChange={(e) => setSelectedWorld({ ...selectedWorld, emoji: e.target.value })}
                          className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-center text-white focus:outline-none focus:border-neon-green/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-dark-400 mb-1 block">Difficulty (1-5)</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={selectedWorld.difficulty}
                          onChange={(e) => setSelectedWorld({ ...selectedWorld, difficulty: Number(e.target.value) })}
                          className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-green/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-dark-400 mb-1 block">Description</label>
                    <textarea
                      rows={2}
                      value={selectedWorld.description}
                      onChange={(e) => setSelectedWorld({ ...selectedWorld, description: e.target.value })}
                      className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-neon-green/50"
                    />
                  </div>

                  {/* Theme Colors */}
                  <div className="p-4 rounded-xl bg-dark-900/60 border border-dark-700/50 space-y-3">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-neon-green" /> Theme Styling & Colors
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[11px] text-dark-400 mb-1 block">Background Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedWorld.theme?.bgColor || '#022c22'}
                            onChange={(e) =>
                              setSelectedWorld({
                                ...selectedWorld,
                                theme: { ...selectedWorld.theme, bgColor: e.target.value },
                              })
                            }
                            className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                          />
                          <input
                            type="text"
                            value={selectedWorld.theme?.bgColor || '#022c22'}
                            onChange={(e) =>
                              setSelectedWorld({
                                ...selectedWorld,
                                theme: { ...selectedWorld.theme, bgColor: e.target.value },
                              })
                            }
                            className="w-full bg-dark-950 border border-dark-700 rounded-lg px-2 py-1 text-[11px] font-mono text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-dark-400 mb-1 block">Node / Path Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedWorld.theme?.nodeColor || '#10b981'}
                            onChange={(e) =>
                              setSelectedWorld({
                                ...selectedWorld,
                                theme: { ...selectedWorld.theme, nodeColor: e.target.value },
                              })
                            }
                            className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                          />
                          <input
                            type="text"
                            value={selectedWorld.theme?.nodeColor || '#10b981'}
                            onChange={(e) =>
                              setSelectedWorld({
                                ...selectedWorld,
                                theme: { ...selectedWorld.theme, nodeColor: e.target.value },
                              })
                            }
                            className="w-full bg-dark-950 border border-dark-700 rounded-lg px-2 py-1 text-[11px] font-mono text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-dark-400 mb-1 block">Accent Keyword</label>
                        <input
                          type="text"
                          value={selectedWorld.theme?.accent || 'emerald'}
                          onChange={(e) =>
                            setSelectedWorld({
                              ...selectedWorld,
                              theme: { ...selectedWorld.theme, accent: e.target.value },
                            })
                          }
                          className="w-full bg-dark-950 border border-dark-700 rounded-lg px-2.5 py-1.5 text-[11px] text-white"
                          placeholder="emerald / amber / violet"
                        />
                      </div>
                    </div>
                  </div>

                  {/* World Problem Levels List with Easy Linking */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Problems in World ({selectedWorld.problems?.length || 0})
                      </h4>
                    </div>

                    {/* EASY LINKING SEARCH BAR */}
                    <div className="relative p-4 rounded-xl bg-neon-green/5 border border-neon-green/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-neon-green flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" /> Easy Link Internal Problem
                        </label>
                        <span className="text-[10px] text-dark-400">Search Cosmos DB Judge Problems</span>
                      </div>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                        <input
                          type="text"
                          placeholder="Type problem name to search and attach (e.g. Two Sum, Valid Anagram)..."
                          onChange={(e) => handleSearchJudgeProblems(e.target.value)}
                          className="w-full bg-dark-900 border border-neon-green/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-neon-green"
                        />
                        {isSearchingEasy && (
                          <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-neon-green animate-spin" />
                        )}
                      </div>

                      {/* Dropdown Results */}
                      {easySearchResults.length > 0 && (
                        <div className="bg-dark-950 border border-neon-green/30 rounded-xl overflow-hidden shadow-2xl divide-y divide-white/5 max-h-48 overflow-y-auto">
                          {easySearchResults.map((prob) => (
                            <div
                              key={prob._id}
                              onClick={() => {
                                const newProblemEntry = {
                                  id: `prob-${Date.now().toString().slice(-4)}`,
                                  title: prob.title,
                                  difficulty: prob.difficulty.toLowerCase(),
                                  xp: prob.difficulty.toLowerCase() === 'easy' ? 10 : prob.difficulty.toLowerCase() === 'medium' ? 25 : 35,
                                  tags: prob.tags || [],
                                  blind75: true,
                                  rabbit150: true,
                                  running175: true,
                                  judgeProblem: prob._id,
                                  judgeSlug: prob.slug,
                                  url: `/solve/${prob.slug}`,
                                };
                                setSelectedWorld({
                                  ...selectedWorld,
                                  problems: [...(selectedWorld.problems || []), newProblemEntry],
                                });
                                setEasySearchResults([]);
                                toast.success(`Linked "${prob.title}" to ${selectedWorld.name}! ✨`);
                              }}
                              className="p-2.5 hover:bg-neon-green/10 flex items-center justify-between cursor-pointer transition"
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                  prob.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
                                  prob.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-rose-500/20 text-rose-400'
                                }`}>
                                  {prob.difficulty}
                                </span>
                                <span className="text-xs font-semibold text-white">{prob.title}</span>
                                <span className="text-[10px] text-dark-400 font-mono">/solve/{prob.slug}</span>
                              </div>
                              <span className="text-xs text-neon-green font-bold flex items-center gap-1">
                                <Plus className="w-3.5 h-3.5" /> Attach
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Header above list */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Problems in World ({selectedWorld.problems?.length || 0})
                      </h4>
                      <button
                        onClick={handleAutoLinkAllProblems}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neon-green/10 hover:bg-neon-green/20 text-neon-green text-xs font-bold border border-neon-green/30 transition shadow-sm"
                        title="Search Arena problems by title and link all matching problems automatically"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Auto-Link Matching Arena Problems ⚡
                      </button>
                    </div>

                    {/* Problems Table / List */}
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {(!selectedWorld.problems || selectedWorld.problems.length === 0) ? (
                        <div className="p-6 text-center text-xs text-dark-400 border border-dark-700/40 rounded-xl">
                          No problems attached yet. Use the Easy Link bar above or add manually.
                        </div>
                      ) : (
                        selectedWorld.problems.map((p, pIdx) => {
                          const isLinkedToJudge = !!p.judgeSlug;
                          return (
                            <div
                              key={p.id || pIdx}
                              className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition ${
                                isLinkedToJudge
                                  ? 'bg-dark-900 border-neon-green/30 shadow-sm shadow-neon-green/5'
                                  : 'bg-dark-900/60 border-dark-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <span className="text-dark-500 font-mono w-5 font-bold">{pIdx + 1}.</span>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-white flex items-center gap-2 flex-wrap">
                                    <span className="truncate">{p.title}</span>
                                    {isLinkedToJudge ? (
                                      <span className="px-2 py-0.5 rounded-full bg-neon-green/15 text-neon-green text-[10px] font-mono font-bold border border-neon-green/40 flex items-center gap-1">
                                        <Zap className="w-2.5 h-2.5 fill-neon-green" />
                                        /solve/{p.judgeSlug}
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium border border-amber-500/20">
                                        External Only
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-dark-400 font-mono truncate mt-0.5">
                                    {p.url || 'No URL'}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap sm:flex-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  p.difficulty === 'easy' ? 'text-emerald-400 bg-emerald-500/10' :
                                  p.difficulty === 'medium' ? 'text-amber-400 bg-amber-500/10' :
                                  'text-rose-400 bg-rose-500/10'
                                }`}>
                                  {p.difficulty}
                                </span>
                                <span className="text-neon-green font-bold text-[10px]">{p.xp || 10} XP</span>

                                {/* Link / Change Button */}
                                <button
                                  onClick={() => openLinkModal(pIdx, p, false)}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                                    isLinkedToJudge
                                      ? 'bg-white/5 hover:bg-white/10 text-dark-300 hover:text-white border-white/10'
                                      : 'bg-neon-green/15 hover:bg-neon-green text-neon-green hover:text-dark-950 border-neon-green/30 font-bold shadow-sm shadow-neon-green/10'
                                  }`}
                                  title="Connect or change TrackAsap Arena problem statement"
                                >
                                  <Link className="w-3 h-3" />
                                  <span>{isLinkedToJudge ? 'Change Link' : 'Link Arena Problem'}</span>
                                </button>

                                {isLinkedToJudge && (
                                  <a
                                    href={`/solve/${p.judgeSlug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-dark-300 hover:text-white transition border border-white/5"
                                    title="Test Problem Statement"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </a>
                                )}

                                <button
                                  onClick={() => {
                                    const updated = selectedWorld.problems.filter((_, i) => i !== pIdx);
                                    setSelectedWorld({ ...selectedWorld, problems: updated });
                                  }}
                                  className="p-1.5 rounded-lg text-dark-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                                  title="Delete level from world"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Boss Battle Configuration */}
                  <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-red-400" />
                        Boss Challenge Level
                      </div>
                      <span className="text-[10px] text-red-400 font-mono font-bold">
                        +{selectedWorld.bossLevel?.xp || 100} Bonus XP
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-dark-400 mb-1 block">Boss Title</label>
                        <input
                          type="text"
                          value={selectedWorld.bossLevel?.title || ''}
                          onChange={(e) =>
                            setSelectedWorld({
                              ...selectedWorld,
                              bossLevel: { ...selectedWorld.bossLevel, title: e.target.value },
                            })
                          }
                          className="w-full bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          placeholder="e.g. Overlord of Arrays"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-dark-400 mb-1 block">Boss Bonus XP</label>
                        <input
                          type="number"
                          value={selectedWorld.bossLevel?.xp || 100}
                          onChange={(e) =>
                            setSelectedWorld({
                              ...selectedWorld,
                              bossLevel: { ...selectedWorld.bossLevel, xp: Number(e.target.value) },
                            })
                          }
                          className="w-full bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Boss Problems list */}
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-semibold text-dark-300">
                        Boss Level Problems ({selectedWorld.bossLevel?.problems?.length || 0})
                      </div>
                      {(selectedWorld.bossLevel?.problems || []).map((bp, bpIdx) => (
                        <div
                          key={bp.id || bpIdx}
                          className="p-2.5 rounded-lg bg-dark-900 border border-red-500/20 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="truncate">
                            <span className="font-semibold text-white">{bp.title}</span>
                            {bp.judgeSlug && (
                              <span className="ml-2 px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green text-[9px] font-mono border border-neon-green/30">
                                /solve/{bp.judgeSlug}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => openLinkModal(bpIdx, bp, true)}
                              className="px-2 py-1 rounded bg-neon-green/10 text-neon-green text-[10px] font-bold border border-neon-green/30 hover:bg-neon-green hover:text-dark-950 transition"
                            >
                              {bp.judgeSlug ? 'Change Link' : 'Link Arena Problem'}
                            </button>
                            <button
                              onClick={() => {
                                const updated = selectedWorld.bossLevel.problems.filter((_, i) => i !== bpIdx);
                                setSelectedWorld({
                                  ...selectedWorld,
                                  bossLevel: { ...selectedWorld.bossLevel, problems: updated },
                                });
                              }}
                              className="p-1 rounded text-dark-400 hover:text-rose-400 transition"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-12 text-center text-dark-400 border border-dashed border-dark-700 rounded-2xl">
                  Select a world from the left or create a new one to edit.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Analytics & Telemetry Tab */}
      {activeTab === 'analytics' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Analytics Header & Sub-Navigation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-4 sm:p-5">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="text-neon-green" size={22} />
                <h2 className="text-xl font-bold text-white">Full Telemetry & Clickstream Analytics</h2>
              </div>
              <p className="text-xs text-dark-400 mt-1">
                Cosmos DB real-time tracking of every user click, page transition, client IP, and journey.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  fetchClickstream({ eventType: clickstreamFilterType, search: clickstreamSearch });
                  fetchIpStats();
                  fetchTopClicks();
                  fetchSystemAnalytics();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-700 hover:bg-dark-600 text-xs font-semibold text-white border border-dark-600 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-neon-green" /> Refresh
              </button>
            </div>
          </div>

          {/* Sub-Tab Navigation Bar */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'clickstream', label: 'Live Clickstream Feed', icon: MousePointerClick, badge: clickstreamPagination?.total },
              { id: 'journey', label: 'User Journey Inspector', icon: Navigation },
              { id: 'ips', label: 'IP & Session Directory', icon: Globe, badge: ipStats?.length },
              { id: 'top_clicks', label: 'Top UI Targets & Hotspots', icon: Zap },
              { id: 'overview', label: 'Daily Stats & Performance', icon: BarChart3 },
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setAnalyticsSubTab(sub.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  analyticsSubTab === sub.id
                    ? 'bg-neon-green text-dark-950 shadow-md shadow-neon-green/20'
                    : 'bg-dark-800/60 text-dark-300 hover:text-white border border-dark-700/60 hover:border-dark-600'
                }`}
              >
                <sub.icon size={14} />
                {sub.label}
                {typeof sub.badge === 'number' && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    analyticsSubTab === sub.id ? 'bg-dark-950/20 text-dark-950' : 'bg-dark-700 text-dark-300'
                  }`}>
                    {sub.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Sub-Tab 1: Live Clickstream Feed ── */}
          {analyticsSubTab === 'clickstream' && (
            <div className="space-y-4">
              {/* Filter & Live Polling Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-dark-800/40 border border-dark-700/50 rounded-2xl p-4">
                <div className="flex flex-1 items-center gap-2 flex-wrap">
                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                    <input
                      type="text"
                      value={clickstreamSearch}
                      onChange={(e) => {
                        setClickstreamSearch(e.target.value);
                        fetchClickstream({ eventType: clickstreamFilterType, search: e.target.value });
                      }}
                      placeholder="Filter by user, email, IP, clicked text, or page..."
                      className="w-full bg-dark-900 border border-dark-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/50"
                    />
                  </div>

                  {/* Event Type Filter */}
                  <select
                    value={clickstreamFilterType}
                    onChange={(e) => {
                      setClickstreamFilterType(e.target.value);
                      fetchClickstream({ eventType: e.target.value, search: clickstreamSearch });
                    }}
                    className="bg-dark-900 border border-dark-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-green/50"
                  >
                    <option value="all">All Event Types</option>
                    <option value="click">Clicks Only</option>
                    <option value="pageview">Page Views</option>
                    <option value="navigation">Navigation</option>
                    <option value="interaction">Interactions</option>
                    <option value="code_run">Code Runs</option>
                  </select>
                </div>

                {/* Auto-Refresh Toggle */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => setAutoRefreshClickstream(!autoRefreshClickstream)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      autoRefreshClickstream
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-dark-900 text-dark-400 border-dark-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${autoRefreshClickstream ? 'bg-emerald-400 animate-pulse' : 'bg-dark-500'}`} />
                    {autoRefreshClickstream ? 'Live Polling (4s)' : 'Live Polling: Off'}
                  </button>
                </div>
              </div>

              {/* Clickstream Table */}
              <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl overflow-hidden shadow-xl">
                {isClickstreamLoading && clickstream.length === 0 ? (
                  <div className="p-16 text-center text-dark-400 text-xs">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-neon-green mb-2" />
                    Loading live clickstream from Cosmos DB...
                  </div>
                ) : !Array.isArray(clickstream) || clickstream.length === 0 ? (
                  <div className="p-16 text-center text-dark-400 space-y-2">
                    <MousePointerClick className="w-10 h-10 mx-auto text-dark-600" />
                    <h4 className="text-sm font-bold text-white">No Telemetry Events Yet</h4>
                    <p className="text-xs text-dark-500 max-w-sm mx-auto">
                      As users click buttons, navigate sheets, and run code, their events and IPs will appear here in real time.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-dark-700/50 bg-white/[0.02]">
                          <th className="px-4 py-3 text-[11px] font-bold text-dark-400 uppercase tracking-wider">Time</th>
                          <th className="px-4 py-3 text-[11px] font-bold text-dark-400 uppercase tracking-wider">User Identity</th>
                          <th className="px-4 py-3 text-[11px] font-bold text-dark-400 uppercase tracking-wider">Event / Action</th>
                          <th className="px-4 py-3 text-[11px] font-bold text-dark-400 uppercase tracking-wider">Page Route</th>
                          <th className="px-4 py-3 text-[11px] font-bold text-dark-400 uppercase tracking-wider">Client IP & Geo</th>
                          <th className="px-4 py-3 text-[11px] font-bold text-dark-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-700/30">
                        {clickstream.map((evt) => {
                          const isClick = evt.eventType === 'click';
                          const isPage = evt.eventType === 'pageview';
                          return (
                            <tr key={evt._id} className="hover:bg-white/[0.02] transition text-xs">
                              {/* Timestamp */}
                              <td className="px-4 py-3.5 text-dark-300 font-mono whitespace-nowrap">
                                <div>{new Date(evt.timestamp).toLocaleTimeString()}</div>
                                <div className="text-[10px] text-dark-500">{new Date(evt.timestamp).toLocaleDateString()}</div>
                              </td>

                              {/* User Info */}
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-dark-700 flex items-center justify-center font-bold text-white text-xs border border-white/5">
                                    {(evt.userName || 'G')[0]?.toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-white truncate max-w-[130px]">{evt.userName || 'Guest'}</div>
                                    <div className="text-[11px] text-dark-400 truncate max-w-[130px]">{evt.userEmail}</div>
                                  </div>
                                </div>
                              </td>

                              {/* Action / Element Clicked */}
                              <td className="px-4 py-3.5">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      isClick ? 'bg-neon-green/15 text-neon-green border border-neon-green/30' :
                                      isPage ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' :
                                      'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    }`}>
                                      {evt.eventType}
                                    </span>
                                    {evt.element?.tag && (
                                      <span className="text-[10px] font-mono text-dark-400 bg-dark-900 px-1.5 py-0.5 rounded border border-white/5">
                                        &lt;{evt.element.tag}&gt;
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-white font-medium break-words max-w-[280px]">
                                    {evt.element?.text ? `"${evt.element.text}"` : (evt.metadata?.action || 'Interacted with interface')}
                                  </div>
                                </div>
                              </td>

                              {/* Page Route */}
                              <td className="px-4 py-3.5">
                                <div className="font-mono text-xs text-neon-green bg-dark-900/80 px-2 py-1 rounded-lg border border-white/5 inline-block">
                                  {evt.page?.pathname || '/'}
                                </div>
                              </td>

                              {/* IP & Device */}
                              <td className="px-4 py-3.5">
                                <div className="space-y-0.5">
                                  <div className="font-mono text-xs text-cyan-400 font-semibold flex items-center gap-1">
                                    <Globe className="w-3 h-3 text-dark-400" />
                                    {evt.ip || '127.0.0.1'}
                                  </div>
                                  <div className="text-[11px] text-dark-400 flex items-center gap-1">
                                    {evt.device === 'Mobile' ? <Smartphone className="w-3 h-3" /> : <Laptop className="w-3 h-3" />}
                                    <span>{evt.os} · {evt.browser}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Action Buttons */}
                              <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                {evt.userEmail && evt.userEmail !== 'anonymous' && (
                                  <button
                                    onClick={() => {
                                      setJourneySearchEmail(evt.userEmail);
                                      fetchUserJourney(evt.userEmail);
                                      setAnalyticsSubTab('journey');
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[11px] font-semibold border border-white/10 transition cursor-pointer"
                                    title="Inspect complete journey of this user"
                                  >
                                    View Journey →
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination Footer */}
                {clickstreamPagination && clickstreamPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-dark-700/50 bg-dark-900/40 text-xs">
                    <span className="text-dark-400">
                      Page <strong className="text-white">{clickstreamPagination.page}</strong> of <strong className="text-white">{clickstreamPagination.totalPages}</strong> ({clickstreamPagination.total} total events)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={clickstreamPagination.page <= 1}
                        onClick={() => fetchClickstream({ page: clickstreamPagination.page - 1, eventType: clickstreamFilterType, search: clickstreamSearch })}
                        className="px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 disabled:opacity-40 text-white font-medium border border-dark-700 transition cursor-pointer"
                      >
                        ← Previous
                      </button>
                      <button
                        disabled={clickstreamPagination.page >= clickstreamPagination.totalPages}
                        onClick={() => fetchClickstream({ page: clickstreamPagination.page + 1, eventType: clickstreamFilterType, search: clickstreamSearch })}
                        className="px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 disabled:opacity-40 text-white font-medium border border-dark-700 transition cursor-pointer"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Sub-Tab 2: User Journey Inspector ── */}
          {analyticsSubTab === 'journey' && (
            <div className="space-y-6">
              {/* User Search Bar */}
              <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-5 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Navigation className="text-neon-green" size={18} />
                  User Action Journey Inspector
                </h3>
                <div className="flex gap-3 max-w-xl">
                  <input
                    type="email"
                    value={journeySearchEmail}
                    onChange={(e) => setJourneySearchEmail(e.target.value)}
                    placeholder="Enter user email (e.g. user@gmail.com)..."
                    className="flex-1 bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/50"
                  />
                  <button
                    onClick={() => {
                      if (journeySearchEmail.trim()) {
                        fetchUserJourney(journeySearchEmail.trim());
                      }
                    }}
                    disabled={isUserJourneyLoading || !journeySearchEmail.trim()}
                    className="px-5 py-2.5 rounded-xl bg-neon-green hover:brightness-110 text-dark-950 font-bold text-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isUserJourneyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    Inspect User
                  </button>
                </div>
              </div>

              {/* Journey Results */}
              {isUserJourneyLoading ? (
                <div className="p-16 text-center text-dark-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-neon-green mb-2" />
                  Tracing user journey in Cosmos DB...
                </div>
              ) : userJourney ? (
                <div className="space-y-6">
                  {/* User Profile Summary Card */}
                  <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[10px] text-dark-400 font-semibold uppercase">Target Account</span>
                      <p className="text-sm font-bold text-white mt-0.5">{userJourney.email}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-dark-400 font-semibold uppercase">Total Actions Logged</span>
                      <p className="text-sm font-bold text-neon-green mt-0.5">{userJourney.timeline?.length || 0} events</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-dark-400 font-semibold uppercase">Distinct IP Addresses</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(userJourney.distinctIps || []).map((ip, idx) => (
                          <span key={idx} className="font-mono text-[10px] px-2 py-0.5 rounded bg-dark-900 text-cyan-400 border border-white/5">
                            {ip}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-dark-400 font-semibold uppercase">Action Distribution</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {(userJourney.stats || []).map((st) => (
                          <span key={st._id} className="text-[10px] px-2 py-0.5 rounded bg-dark-700 text-white font-semibold">
                            {st._id}: {st.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Vertical Chronological Timeline */}
                  <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6">
                    <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-neon-green" />
                      Step-by-Step Chronological Trail (Latest First)
                    </h4>

                    {(!userJourney.timeline || userJourney.timeline.length === 0) ? (
                      <div className="p-8 text-center text-dark-500 text-xs">
                        No activity recorded for this user email yet.
                      </div>
                    ) : (
                      <div className="relative border-l border-dark-700 ml-4 space-y-6">
                        {userJourney.timeline.map((item, idx) => {
                          const isClick = item.eventType === 'click';
                          return (
                            <div key={item._id || idx} className="relative pl-6 group">
                              {/* Dot */}
                              <div className={`absolute -left-2 top-1 w-4 h-4 rounded-full border-2 border-dark-900 ${
                                isClick ? 'bg-neon-green shadow-[0_0_8px_#39ff14]' : 'bg-cyan-400'
                              }`} />

                              <div className="bg-dark-900/70 border border-dark-700/70 hover:border-dark-600 rounded-xl p-3.5 transition space-y-1.5">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase ${
                                      isClick ? 'bg-neon-green/15 text-neon-green' : 'bg-cyan-500/15 text-cyan-400'
                                    }`}>
                                      {item.eventType}
                                    </span>
                                    <span className="font-mono text-xs text-white font-bold">{item.page?.pathname || '/'}</span>
                                  </div>
                                  <div className="text-[10px] text-dark-400 font-mono">
                                    {new Date(item.timestamp).toLocaleString()}
                                  </div>
                                </div>

                                <div className="text-xs text-dark-200">
                                  {item.element?.text ? (
                                    <span>Clicked: <strong className="text-white font-semibold">"{item.element.text}"</strong></span>
                                  ) : (
                                    <span>Action on <span className="font-mono text-dark-400">&lt;{item.element?.tag || 'element'}&gt;</span></span>
                                  )}
                                </div>

                                <div className="text-[10px] text-dark-500 flex items-center gap-3 pt-1 border-t border-white/5">
                                  <span>IP: <strong className="text-cyan-400 font-mono">{item.ip}</strong></span>
                                  <span>{item.os} · {item.browser}</span>
                                  {item.coordinates?.x != null && (
                                    <span>Coords: ({item.coordinates.x}, {item.coordinates.y})</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-16 text-center text-dark-400 border border-dashed border-dark-700 rounded-2xl space-y-2">
                  <Navigation className="w-10 h-10 mx-auto text-dark-600" />
                  <p className="text-sm font-semibold text-white">Select or search a user email above</p>
                  <p className="text-xs text-dark-500">Track all their button clicks, navigation flows, and IP changes step-by-step.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Sub-Tab 3: IP & Session Intelligence ── */}
          {analyticsSubTab === 'ips' && (
            <div className="space-y-4">
              <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Globe className="text-cyan-400" size={20} />
                      Client IP Directory & Activity Breakdown
                    </h3>
                    <p className="text-xs text-dark-400 mt-0.5">
                      Top active IP addresses, action frequencies, and associated registered accounts.
                    </p>
                  </div>
                  <span className="text-xs text-neon-green font-bold bg-neon-green/10 border border-neon-green/20 px-3 py-1 rounded-xl">
                    {Array.isArray(ipStats) ? ipStats.length : 0} Unique IPs Tracked
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-dark-700/50 bg-white/[0.02]">
                        <th className="px-4 py-3 text-xs font-semibold text-dark-400 uppercase">IP Address</th>
                        <th className="px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Total Clicks</th>
                        <th className="px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Associated Accounts</th>
                        <th className="px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Devices & Browsers</th>
                        <th className="px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Last Active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700/30">
                      {!Array.isArray(ipStats) || ipStats.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-dark-500 text-xs">
                            No IP activity recorded yet. Events will appear here as users interact with the app.
                          </td>
                        </tr>
                      ) : (
                        ipStats.map((item) => (
                          <tr key={item.ip || Math.random()} className="hover:bg-white/[0.02] transition text-xs">
                            <td className="px-4 py-3.5 font-mono text-cyan-400 font-bold">
                              {item.ip}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="font-bold text-white bg-dark-900 px-2.5 py-1 rounded-lg border border-white/5">
                                {item.totalClicks || 0} clicks
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {(item.users || []).map((u, uIdx) => (
                                  <span key={uIdx} className={`text-[10px] px-2 py-0.5 rounded ${
                                    u === 'anonymous' ? 'bg-dark-700 text-dark-400' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  }`}>
                                    {u}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-dark-300 text-[11px]">
                              {(item.devices || []).join(', ')} · {(item.browsers || []).join(', ')}
                            </td>
                            <td className="px-4 py-3.5 text-dark-400 font-mono text-[11px]">
                              {item.lastActive ? new Date(item.lastActive).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Sub-Tab 4: Top UI Targets & Hotspots ── */}
          {analyticsSubTab === 'top_clicks' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Clicked UI Elements */}
              <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-5 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="text-neon-green" size={18} />
                  Top Clicked UI Buttons & Elements
                </h3>

                {(!topClicks?.topElements || topClicks.topElements.length === 0) ? (
                  <div className="p-8 text-center text-dark-500 text-xs">No click data yet</div>
                ) : (
                  <div className="space-y-3">
                    {topClicks.topElements.map((el, idx) => {
                      const maxClicks = topClicks.topElements[0]?.clicks || 1;
                      const pct = Math.round((el.clicks / maxClicks) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-white truncate max-w-[260px]">
                              #{idx + 1}. "{el.text}"
                            </span>
                            <span className="font-bold text-neon-green shrink-0">{el.clicks} clicks</span>
                          </div>
                          <div className="w-full bg-dark-900 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-neon-green h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-dark-500 font-mono">{el.page}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Most Visited Pages */}
              <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-5 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Compass className="text-cyan-400" size={18} />
                  Most Visited Pages & Routes
                </h3>

                {(!topClicks?.topPages || topClicks.topPages.length === 0) ? (
                  <div className="p-8 text-center text-dark-500 text-xs">No pageview data yet</div>
                ) : (
                  <div className="space-y-3">
                    {topClicks.topPages.map((pg, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-dark-900/60 border border-white/5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-dark-500 font-mono font-bold">#{idx + 1}</span>
                          <span className="font-mono text-neon-green font-semibold">{pg.pathname}</span>
                        </div>
                        <span className="font-bold text-white bg-dark-800 px-2.5 py-1 rounded-lg border border-white/5">
                          {pg.count} visits
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Sub-Tab 5: Daily Stats & Server Performance ── */}
          {analyticsSubTab === 'overview' && (
            <div className="space-y-6">
              {systemAnalyticsError && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-xl font-mono text-sm">
                  Error loading analytics: {systemAnalyticsError}
                </div>
              )}

              {/* Daily Analytics Overview */}
              {systemAnalytics && (
                <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-5">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="text-neon-green" size={20} />
                    Daily Overview (Last 7 Days)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-dark-700/50">
                          <th className="px-4 py-3 text-xs font-semibold text-dark-400">Date</th>
                          <th className="px-4 py-3 text-xs font-semibold text-dark-400">Active Users</th>
                          <th className="px-4 py-3 text-xs font-semibold text-dark-400">Problems Solved</th>
                          <th className="px-4 py-3 text-xs font-semibold text-dark-400">Total Errors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!Array.isArray(systemAnalytics) || systemAnalytics.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-6 text-dark-500 text-sm">No analytics data for this period</td>
                          </tr>
                        ) : (
                          systemAnalytics.map((day) => (
                            <tr key={day.date} className="border-b border-dark-700/20 hover:bg-dark-700/20">
                              <td className="px-4 py-3 text-sm text-white">{day.date}</td>
                              <td className="px-4 py-3 text-sm font-medium text-emerald-400">{day.activeUsers}</td>
                              <td className="px-4 py-3 text-sm font-medium text-amber-400">{day.problemsCompleted}</td>
                              <td className="px-4 py-3 text-sm font-medium text-red-400">{day.totalErrors}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Performance Metrics */}
                {systemPerformance && (
                  <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-5">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Clock className="text-cyan-400" size={20} />
                      Performance Metrics
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-dark-900/50">
                        <span className="text-sm text-dark-300">Avg Response Time</span>
                        <span className="text-lg font-bold text-white">{Math.round(systemPerformance.averageResponseTime || 0)}ms</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-dark-900/50">
                        <span className="text-sm text-dark-300">Total Requests</span>
                        <span className="text-lg font-bold text-white">{systemPerformance.totalRequests || 0}</span>
                      </div>
                      <div>
                        <p className="text-xs text-dark-400 mb-2 font-semibold">Slowest Endpoints</p>
                        {Array.isArray(systemPerformance.slowestEndpoints) && systemPerformance.slowestEndpoints.slice(0, 3).map((ep, i) => (
                          <div key={i} className="flex justify-between items-center mb-1">
                            <span className="text-xs text-dark-300 font-mono truncate mr-2">{ep.endpoint}</span>
                            <span className="text-xs text-red-400 font-semibold">{Math.round(ep.avgTime)}ms</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Popular Features */}
                {systemFeatures && (
                  <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-5">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Zap className="text-amber-400" size={20} />
                      Feature Usage
                    </h3>
                    <div className="space-y-3">
                      {!Array.isArray(systemFeatures) || systemFeatures.length === 0 ? (
                        <p className="text-sm text-dark-500 text-center py-4">No feature usage recorded yet</p>
                      ) : (
                        systemFeatures.map((feat) => (
                          <div key={feat._id} className="flex justify-between items-center p-3 rounded-lg bg-dark-900/50">
                            <span className="text-sm font-medium text-white">{feat._id}</span>
                            <span className="text-sm font-bold text-neon-green">{feat.count} uses</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Compiler & Rate Limiter Control Tab */}
      {activeTab === 'compiler' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 max-w-4xl"
        >
          {/* Card 1: Engine Status & Killswitch */}
          <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${compilerSettings.enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  <Cpu size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Compiler Execution Engine
                    {compilerSettings.enabled ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        ● System Active & Online
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                        🔴 Execution Disabled
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-dark-400 mt-0.5">Control global code execution permissions across Python, C++, Java, JavaScript & SQL.</p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => setCompilerSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  compilerSettings.enabled ? 'bg-emerald-500' : 'bg-dark-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    compilerSettings.enabled ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Card 2: Anti-Spam Rate Limiter Controls */}
          <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Anti-Spam Rate Limiting</h3>
                <p className="text-xs text-dark-400 mt-0.5">Limit the maximum number of code executions allowed per user per minute to protect Azure infrastructure.</p>
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-dark-300">Quick Presets (Executions / Minute):</label>
              <div className="flex gap-2 flex-wrap">
                {[5, 10, 15, 20, 30, 60].map(val => (
                  <button
                    key={val}
                    onClick={() => setCompilerSettings(prev => ({ ...prev, maxRunsPerMinute: val }))}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      compilerSettings.maxRunsPerMinute === val
                        ? 'bg-neon-green/20 text-neon-green border-neon-green/40 shadow-lg shadow-neon-green/10'
                        : 'bg-dark-900/50 text-dark-300 border-dark-700 hover:border-dark-600 hover:text-white'
                    }`}
                  >
                    {val} runs / min
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="flex items-center gap-4 bg-black/30 p-4 rounded-xl border border-dark-700/50">
              <div className="flex-1 space-y-1">
                <span className="text-xs font-semibold text-white">Custom Executions Limit</span>
                <p className="text-[11px] text-dark-400">Users exceeding this limit will receive an interactive 429 wait timer.</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={compilerSettings.maxRunsPerMinute}
                  onChange={e => setCompilerSettings(prev => ({ ...prev, maxRunsPerMinute: parseInt(e.target.value) || 1 }))}
                  className="w-24 px-3 py-2 rounded-xl bg-dark-900 border border-dark-700 text-white font-mono font-bold text-center text-sm outline-none focus:border-neon-green/50"
                />
                <span className="text-xs font-semibold text-dark-400">runs / min</span>
              </div>
            </div>

            {/* Save Settings Action */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSaveCompilerSettings}
                disabled={isSavingCompiler}
                className="px-6 py-2.5 bg-neon-green text-black font-bold rounded-xl hover:bg-neon-green/90 transition-all disabled:opacity-50 flex items-center gap-2 text-sm shadow-lg shadow-neon-green/20 cursor-pointer"
              >
                {isSavingCompiler ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSavingCompiler ? 'Saving Settings...' : 'Save Compiler Controls'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl overflow-hidden"
        >
          {/* Search */}
          <div className="p-4 border-b border-dark-700/50">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by name or email..."
                  className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/50 transition-all"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2.5 rounded-xl bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600 transition-all text-sm font-medium"
              >
                Search
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Joined</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <div className="w-6 h-6 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-dark-500 text-sm">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="border-b border-dark-700/20 hover:bg-dark-700/20 transition-all">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-green/20 to-cyan-500/20 flex items-center justify-center border border-dark-600/50">
                            <span className="text-neon-green font-bold text-xs">
                              {u.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{u.name}</p>
                            <p className="text-xs text-dark-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-dark-700 text-dark-400'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-dark-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {u.isBanned ? (
                          <div>
                            <span className="flex items-center gap-1 text-xs font-semibold text-red-400">
                              <Ban size={12} /> Banned
                            </span>
                            {u.banReason && (
                              <p className="text-[10px] text-dark-500 mt-0.5 truncate max-w-[150px]">{u.banReason}</p>
                            )}
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 size={12} /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setShowUserDetailsModal(true);
                              fetchUserDetails(u._id);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-700 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/10 transition-all flex items-center gap-1"
                          >
                            <Activity size={12} /> Details
                          </button>
                          {u.role !== 'admin' && u._id !== user?._id && (
                            <button
                              onClick={() => handleToggleBan(u._id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                u.isBanned
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                              }`}
                            >
                              {u.isBanned ? 'Unban' : 'Ban'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-dark-700/50">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchUsers(searchQuery, page)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    page === pagination.page
                      ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                      : 'bg-dark-700 text-dark-400 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Bucket Manager Tab */}
      {activeTab === 'buckets' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-5 space-y-5"
        >
          {/* Mode toggle */}
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'form', label: 'Interactive Form' },
              { id: 'csv', label: 'CSV Upload' },
              { id: 'json', label: 'JSON Upload' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setBucketMode(mode.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  bucketMode === mode.id
                    ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                    : 'bg-dark-700 text-dark-400 hover:text-white border border-dark-600/50'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {bucketMode === 'json' ? (
            /* JSON Mode */
            <div className="space-y-4">
              <p className="text-xs text-dark-400">
                Paste a complete bucket JSON object with <code className="text-neon-green">name</code>, <code className="text-neon-green">category</code>, <code className="text-neon-green">problems[]</code>, etc.
              </p>
              <textarea
                value={bucketJson}
                onChange={(e) => setBucketJson(e.target.value)}
                placeholder={`{\n  "name": "Striver SDE Sheet",\n  "description": "...",\n  "category": "dsa",\n  "icon": "BookOpen",\n  "color": "#00FF88",\n  "problems": [\n    {\n      "title": "Two Sum",\n      "topic": "Arrays",\n      "difficulty": "easy",\n      "problemLink": "https://leetcode.com/problems/two-sum"\n    }\n  ]\n}`}
                rows={14}
                className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white placeholder-dark-600 font-mono resize-none focus:outline-none focus:border-neon-green/50 transition-all"
              />
            </div>
          ) : bucketMode === 'csv' ? (
            /* CSV Upload Mode */
            <div className="space-y-4">
              {/* Bucket metadata - same fields needed for CSV too */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Bucket Name *</label>
                  <input
                    type="text"
                    value={bucketForm.name}
                    onChange={(e) => setBucketForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Striver A2Z DSA"
                    className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Category *</label>
                  <select
                    value={bucketForm.category}
                    onChange={(e) => setBucketForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-green/50 transition-all"
                  >
                    {BUCKET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-dark-400 mb-1 block">Description</label>
                  <input
                    type="text"
                    value={bucketForm.description}
                    onChange={(e) => setBucketForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description of this bucket"
                    className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/50 transition-all"
                  />
                </div>
              </div>

              {/* Template download */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-dark-400">
                  Upload a CSV file with columns: <code className="text-neon-green">Topic, Title, Difficulty, Platform, Problem Link, Article Link, YouTube, Tags</code>
                </p>
                <button
                  onClick={downloadCsvTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600 transition-all flex-shrink-0"
                >
                  <Download size={12} />
                  Template
                </button>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setCsvDragOver(true); }}
                onDragLeave={() => setCsvDragOver(false)}
                onDrop={handleCsvDrop}
                onClick={() => csvFileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  csvDragOver
                    ? 'border-neon-green/50 bg-neon-green/5'
                    : 'border-dark-600/50 hover:border-dark-500 bg-dark-900/30'
                }`}
              >
                <input
                  ref={csvFileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleCsvFile(e.target.files?.[0])}
                  className="hidden"
                />
                <FileUp size={28} className={`mx-auto mb-2 ${csvDragOver ? 'text-neon-green' : 'text-dark-500'}`} />
                {csvFileName ? (
                  <>
                    <p className="text-sm font-medium text-neon-green">{csvFileName}</p>
                    <p className="text-xs text-dark-500 mt-1">File loaded. Click or drag to replace.</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-dark-300">Drag & drop a CSV file here</p>
                    <p className="text-xs text-dark-500 mt-1">or click to browse files</p>
                  </>
                )}
              </div>

              {/* Parsed problems preview */}
              {bucketForm.problems.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-white">
                      Loaded Problems ({bucketForm.problems.length})
                    </h3>
                    <button
                      onClick={() => setBucketForm((p) => ({ ...p, problems: [] }))}
                      className="text-xs text-dark-500 hover:text-red-400 transition-all"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {bucketForm.problems.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-dark-900/50 border border-dark-600/30"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-dark-500 font-mono w-5">#{idx + 1}</span>
                          <span className="text-xs text-white truncate">{p.title}</span>
                          <span className="text-[10px] text-dark-500">{p.topic}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              p.difficulty === 'easy'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : p.difficulty === 'hard'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {p.difficulty}
                          </span>
                        </div>
                        <button
                          onClick={() => removeProblem(idx)}
                          className="p-1 rounded text-dark-500 hover:text-red-400 transition-all flex-shrink-0"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Interactive Form Mode */
            <div className="space-y-4">
              {/* Bucket metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Name *</label>
                  <input
                    type="text"
                    value={bucketForm.name}
                    onChange={(e) => setBucketForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Striver A2Z DSA"
                    className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Category *</label>
                  <select
                    value={bucketForm.category}
                    onChange={(e) => setBucketForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-green/50 transition-all"
                  >
                    {BUCKET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-dark-400 mb-1 block">Description</label>
                  <input
                    type="text"
                    value={bucketForm.description}
                    onChange={(e) => setBucketForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description of this bucket"
                    className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Icon</label>
                  <input
                    type="text"
                    value={bucketForm.icon}
                    onChange={(e) => setBucketForm((p) => ({ ...p, icon: e.target.value }))}
                    placeholder="BookOpen"
                    className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bucketForm.color}
                      onChange={(e) => setBucketForm((p) => ({ ...p, color: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-dark-600/50 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={bucketForm.color}
                      onChange={(e) => setBucketForm((p) => ({ ...p, color: e.target.value }))}
                      className="flex-1 bg-dark-900/50 border border-dark-600/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Problems list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">
                    Problems ({bucketForm.problems.length})
                  </h3>
                </div>

                {/* Existing problems */}
                {bucketForm.problems.length > 0 && (
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                    {bucketForm.problems.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-dark-900/50 border border-dark-600/30"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-dark-500 font-mono w-5">#{idx + 1}</span>
                          <span className="text-xs text-white truncate">{p.title}</span>
                          <span className="text-[10px] text-dark-500">{p.topic}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              p.difficulty === 'easy'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : p.difficulty === 'hard'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {p.difficulty}
                          </span>
                        </div>
                        <button
                          onClick={() => removeProblem(idx)}
                          className="p-1 rounded text-dark-500 hover:text-red-400 transition-all flex-shrink-0"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new problem */}
                <div className="p-3.5 rounded-xl bg-dark-900/40 border border-dark-600/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neon-green font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Easy Link Problem to Bucket
                    </p>
                    <span className="text-[10px] text-dark-500">Search DB or enter manually</span>
                  </div>

                  {/* Autocomplete Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                    <input
                      type="text"
                      placeholder="Type problem name to search Cosmos DB (e.g. Two Sum)..."
                      onChange={(e) => handleSearchJudgeProblems(e.target.value)}
                      className="w-full bg-dark-950 border border-neon-green/30 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-neon-green"
                    />
                  </div>

                  {/* Dropdown Results */}
                  {easySearchResults.length > 0 && (
                    <div className="bg-dark-950 border border-neon-green/30 rounded-xl overflow-hidden shadow-2xl divide-y divide-white/5 max-h-40 overflow-y-auto">
                      {easySearchResults.map((prob) => (
                        <div
                          key={prob._id}
                          onClick={() => {
                            setNewProblem({
                              title: prob.title,
                              topic: bucketForm.category || 'General',
                              difficulty: prob.difficulty.toLowerCase(),
                              problemLink: `/solve/${prob.slug}`,
                              articleLink: '',
                              youtubeLink: '',
                            });
                            setEasySearchResults([]);
                            toast.success(`Autofilled "${prob.title}"! Click "Add Problem" to attach.`);
                          }}
                          className="p-2.5 hover:bg-neon-green/10 flex items-center justify-between cursor-pointer transition text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              prob.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
                              prob.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-rose-500/20 text-rose-400'
                            }`}>
                              {prob.difficulty}
                            </span>
                            <span className="font-semibold text-white">{prob.title}</span>
                            <span className="text-[10px] text-dark-400 font-mono">/solve/{prob.slug}</span>
                          </div>
                          <span className="text-neon-green font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Select
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                    <input
                      type="text"
                      value={newProblem.title}
                      onChange={(e) => setNewProblem((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Problem title *"
                      className="bg-dark-900/50 border border-dark-600/50 rounded-lg px-3 py-2 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/50 transition-all"
                    />
                    <input
                      type="text"
                      value={newProblem.topic}
                      onChange={(e) => setNewProblem((p) => ({ ...p, topic: e.target.value }))}
                      placeholder="Topic *"
                      className="bg-dark-900/50 border border-dark-600/50 rounded-lg px-3 py-2 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/50 transition-all"
                    />
                    <select
                      value={newProblem.difficulty}
                      onChange={(e) => setNewProblem((p) => ({ ...p, difficulty: e.target.value }))}
                      className="bg-dark-900/50 border border-dark-600/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-green/50 transition-all"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newProblem.problemLink}
                      onChange={(e) => setNewProblem((p) => ({ ...p, problemLink: e.target.value }))}
                      placeholder="Problem link (e.g. /solve/slug or https://...)"
                      className="bg-dark-900/50 border border-dark-600/50 rounded-lg px-3 py-2 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/50 transition-all"
                    />
                    <input
                      type="text"
                      value={newProblem.articleLink}
                      onChange={(e) => setNewProblem((p) => ({ ...p, articleLink: e.target.value }))}
                      placeholder="Article link (optional)"
                      className="bg-dark-900/50 border border-dark-600/50 rounded-lg px-3 py-2 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/50 transition-all"
                    />
                    <input
                      type="text"
                      value={newProblem.youtubeLink}
                      onChange={(e) => setNewProblem((p) => ({ ...p, youtubeLink: e.target.value }))}
                      placeholder="YouTube link (optional)"
                      className="bg-dark-900/50 border border-dark-600/50 rounded-lg px-3 py-2 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/50 transition-all"
                    />
                  </div>
                  <button
                    onClick={addProblemToForm}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neon-green text-dark-950 hover:brightness-110 transition-all shadow-md shadow-neon-green/20"
                  >
                    <Plus size={12} />
                    Add Problem to Bucket
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Submit bucket */}
          <button
            onClick={handleUpsertBucket}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-neon-green to-emerald-500 text-dark-950 font-semibold text-sm hover:shadow-lg hover:shadow-neon-green/25 active:scale-[0.99] transition-all"
          >
            <Upload size={16} />
            Save / Update Bucket
          </button>
        </motion.div>
      )}

      {/* Ban Reason Modal */}
      {banReasonModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setBanReasonModal(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-dark-900 border border-dark-700/50 rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-red-400" size={20} />
              <h3 className="text-lg font-bold text-white">Ban User</h3>
            </div>
            <p className="text-sm text-dark-400 mb-4">
              Are you sure? This will immediately block the user from all authenticated actions.
            </p>
            <input
              type="text"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Reason for ban (optional)"
              className="w-full bg-dark-800 border border-dark-600/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-red-500/50 transition-all mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setBanReasonModal(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-dark-800 text-dark-300 hover:text-white hover:bg-dark-700 transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmBan}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 font-semibold text-sm transition-all"
              >
                Confirm Ban
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetailsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowUserDetailsModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-dark-900 border border-dark-700/50 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-dark-700/50 bg-dark-800/50">
              <div className="flex items-center gap-3">
                <UserCheck className="text-cyan-400" size={24} />
                <h3 className="text-xl font-bold text-white">User Activity Details</h3>
              </div>
              <button onClick={() => setShowUserDetailsModal(false)} className="text-dark-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isUserDetailsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              ) : userDetails ? (
                <>
                  {/* User Meta */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-dark-800/50 border border-dark-700/50 rounded-xl p-4">
                      <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">Profile Info</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-sm text-dark-300">Name</span><span className="text-sm text-white font-medium">{userDetails?.user?.name}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-dark-300">Email</span><span className="text-sm text-white font-medium">{userDetails?.user?.email}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-dark-300">Role</span><span className="text-sm text-white font-medium uppercase">{userDetails?.user?.role}</span></div>
                      </div>
                    </div>
                    <div className="bg-dark-800/50 border border-dark-700/50 rounded-xl p-4">
                      <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">Sheet Progress</h4>
                      <div className="space-y-2">
                        {!userDetails?.sheets || userDetails.sheets.length === 0 ? (
                          <div className="text-sm text-dark-500">No active sheets</div>
                        ) : (
                          userDetails.sheets.map(sheet => (
                            <div key={sheet._id} className="flex justify-between items-center">
                              <span className="text-sm text-dark-300">{sheet.name}</span>
                              <span className="text-sm font-bold text-neon-green">
                                {sheet.solvedProblems || 0} / {sheet.totalProblems || 0}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Solved Problems */}
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                      <CheckCircle2 className="text-emerald-400" size={16} />
                      Solved Problems History
                    </h4>
                    {!userDetails?.solvedProblems || userDetails.solvedProblems.length === 0 ? (
                      <div className="p-8 text-center border border-dark-700/50 border-dashed rounded-xl text-dark-500 text-sm">
                        No solved problems yet
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userDetails.solvedProblems.map(prob => (
                          <div key={prob._id} className="bg-dark-800/30 border border-dark-700/50 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-dark-700/30 flex justify-between items-center bg-dark-800/50">
                              <div>
                                <h5 className="font-semibold text-white">{prob.title}</h5>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="px-2 py-0.5 rounded bg-dark-700 text-[10px] text-dark-300">
                                    {prob.sheet?.name || 'Unknown Sheet'}
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-dark-700 text-[10px] text-dark-300">
                                    {prob.topic}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                    prob.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400' :
                                    prob.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                                    'bg-red-500/10 text-red-400'
                                  }`}>
                                    {prob.difficulty}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2 text-xs">
                                {prob.notes && (
                                  <button
                                    onClick={() => setSelectedNotesProblem(prob)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-dark-700/50 hover:bg-dark-600 text-purple-400 border border-purple-500/20 transition-all"
                                  >
                                    <StickyNote size={12} /> Notes
                                  </button>
                                )}
                                {prob.code && (
                                  <button
                                    onClick={() => setSelectedCodeProblem(prob)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-dark-700/50 hover:bg-dark-600 text-neon-green border border-neon-green/20 transition-all"
                                  >
                                    <Code size={12} /> Code
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-dark-500">Failed to load user details</div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Code Viewer Modal */}
      <CodeViewer
        isOpen={!!selectedCodeProblem}
        onClose={() => setSelectedCodeProblem(null)}
        problem={selectedCodeProblem}
      />

      {/* ── Link TrackAsap Problem Modal ── */}
      <AnimatePresence>
        {linkingModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-opacity"
              onClick={() => setLinkingModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-dark-900/95 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(0,0,0,0.9)] space-y-6 z-10 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center text-neon-green shadow-[0_0_20px_rgba(57,255,20,0.15)] shrink-0">
                    <Zap className="w-5 h-5 fill-neon-green" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-neon-green uppercase tracking-wider flex items-center gap-1">
                      Roadmap Level Integration
                    </span>
                    <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2 mt-0.5">
                      <span>Level #{linkingModal.index + 1}: {linkingModal.problem?.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        linkingModal.problem?.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        linkingModal.problem?.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {linkingModal.problem?.difficulty || 'easy'}
                      </span>
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setLinkingModal(null)}
                  className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Status Pill */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                linkingModal.problem?.judgeSlug
                  ? 'bg-neon-green/5 border-neon-green/25 text-neon-green'
                  : 'bg-dark-950/80 border-white/5 text-dark-300'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${linkingModal.problem?.judgeSlug ? 'bg-neon-green shadow-[0_0_10px_#39ff14]' : 'bg-amber-400'}`} />
                  <div>
                    <div className="text-xs font-semibold text-white">
                      {linkingModal.problem?.judgeSlug ? 'Currently Linked to Arena' : 'Currently External Link Only'}
                    </div>
                    <div className="text-[11px] text-dark-400 font-mono mt-0.5">
                      {linkingModal.problem?.judgeSlug ? `/solve/${linkingModal.problem.judgeSlug}` : (linkingModal.problem?.url || 'No destination URL set')}
                    </div>
                  </div>
                </div>

                {linkingModal.problem?.judgeSlug && (
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <a
                      href={`/solve/${linkingModal.problem.judgeSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </a>
                    <button
                      onClick={() => unlinkProblemFromRow(linkingModal.index, linkingModal.isBoss)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition"
                    >
                      Unlink
                    </button>
                  </div>
                )}
              </div>

              {/* Search Arena Problems */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-neon-green" />
                    Search Arena Problem Library
                  </label>
                  <span className="text-[11px] text-dark-400">Published problems in Cosmos DB</span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    type="text"
                    value={linkingSearchQuery}
                    onChange={(e) => handleSearchLinking(e.target.value)}
                    placeholder="Search by title (e.g. Contains Duplicate, Two Sum)..."
                    className="w-full bg-dark-950 border border-white/10 focus:border-neon-green rounded-2xl pl-10 pr-10 py-3 text-sm text-white placeholder-dark-500 focus:outline-none transition shadow-inner"
                    autoFocus
                  />
                  {isLinkingSearching && (
                    <Loader2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-neon-green animate-spin" />
                  )}
                </div>

                {/* Results List */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {linkingResults.length === 0 ? (
                    <div className="p-8 text-center bg-dark-950/60 border border-white/5 rounded-2xl space-y-2">
                      <div className="text-xs text-dark-300">
                        {isLinkingSearching
                          ? 'Searching Cosmos DB Arena problems...'
                          : `No published Arena problems found for "${linkingSearchQuery}".`}
                      </div>
                      <div className="text-[11px] text-dark-500">
                        You can create this problem in Problem Setter Studio or attach a custom slug below.
                      </div>
                      <a
                        href="/studio"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neon-green/10 hover:bg-neon-green text-neon-green hover:text-dark-950 text-xs font-bold border border-neon-green/30 transition mt-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Create Problem in Studio 🚀
                      </a>
                    </div>
                  ) : (
                    linkingResults.map((prob) => (
                      <div
                        key={prob._id}
                        className="p-3.5 rounded-2xl bg-dark-950/90 border border-white/10 hover:border-neon-green/50 hover:bg-dark-950 flex items-center justify-between gap-3 transition shadow-sm group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                              prob.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
                              prob.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-rose-500/20 text-rose-400'
                            }`}>
                              {prob.difficulty}
                            </span>
                            <span className="text-sm font-bold text-white group-hover:text-neon-green transition truncate">
                              {prob.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-dark-400 font-mono">
                              /solve/{prob.slug}
                            </span>
                            {prob.tags?.length > 0 && (
                              <div className="hidden sm:flex items-center gap-1">
                                {prob.tags.slice(0, 2).map((t, idx) => (
                                  <span key={idx} className="text-[9px] px-1.5 py-0.2 rounded bg-dark-800 text-dark-400">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => attachJudgeProblemToRow(prob)}
                          className="px-4 py-2 rounded-xl bg-neon-green hover:brightness-110 text-dark-950 text-xs font-bold transition shrink-0 flex items-center gap-1.5 shadow-lg shadow-neon-green/20"
                        >
                          <Check className="w-4 h-4" />
                          Link Statement
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Direct Custom Slug Input */}
              <div className="pt-4 border-t border-white/10 space-y-2">
                <label className="text-[11px] font-bold text-dark-400 uppercase tracking-wider block">
                  Or Connect by Custom Problem Slug:
                </label>
                <div className="flex items-center gap-2.5">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500 text-xs font-mono select-none">
                      /solve/
                    </span>
                    <input
                      type="text"
                      value={customSlugInput}
                      onChange={(e) => setCustomSlugInput(e.target.value)}
                      placeholder="contains-duplicate"
                      className="w-full bg-dark-950 border border-white/10 focus:border-neon-green rounded-xl pl-16 pr-3 py-2.5 text-xs font-mono text-white focus:outline-none transition"
                    />
                  </div>
                  <button
                    onClick={attachCustomSlugToRow}
                    disabled={!customSlugInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/10 disabled:opacity-40 transition shrink-0"
                  >
                    Attach Slug
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notes Modal */}
      <AnimatePresence>
        {selectedNotesProblem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
            onClick={() => setSelectedNotesProblem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-dark-800 border border-dark-700/50 rounded-xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4 border-b border-dark-700/50 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <StickyNote className="w-5 h-5 text-purple-400" />
                      User Notes
                    </h2>
                    <p className="text-sm text-dark-400 mt-1 truncate max-w-[350px]">{selectedNotesProblem.title}</p>
                  </div>
                  <button
                    onClick={() => setSelectedNotesProblem(null)}
                    className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="bg-dark-900/50 border border-dark-700/50 rounded-lg p-4 max-h-80 overflow-y-auto">
                  <p className="text-dark-300 text-sm whitespace-pre-wrap font-mono">
                    {selectedNotesProblem.notes}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;
