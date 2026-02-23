import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, Code, FileText, Clock, Tag, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import useProblemStore from '../store/problemStore';
import GlassCard from './ui/GlassCard';

const PLATFORMS = [
  { value: 'leetcode', label: 'LeetCode', color: '#FFA116' },
  { value: 'codechef', label: 'CodeChef', color: '#5B4638' },
  { value: 'codeforces', label: 'Codeforces', color: '#1F8ACB' },
  { value: 'geeksforgeeks', label: 'GeeksforGeeks', color: '#2F8D46' },
  { value: 'hackerrank', label: 'HackerRank', color: '#00EA64' },
  { value: 'atcoder', label: 'AtCoder', color: '#222222' },
  { value: 'other', label: 'Other', color: '#666666' },
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', color: '#00B8A3' },
  { value: 'medium', label: 'Medium', color: '#FFC01E' },
  { value: 'hard', label: 'Hard', color: '#FF375F' },
  { value: 'unknown', label: 'Unknown', color: '#888888' },
];

const LANGUAGES = [
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'c', label: 'C' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'other', label: 'Other' },
];

const ProblemModal = ({ isOpen, onClose, platform, date, sheetId, sheetTopic, onSuccess }) => {
  const { createProblem, loading } = useProblemStore();
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    code: '',
    language: 'cpp',
    notes: '',
    platform: platform || 'leetcode',
    difficulty: 'unknown',
    tags: '',
    timeSpent: 0,
  });

  useEffect(() => {
    if (platform) {
      setFormData((prev) => ({ ...prev, platform }));
    }
  }, [platform]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Problem title is required');
      return;
    }
    if (!formData.link.trim()) {
      toast.error('Problem link is required');
      return;
    }

    try {
      await createProblem({
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        dailyLogDate: date,
        sheetId,
        sheetTopic,
      });
      
      toast.success('Problem saved successfully! 🎉');
      onSuccess?.();
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        link: '',
        code: '',
        language: 'cpp',
        notes: '',
        platform: platform || 'leetcode',
        difficulty: 'unknown',
        tags: '',
        timeSpent: 0,
      });
    } catch (error) {
      toast.error(error.message || 'Failed to save problem');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          className="w-full max-w-2xl max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Code className="w-5 h-5 text-neon-green" />
                Save Problem
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Problem Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Two Sum"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none transition-all"
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <LinkIcon className="w-4 h-4 inline mr-1" />
                  Problem Link *
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://leetcode.com/problems/two-sum"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none transition-all"
                />
              </div>

              {/* Platform & Difficulty Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Platform</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none transition-all"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.value} value={p.value} className="bg-gray-900">
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none transition-all"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d.value} value={d.value} className="bg-gray-900">
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Language & Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none transition-all"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.value} value={l.value} className="bg-gray-900">
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Time Spent (mins)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.timeSpent}
                    onChange={(e) => setFormData({ ...formData, timeSpent: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none transition-all"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., array, hash-map, two-pointer"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none transition-all"
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Code className="w-4 h-4 inline mr-1" />
                  Solution Code
                </label>
                <textarea
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Paste your solution code here..."
                  rows={8}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm placeholder-gray-500 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none transition-all resize-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any notes about the approach, time complexity, etc."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none transition-all resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-neon-green text-black font-semibold rounded-lg hover:bg-neon-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                >
                  {loading ? 'Saving...' : 'Save Problem'}
                </button>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProblemModal;
