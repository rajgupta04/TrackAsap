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
} from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { useAuthStore } from '../store/authStore';
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
  const { user } = useAuthStore();
  const { 
    users, stats, pagination, isLoading, 
    fetchStats, fetchUsers, toggleBanUser, upsertBucket, 
    fetchSystemAnalytics, systemAnalytics, systemPerformance, systemFeatures, activityLogs, systemAnalyticsError,
    userDetails, fetchUserDetails, isUserDetailsLoading
  } = useAdminStore();
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [banReasonModal, setBanReasonModal] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedCodeProblem, setSelectedCodeProblem] = useState(null);
  const [selectedNotesProblem, setSelectedNotesProblem] = useState(null);

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

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchSystemAnalytics();
  }, []);

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

  // Guard: only admins
  if (user?.role !== 'admin') {
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
            { label: 'Total Users', value: stats.totalUsers, icon: Users, color: '#4ECDC4' },
            { label: 'Active Users', value: stats.activeUsers, icon: UserCheck, color: '#39FF14' },
            { label: 'Banned Users', value: stats.bannedUsers, icon: UserX, color: '#FF6B6B' },
            { label: 'Total Posts', value: stats.totalPosts, icon: BarChart3, color: '#45B7D1' },
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
      <div className="flex gap-2">
        {[
          { id: 'analytics', label: 'System Analytics', icon: Activity },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'buckets', label: 'Bucket Manager', icon: Package },
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
          </button>
        ))}
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
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
                    <span className="text-lg font-bold text-white">{Math.round(systemPerformance.averageResponseTime)}ms</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-dark-900/50">
                    <span className="text-sm text-dark-300">Total Requests</span>
                    <span className="text-lg font-bold text-white">{systemPerformance.totalRequests}</span>
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 mb-2 font-semibold">Slowest Endpoints</p>
                    {(systemPerformance.slowestEndpoints || []).slice(0, 3).map((ep, i) => (
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

          {/* Live Activity Logs */}
          <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-5 mt-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="text-neon-green" size={20} />
              Live Activity Logs (Latest 50)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-dark-700/50">
                    <th className="px-4 py-3 text-xs font-semibold text-dark-400">Timestamp</th>
                    <th className="px-4 py-3 text-xs font-semibold text-dark-400">User</th>
                    <th className="px-4 py-3 text-xs font-semibold text-dark-400">Action</th>
                    <th className="px-4 py-3 text-xs font-semibold text-dark-400">Details</th>
                    <th className="px-4 py-3 text-xs font-semibold text-dark-400">Environment</th>
                  </tr>
                </thead>
                <tbody>
                  {!Array.isArray(activityLogs) || activityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-dark-500 text-sm">No activity logs yet</td>
                    </tr>
                  ) : (
                    activityLogs.map((log) => (
                      <tr key={log._id} className="border-b border-dark-700/20 hover:bg-dark-700/20">
                        <td className="px-4 py-3 text-xs text-dark-300">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {log.user ? (
                            <div>
                              <div className="text-white font-medium">{log.user.name}</div>
                              <div className="text-dark-400">{log.user.email}</div>
                            </div>
                          ) : (
                            <span className="text-dark-500">Anonymous</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-emerald-400">
                          {log.eventName}
                        </td>
                        <td className="px-4 py-3 text-xs text-dark-300 font-mono max-w-[200px] truncate">
                          {JSON.stringify(log.metadata)}
                        </td>
                        <td className="px-4 py-3 text-xs text-dark-400">
                          <div>IP: {log.ip || 'Unknown'}</div>
                          <div>{log.os} • {log.browser}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
                <div className="p-3 rounded-xl bg-dark-900/30 border border-dark-600/30 space-y-2">
                  <p className="text-xs text-dark-400 font-medium">Add Problem</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
                      placeholder="Problem link (optional)"
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600 transition-all"
                  >
                    <Plus size={12} />
                    Add Problem
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
