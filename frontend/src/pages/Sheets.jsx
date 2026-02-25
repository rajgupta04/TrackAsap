import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  BookOpen,
  Code,
  Binary,
  Trophy,
  Cpu,
  Network,
  Boxes,
  X,
  FolderOpen,
  Sparkles,
  TrendingUp,
  Target,
  Flame,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useSheetStore from '../store/sheetStore';
import GlassCard from '../components/ui/GlassCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SheetProblemsView from '../components/sheets/SheetProblemsView';
import BucketPicker from '../components/sheets/BucketPicker';

const CATEGORY_ICONS = {
  dsa: Binary,
  cp: Trophy,
  os: Cpu,
  cn: Network,
  oops: Boxes,
  dev: Code,
  'system-design': BookOpen,
  custom: BookOpen,
  graph: Network,
  dp: Boxes,
  arrays: BookOpen,
};

const PROGRAMMER_QUOTES = [
  { quote: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { quote: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
  { quote: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { quote: "Clean code always looks like it was written by someone who cares.", author: "Robert C. Martin" },
  { quote: "The best error message is the one that never shows up.", author: "Thomas Fuchs" },
  { quote: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
  { quote: "Any fool can write code that a computer can understand.", author: "Martin Fowler" },
  { quote: "Programming isn't about what you know; it's about what you can figure out.", author: "Chris Pine" },
  { quote: "The only way to learn a new programming language is by writing programs in it.", author: "Dennis Ritchie" },
  { quote: "Experience is the name everyone gives to their mistakes.", author: "Oscar Wilde" },
];

const Sheets = () => {
  const {
    sheets,
    templates,
    currentSheet,
    loading,
    fetchSheets,
    fetchSheet,
    fetchTemplates,
    createSheet,
    deleteSheet,
    clearCurrentSheet,
  } = useSheetStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBucketPicker, setShowBucketPicker] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [newSheetData, setNewSheetData] = useState({
    category: '',
    name: '',
    description: '',
    useTemplate: true,
  });

  useEffect(() => {
    fetchSheets();
    fetchTemplates();
  }, []);

  // Rotate quotes every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % PROGRAMMER_QUOTES.length);
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  const handleCreateSheet = async () => {
    if (!newSheetData.category) {
      toast.error('Please select a category');
      return;
    }

    try {
      await createSheet({
        ...newSheetData,
        name: newSheetData.name || templates.find(t => t.category === newSheetData.category)?.name || 'New Sheet',
      });
      toast.success('Sheet created successfully!');
      setShowCreateModal(false);
      setNewSheetData({ category: '', name: '', description: '', useTemplate: true });
    } catch (error) {
      toast.error('Failed to create sheet');
    }
  };

  const handleDeleteSheet = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this sheet?')) {
      try {
        await deleteSheet(id);
        toast.success('Sheet deleted');
        if (selectedSheet === id) {
          setSelectedSheet(null);
          clearCurrentSheet();
        }
      } catch (error) {
        toast.error('Failed to delete sheet');
      }
    }
  };

  const handleSelectSheet = async (id) => {
    setSelectedSheet(id);
    await fetchSheet(id);
  };

  // Calculate overall stats
  const totalProblems = sheets.reduce((acc, s) => acc + (s.totalProblems || 0), 0);
  const solvedProblems = sheets.reduce((acc, s) => acc + (s.solvedProblems || 0), 0);
  const overallProgress = totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0;

  return (
    <div className="h-[calc(100vh-80px)] flex">
      {/* Left Sidebar - Only visible when no sheet selected */}
      <AnimatePresence>
        {!selectedSheet && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 208, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="shrink-0 border-r border-white/10 flex flex-col overflow-hidden"
          >
            <div className="p-4 w-52">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Sheets</h2>
                <span className="text-xs text-gray-500">{sheets.length}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setShowBucketPicker(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 transition-all"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Buckets
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs bg-neon-green text-black font-medium rounded-lg hover:bg-neon-green/90 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New
                </button>
              </div>

              {/* Sheets List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin">
                {loading && sheets.length === 0 ? (
                  <LoadingSpinner />
                ) : sheets.length === 0 ? (
                  <div className="text-center py-4">
                    <BookOpen className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No sheets yet</p>
                  </div>
                ) : (
                  sheets.map((sheet) => {
                    const Icon = CATEGORY_ICONS[sheet.category] || BookOpen;
                    const isSelected = selectedSheet === sheet._id;
                    const progress = sheet.completionPercentage || 0;

                    return (
                      <motion.div
                        key={sheet._id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectSheet(sheet._id)}
                        className={`cursor-pointer group p-2.5 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-neon-green/10 border border-neon-green/30'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${sheet.color}15` }}
                          >
                            <Icon className="w-4 h-4" style={{ color: sheet.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className={`text-sm font-medium truncate ${isSelected ? 'text-neon-green' : 'text-white'}`}>
                                {sheet.name}
                              </h3>
                              <button
                                onClick={(e) => handleDeleteSheet(sheet._id, e)}
                                className="p-1 text-gray-600 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${progress}%`, backgroundColor: sheet.color }}
                                />
                              </div>
                              <span className="text-[10px] text-gray-500">{progress}%</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Horizontal Sheet Tiles - Only when sheet is selected */}
        <AnimatePresence>
          {selectedSheet && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="shrink-0 border-b border-white/10 overflow-hidden"
            >
              <div className="p-3 flex items-center gap-2">
                {/* Action buttons */}
                <button
                  onClick={() => setShowBucketPicker(true)}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                  title="Buckets"
                >
                  <FolderOpen className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-2 bg-neon-green/20 hover:bg-neon-green/30 border border-neon-green/30 rounded-lg text-neon-green transition-all"
                  title="New Sheet"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Sheet tiles */}
                <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-thin pb-1">
                  {sheets.map((sheet) => {
                    const Icon = CATEGORY_ICONS[sheet.category] || BookOpen;
                    const isSelected = selectedSheet === sheet._id;
                    const progress = sheet.completionPercentage || 0;

                    return (
                      <motion.div
                        key={sheet._id}
                        layout
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectSheet(sheet._id)}
                        className={`cursor-pointer shrink-0 px-3 py-2 rounded-lg flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-neon-green/15 border border-neon-green/40'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: `${sheet.color}20` }}
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color: sheet.color }} />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-xs font-medium whitespace-nowrap ${isSelected ? 'text-neon-green' : 'text-white'}`}>
                            {sheet.name}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${progress}%`, backgroundColor: sheet.color }}
                              />
                            </div>
                            <span className="text-[9px] text-gray-500">{progress}%</span>
                          </div>
                        </div>
                        {isSelected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSheet(null);
                              clearCurrentSheet();
                            }}
                            className="ml-1 p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sheet Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedSheet && currentSheet ? (
            <SheetProblemsView 
              sheet={currentSheet} 
              onStatsUpdate={() => {
                fetchSheets(true);
                fetchSheet(selectedSheet, true);
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <GlassCard className="p-12 text-center max-w-md">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-400">Select a sheet</h3>
                <p className="text-gray-500 mt-2">Choose a sheet from the left sidebar or create a new one</p>
              </GlassCard>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Progress & Stats */}
      <div className="w-60 shrink-0 border-l border-white/10 p-4 overflow-y-auto space-y-3 scrollbar-thin">
        {/* Overall Progress */}
        <GlassCard className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-neon-green" />
            <h3 className="text-xs font-semibold text-white">Overall Progress</h3>
          </div>
          <div className="text-center mb-2">
            <div className="text-3xl font-bold text-neon-green">{overallProgress}%</div>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {solvedProblems} of {totalProblems} problems
            </p>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-gradient-to-r from-neon-green to-emerald-400 rounded-full"
            />
          </div>
        </GlassCard>

        {/* Stats */}
        <GlassCard className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-3.5 h-3.5 text-blue-400" />
            <h3 className="text-xs font-semibold text-white">Stats</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-1.5 bg-white/5 rounded-lg">
              <div className="text-lg font-bold text-white">{sheets.length}</div>
              <p className="text-[9px] text-gray-500">Sheets</p>
            </div>
            <div className="text-center p-1.5 bg-white/5 rounded-lg">
              <div className="text-lg font-bold text-green-400">{solvedProblems}</div>
              <p className="text-[9px] text-gray-500">Solved</p>
            </div>
            <div className="text-center p-1.5 bg-white/5 rounded-lg">
              <div className="text-lg font-bold text-yellow-400">{totalProblems - solvedProblems}</div>
              <p className="text-[9px] text-gray-500">Remaining</p>
            </div>
            <div className="text-center p-1.5 bg-white/5 rounded-lg">
              <div className="text-lg font-bold text-purple-400">{totalProblems}</div>
              <p className="text-[9px] text-gray-500">Total</p>
            </div>
          </div>
        </GlassCard>

        {/* Motivational Quote */}
        <GlassCard className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <h3 className="text-xs font-semibold text-white">Daily Motivation</h3>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs text-gray-300 italic leading-relaxed">
                "{PROGRAMMER_QUOTES[currentQuoteIndex].quote}"
              </p>
              <p className="text-[10px] text-gray-500 mt-1.5 text-right">
                — {PROGRAMMER_QUOTES[currentQuoteIndex].author}
              </p>
            </motion.div>
          </AnimatePresence>
        </GlassCard>

        {/* Current Sheet Stats */}
        {currentSheet && (
          <GlassCard className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <h3 className="text-xs font-semibold text-white">Current Sheet</h3>
            </div>
            <p className="text-[10px] text-gray-400 truncate mb-1.5">{currentSheet.name}</p>
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500">Progress</span>
              <span className="text-neon-green font-medium">{currentSheet.completionPercentage || 0}%</span>
            </div>
            <div className="flex justify-between text-[10px] mt-0.5">
              <span className="text-gray-500">Solved</span>
              <span className="text-white">{currentSheet.solvedProblems || 0}/{currentSheet.totalProblems || 0}</span>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Create Sheet Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Create New Sheet</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Category Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Select Category
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {templates.map((template) => {
                      const Icon = CATEGORY_ICONS[template.category] || BookOpen;
                      const isSelected = newSheetData.category === template.category;

                      return (
                        <button
                          key={template.category}
                          onClick={() =>
                            setNewSheetData({
                              ...newSheetData,
                              category: template.category,
                              name: template.name,
                            })
                          }
                          className={`p-4 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-neon-green bg-neon-green/10'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${template.color}20` }}
                            >
                              <Icon className="w-5 h-5" style={{ color: template.color }} />
                            </div>
                            <div>
                              <p className={`font-medium ${isSelected ? 'text-neon-green' : 'text-white'}`}>
                                {template.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {template.totalProblems} problems
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Name */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Custom Name (optional)
                  </label>
                  <input
                    type="text"
                    value={newSheetData.name}
                    onChange={(e) => setNewSheetData({ ...newSheetData, name: e.target.value })}
                    placeholder="Enter custom name"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none transition-all"
                  />
                </div>

                {/* Template Toggle */}
                <div className="mb-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSheetData.useTemplate}
                      onChange={(e) =>
                        setNewSheetData({ ...newSheetData, useTemplate: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-neon-green focus:ring-neon-green"
                    />
                    <span className="text-gray-300">Use default template with topics</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-2.5 text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSheet}
                    disabled={loading || !newSheetData.category}
                    className="px-6 py-2.5 bg-neon-green text-black font-semibold rounded-lg hover:bg-neon-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Sheet'}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bucket Picker Modal */}
      <BucketPicker
        isOpen={showBucketPicker}
        onClose={() => setShowBucketPicker(false)}
        sheets={sheets}
        onImport={() => {
          fetchSheets();
          setShowBucketPicker(false);
        }}
      />
    </div>
  );
};

export default Sheets;
