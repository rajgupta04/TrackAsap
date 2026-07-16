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
  Trophy,
  Cpu,
  Database,
  AlertTriangle,
  Building,
  Search,
  Flame,
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
  'company-wise': Building,
  default: BookOpen,
};

const DIFFICULTY_COLORS = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
};

const SUBJECT_CATEGORIES = [
  { id: 'dsa', label: 'DSA Sheet', icon: Binary, color: '#00FF88' },
  { id: 'cp', label: 'Competitive Programming', icon: Trophy, color: '#3b82f6' },
  { id: 'os', label: 'Operating Systems', icon: Cpu, color: '#a855f7' },
  { id: 'cn', label: 'Computer Networks', icon: Network, color: '#14b8a6' },
  { id: 'oop', label: 'Object Oriented Programming', icon: Boxes, color: '#f59e0b' },
  { id: 'dev', label: 'Development', icon: Code, color: '#22c55e' },
  { id: 'database', label: 'Database', icon: Database, color: '#f43f5e' },
  { id: 'company-wise', label: 'Company Sheets', icon: Building, color: '#ef4444' },
];

const BucketPicker = ({ isOpen, onClose, onImport, sheets = [] }) => {
  const [buckets, setBuckets] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [bucketDetails, setBucketDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [mode, setMode] = useState('categories'); // 'categories' | 'list' | 'details' | 'import'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [importMode, setImportMode] = useState('new'); // 'new' | 'existing'
  const [selectedSheet, setSelectedSheet] = useState('');
  const [newSheetName, setNewSheetName] = useState('');
  const [existingSheetForBucket, setExistingSheetForBucket] = useState(null);
  const [allowDuplicateCreation, setAllowDuplicateCreation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isDuplicateName = sheets.some(s => s.name.toLowerCase() === newSheetName.trim().toLowerCase());
  const canImportNew = !isDuplicateName && newSheetName.trim().length > 0;

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

  const getFilteredBuckets = () => {
    let result = buckets;
    
    if (selectedCategory) {
      result = result.filter(b => {
        if (b.category === selectedCategory) return true;
        // Map legacy categories to DSA
        if (selectedCategory === 'dsa' && !['cp', 'os', 'cn', 'oop', 'dev', 'database', 'company-wise'].includes(b.category)) {
          return true;
        }
        return false;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.name.toLowerCase().includes(q) || 
        (b.description && b.description.toLowerCase().includes(q))
      );
    }
    
    const top10 = result
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 10);
    
    const rest = result
      .filter(b => !top10.some(t => t._id === b._id))
      .sort((a, b) => a.name.localeCompare(b.name));

    return [...top10, ...rest];
  };

  const filteredBuckets = getFilteredBuckets();

  const handleSelectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    setMode('list');
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

    if (importMode === 'new') {
      const targetName = (newSheetName || selectedBucket.name).trim();
      const duplicateSheet = sheets.find(s => s.name.toLowerCase() === targetName.toLowerCase());
      
      if (duplicateSheet && !allowDuplicateCreation) {
        setExistingSheetForBucket(duplicateSheet);
        setMode('duplicate-warning');
        return;
      }
    }

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
    setSelectedCategory(null);
    setSelectedBucket(null);
    setBucketDetails(null);
    setMode('categories');
    setImportMode('new');
    setSelectedSheet('');
    setNewSheetName('');
    setExistingSheetForBucket(null);
    setAllowDuplicateCreation(false);
    setSearchQuery('');
  };

  const handleBack = () => {
    if (mode === 'import') {
      setMode('details');
    } else if (mode === 'details') {
      setSelectedBucket(null);
      setBucketDetails(null);
      setExistingSheetForBucket(null);
      setAllowDuplicateCreation(false);
      setMode('list');
    } else if (mode === 'duplicate-warning') {
      setMode('details');
      setAllowDuplicateCreation(false);
    } else if (mode === 'list') {
      setSelectedCategory(null);
      setSearchQuery('');
      setMode('categories');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-full h-[100svh] max-h-[100svh] sm:h-[85vh] sm:max-h-[85vh] sm:max-w-3xl lg:max-w-4xl overflow-hidden rounded-none sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard className="p-0 overflow-hidden h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start sm:items-center justify-between p-4 border-b border-white/10 gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              {mode !== 'categories' && (
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
              )}
              <h2 className="text-base sm:text-xl font-bold text-white break-words leading-tight">
                {mode === 'categories' && 'Select Category'}
                {mode === 'list' && (SUBJECT_CATEGORIES.find(c => c.id === selectedCategory)?.label || 'Problem Buckets')}
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
          <div className="p-3 sm:p-4 overflow-y-auto overflow-x-hidden overscroll-contain flex-1 min-h-0 pb-4 sm:pb-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-neon-green" />
              </div>
            ) : mode === 'categories' ? (
              /* Category List */
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                {SUBJECT_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const catBuckets = buckets.filter(b => {
                    if (b.category === cat.id) return true;
                    if (cat.id === 'dsa' && !['cp', 'os', 'cn', 'oop', 'dev', 'database', 'company-wise'].includes(b.category)) return true;
                    return false;
                  });
                  const totalProbs = catBuckets.reduce((acc, b) => acc + (b.totalProblems || 0), 0);
                  
                  return (
                    <motion.button
                      key={cat.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleSelectCategory(cat.id)}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 p-3.5 sm:p-5 bg-dark-800 border border-white/10 hover:border-white/20 rounded-xl text-left transition-all shadow-sm"
                    >
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
                        style={{ backgroundColor: `${cat.color}20` }}
                      >
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: cat.color }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-xs sm:text-base truncate">{cat.label}</h3>
                        <p className="text-[11px] sm:text-sm text-gray-400 mt-0.5">{totalProbs} problems</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            ) : mode === 'list' ? (
              /* Bucket List */
              <div className="flex flex-col h-full space-y-3">
                <div className="relative shrink-0 mb-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search sheets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-dark-800 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none transition-all"
                  />
                </div>
                
                <div className="grid gap-3">
                  {filteredBuckets.map((bucket) => {
                  const Icon = CATEGORY_ICONS[bucket.category] || CATEGORY_ICONS.default;
                  return (
                    <motion.button
                      key={bucket._id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => handleSelectBucket(bucket)}
                      className="w-full p-3 sm:p-4 min-h-[104px] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-left transition-all"
                    >
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${bucket.color}20` }}
                        >
                          <Icon className="w-6 h-6" style={{ color: bucket.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white truncate">{bucket.name}</h3>
                            {(bucket.popularity || 0) > 0 && (
                              <div className="flex items-center gap-1 shrink-0 px-1.5 py-0.5 bg-orange-500/10 rounded text-orange-400">
                                <Flame className="w-3 h-3" />
                                <span className="text-[10px] font-bold">{bucket.popularity}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 whitespace-normal break-words line-clamp-1">
                            {bucket.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
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
                        <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
                      </div>
                    </motion.button>
                  );
                })}

                {filteredBuckets.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {searchQuery ? 'No Results Found' : 'Coming Soon'}
                    </h3>
                    <p className="text-gray-400">
                      {searchQuery ? 'Try adjusting your search query.' : 'There are no templates available in this category yet. Check back later!'}
                    </p>
                  </div>
                )}
                </div>
              </div>
            ) : mode === 'details' && bucketDetails ? (
              /* Bucket Details */
              <div className="space-y-4">
                <p className="text-gray-400">{bucketDetails.description}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
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
                  <div className="space-y-2">
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
                <div className="pt-4 border-t border-white/10 space-y-4 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-neon-green outline-none transition-colors"
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
            ) : mode === 'duplicate-warning' && existingSheetForBucket ? (
              /* Duplicate Warning Screen */
              <div className="space-y-6 max-w-md mx-auto py-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Oops! You already have this</h3>
                    <p className="text-gray-400 mt-2 text-sm">
                      You imported "{existingSheetForBucket.name}" previously. Importing it again might duplicate your tracking.
                    </p>
                  </div>
                </div>

                <div className="bg-dark-800/50 rounded-xl p-4 border border-white/5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-300">Your Current Progress</span>
                    <span className="text-sm font-bold text-white">
                      {existingSheetForBucket.solvedProblems} / {existingSheetForBucket.totalProblems}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-neon-green transition-all duration-500"
                      style={{ width: `${existingSheetForBucket.totalProblems > 0 ? Math.round((existingSheetForBucket.solvedProblems / existingSheetForBucket.totalProblems) * 100) : 0}%` }}
                    />
                  </div>
                  <div className="mt-2 text-right text-xs font-bold text-neon-green">
                    {existingSheetForBucket.totalProblems > 0 ? Math.round((existingSheetForBucket.solvedProblems / existingSheetForBucket.totalProblems) * 100) : 0}% Complete
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={allowDuplicateCreation}
                        onChange={(e) => {
                          setAllowDuplicateCreation(e.target.checked);
                          if (!e.target.checked) setNewSheetName(selectedBucket.name);
                        }}
                        className="w-5 h-5 rounded border-gray-600 text-neon-green focus:ring-neon-green bg-dark-700 cursor-pointer transition-all"
                      />
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors font-medium">
                      I want to create another one anyway
                    </span>
                  </label>

                  <AnimatePresence>
                    {allowDuplicateCreation && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          New Sheet Name
                        </label>
                        <input
                          type="text"
                          value={newSheetName}
                          onChange={(e) => setNewSheetName(e.target.value)}
                          placeholder="Enter a unique name..."
                          className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors ${
                            isDuplicateName ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-neon-green'
                          }`}
                        />
                        {isDuplicateName && (
                          <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            A sheet with this name already exists.
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          {mode === 'details' && (
            <div className="p-3 sm:p-4 border-t border-white/10 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || (importMode === 'existing' && !selectedSheet)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-neon-green text-black font-semibold rounded-lg hover:bg-neon-green/90 transition-all disabled:opacity-50"
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

          {mode === 'duplicate-warning' && (
            <div className="p-3 sm:p-4 border-t border-white/10 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                onClick={handleBack}
                className="w-full sm:w-auto px-6 py-2.5 text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
              >
                Go Back
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !allowDuplicateCreation || !canImportNew}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-all disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Import Anyway
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
