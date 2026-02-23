import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Network,
  Boxes,
  LayoutList,
  Binary,
  Code,
  BookOpen,
  ChevronRight,
  Download,
  Plus,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import GlassCard from '../ui/GlassCard';
import bucketService from '../../services/bucketService';

const CATEGORY_ICONS = {
  graph: Network,
  dp: Boxes,
  arrays: LayoutList,
  dsa: Binary,
  dev: Code,
  default: BookOpen,
};

const DIFFICULTY_COLORS = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
};

const BucketPicker = ({ isOpen, onClose, onImport, sheets = [] }) => {
  const [buckets, setBuckets] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [bucketDetails, setBucketDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [mode, setMode] = useState('list'); // 'list' | 'details' | 'import'
  const [importMode, setImportMode] = useState('new'); // 'new' | 'existing'
  const [selectedSheet, setSelectedSheet] = useState('');
  const [newSheetName, setNewSheetName] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchBuckets();
    }
  }, [isOpen]);

  const fetchBuckets = async () => {
    try {
      setLoading(true);
      const data = await bucketService.getBuckets();
      setBuckets(data);
    } catch (error) {
      toast.error('Failed to load buckets');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBucket = async (bucket) => {
    setSelectedBucket(bucket);
    setMode('details');
    try {
      const details = await bucketService.getBucket(bucket._id);
      setBucketDetails(details);
      setNewSheetName(bucket.name);
    } catch (error) {
      toast.error('Failed to load bucket details');
    }
  };

  const handleImport = async () => {
    if (!selectedBucket) return;

    try {
      setImporting(true);

      if (importMode === 'new') {
        const result = await bucketService.createSheetFromBucket(
          selectedBucket._id,
          newSheetName || selectedBucket.name
        );
        toast.success(result.message);
        onImport?.(result.sheet);
      } else {
        if (!selectedSheet) {
          toast.error('Please select a sheet');
          return;
        }
        const result = await bucketService.importToSheet(selectedBucket._id, selectedSheet);
        toast.success(result.message);
        onImport?.();
      }

      onClose();
      resetState();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import');
    } finally {
      setImporting(false);
    }
  };

  const resetState = () => {
    setSelectedBucket(null);
    setBucketDetails(null);
    setMode('list');
    setImportMode('new');
    setSelectedSheet('');
    setNewSheetName('');
  };

  const handleBack = () => {
    if (mode === 'import') {
      setMode('details');
    } else if (mode === 'details') {
      setSelectedBucket(null);
      setBucketDetails(null);
      setMode('list');
    }
  };

  if (!isOpen) return null;

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
        className="w-full max-w-2xl max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard className="p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              {mode !== 'list' && (
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
              )}
              <h2 className="text-xl font-bold text-white">
                {mode === 'list' && 'Problem Buckets'}
                {mode === 'details' && selectedBucket?.name}
                {mode === 'import' && 'Import to Sheet'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(85vh-120px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-neon-green" />
              </div>
            ) : mode === 'list' ? (
              /* Bucket List */
              <div className="grid gap-3">
                {buckets.map((bucket) => {
                  const Icon = CATEGORY_ICONS[bucket.category] || CATEGORY_ICONS.default;
                  return (
                    <motion.button
                      key={bucket._id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => handleSelectBucket(bucket)}
                      className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-left transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${bucket.color}20` }}
                        >
                          <Icon className="w-6 h-6" style={{ color: bucket.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white">{bucket.name}</h3>
                          <p className="text-sm text-gray-400 truncate">{bucket.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-500">
                              {bucket.totalProblems} problems
                            </span>
                            <span className="text-xs text-green-400">
                              {bucket.difficultyBreakdown?.easy || 0} Easy
                            </span>
                            <span className="text-xs text-yellow-400">
                              {bucket.difficultyBreakdown?.medium || 0} Med
                            </span>
                            <span className="text-xs text-red-400">
                              {bucket.difficultyBreakdown?.hard || 0} Hard
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      </div>
                    </motion.button>
                  );
                })}

                {buckets.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No buckets available</p>
                  </div>
                )}
              </div>
            ) : mode === 'details' && bucketDetails ? (
              /* Bucket Details */
              <div className="space-y-4">
                <p className="text-gray-400">{bucketDetails.description}</p>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 bg-white/5 rounded-lg text-center">
                    <div className="text-xl font-bold text-white">
                      {bucketDetails.totalProblems}
                    </div>
                    <div className="text-xs text-gray-400">Total</div>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg text-center">
                    <div className="text-xl font-bold text-green-400">
                      {bucketDetails.difficultyBreakdown?.easy || 0}
                    </div>
                    <div className="text-xs text-gray-400">Easy</div>
                  </div>
                  <div className="p-3 bg-yellow-500/10 rounded-lg text-center">
                    <div className="text-xl font-bold text-yellow-400">
                      {bucketDetails.difficultyBreakdown?.medium || 0}
                    </div>
                    <div className="text-xs text-gray-400">Medium</div>
                  </div>
                  <div className="p-3 bg-red-500/10 rounded-lg text-center">
                    <div className="text-xl font-bold text-red-400">
                      {bucketDetails.difficultyBreakdown?.hard || 0}
                    </div>
                    <div className="text-xs text-gray-400">Hard</div>
                  </div>
                </div>

                {/* Topics */}
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Topics Covered</h4>
                  <div className="flex flex-wrap gap-2">
                    {bucketDetails.topics?.map((topic) => (
                      <span
                        key={topic}
                        className="px-3 py-1 text-sm bg-white/10 rounded-full text-gray-300"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Preview Problems */}
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Preview ({Math.min(8, bucketDetails.problems?.length || 0)} of{' '}
                    {bucketDetails.problems?.length || 0})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {bucketDetails.problems?.slice(0, 8).map((problem, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-gray-500 w-5">{idx + 1}.</span>
                          <span className="text-white text-sm truncate">{problem.title}</span>
                        </div>
                        <span
                          className={`text-xs capitalize px-2 py-0.5 rounded ${DIFFICULTY_COLORS[problem.difficulty]}`}
                        >
                          {problem.difficulty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Import Options */}
                <div className="pt-4 border-t border-white/10 space-y-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setImportMode('new')}
                      className={`flex-1 p-3 rounded-lg border transition-all ${
                        importMode === 'new'
                          ? 'border-neon-green bg-neon-green/10 text-neon-green'
                          : 'border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <Plus className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm">Create New Sheet</span>
                    </button>
                    <button
                      onClick={() => setImportMode('existing')}
                      className={`flex-1 p-3 rounded-lg border transition-all ${
                        importMode === 'existing'
                          ? 'border-neon-green bg-neon-green/10 text-neon-green'
                          : 'border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <Download className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm">Add to Existing</span>
                    </button>
                  </div>

                  {importMode === 'new' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Sheet Name
                      </label>
                      <input
                        type="text"
                        value={newSheetName}
                        onChange={(e) => setNewSheetName(e.target.value)}
                        placeholder={selectedBucket?.name}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-neon-green outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Select Sheet
                      </label>
                      <select
                        value={selectedSheet}
                        onChange={(e) => setSelectedSheet(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-neon-green"
                      >
                        <option value="">Choose a sheet...</option>
                        {sheets.map((sheet) => (
                          <option key={sheet._id} value={sheet._id}>
                            {sheet.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          {mode === 'details' && (
            <div className="p-4 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || (importMode === 'existing' && !selectedSheet)}
                className="flex items-center gap-2 px-6 py-2.5 bg-neon-green text-black font-semibold rounded-lg hover:bg-neon-green/90 transition-all disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Import {bucketDetails?.totalProblems || 0} Problems
                  </>
                )}
              </button>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

export default BucketPicker;
