import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
  X,
  FileUp,
  Download,
} from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

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
  const { users, stats, pagination, isLoading, fetchStats, fetchUsers, toggleBanUser, upsertBucket } = useAdminStore();
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [banReasonModal, setBanReasonModal] = useState(null);
  const [banReason, setBanReason] = useState('');

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
    </div>
  );
};

export default Admin;
