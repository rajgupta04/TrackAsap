import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Save,
  Send,
  Eye,
  Edit3,
  Code2,
  ListPlus,
  FileText,
  Clock,
  HardDrive,
  Upload,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import CodeEditor from '../components/editor/CodeEditor';
import { DEFAULT_TEMPLATES } from '../components/editor/editorConfig';
import judgeService from '../services/judgeService';
import { useAuthStore } from '../store/authStore';

const ProblemSetterStudio = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('statement'); // statement | examples | testcases | code | myProblems
  const [myProblems, setMyProblems] = useState([]);
  const [isLoadingProblems, setIsLoadingProblems] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');
  const [constraints, setConstraints] = useState(['1 <= nums.length <= 10^5']);
  const [hints, setHints] = useState(['']);
  const [editorial, setEditorial] = useState('');

  // Examples with images
  const [examples, setExamples] = useState([
    { input: '', output: '', explanation: '', imageUrl: '' },
  ]);

  // Testcases
  const [visibleTestcases, setVisibleTestcases] = useState([
    { input: '', expectedOutput: '' },
  ]);
  const [hiddenTestcases, setHiddenTestcases] = useState([
    { input: '', expectedOutput: '' },
  ]);
  const [batchJsonInput, setBatchJsonInput] = useState('');
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Starter Code
  const [starterCode, setStarterCode] = useState({
    cpp: DEFAULT_TEMPLATES.cpp,
    python: DEFAULT_TEMPLATES.python,
    java: DEFAULT_TEMPLATES.java,
    javascript: DEFAULT_TEMPLATES.javascript,
  });
  const [activeCodeLang, setActiveCodeLang] = useState('python');

  // Limits
  const [timeLimitMs, setTimeLimitMs] = useState(1000);
  const [memoryLimitMb, setMemoryLimitMb] = useState(256);

  // Image Upload Ref
  const fileInputRef = useRef(null);
  const [uploadingExampleIdx, setUploadingExampleIdx] = useState(null);

  useEffect(() => {
    fetchMyProblems();
  }, []);

  const fetchMyProblems = async () => {
    try {
      setIsLoadingProblems(true);
      const res = await judgeService.getMyAuthoredProblems();
      if (res.success) {
        setMyProblems(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load authored problems:', err);
    } finally {
      setIsLoadingProblems(false);
    }
  };

  const resetForm = () => {
    setEditingProblemId(null);
    setTitle('');
    setSlug('');
    setDifficulty('Medium');
    setTagsInput('');
    setDescription('');
    setConstraints(['1 <= nums.length <= 10^5']);
    setHints(['']);
    setEditorial('');
    setExamples([{ input: '', output: '', explanation: '', imageUrl: '' }]);
    setVisibleTestcases([{ input: '', expectedOutput: '' }]);
    setHiddenTestcases([{ input: '', expectedOutput: '' }]);
    setStarterCode({
      cpp: DEFAULT_TEMPLATES.cpp,
      python: DEFAULT_TEMPLATES.python,
      java: DEFAULT_TEMPLATES.java,
      javascript: DEFAULT_TEMPLATES.javascript,
    });
    setTimeLimitMs(1000);
    setMemoryLimitMb(256);
    setActiveTab('statement');
  };

  const loadProblemForEdit = (problem) => {
    setEditingProblemId(problem._id);
    setTitle(problem.title || '');
    setSlug(problem.slug || '');
    setDifficulty(problem.difficulty || 'Medium');
    setTagsInput((problem.tags || []).join(', '));
    setDescription(problem.description || '');
    setConstraints(problem.constraints?.length ? problem.constraints : ['']);
    setHints(problem.hints?.length ? problem.hints : ['']);
    setEditorial(problem.editorial || '');
    setExamples(
      problem.examples?.length
        ? problem.examples
        : [{ input: '', output: '', explanation: '', imageUrl: '' }]
    );
    setVisibleTestcases(
      problem.visibleTestcases?.length
        ? problem.visibleTestcases
        : [{ input: '', expectedOutput: '' }]
    );
    setHiddenTestcases(
      problem.hiddenTestcases?.length
        ? problem.hiddenTestcases
        : [{ input: '', expectedOutput: '' }]
    );
    setStarterCode(problem.starterCode || DEFAULT_TEMPLATES);
    setTimeLimitMs(problem.timeLimitMs || 1000);
    setMemoryLimitMb(problem.memoryLimitMb || 256);
    setActiveTab('statement');
    toast.success(`Loaded "${problem.title}" for editing`);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || uploadingExampleIdx === null) return;

    const formData = new FormData();
    formData.append('image', file);

    const toastId = toast.loading('Uploading diagram to Cloudinary...');
    try {
      const res = await judgeService.uploadProblemImage(formData);
      if (res.success && res.imageUrl) {
        setExamples((prev) => {
          const updated = [...prev];
          updated[uploadingExampleIdx].imageUrl = res.imageUrl;
          return updated;
        });
        toast.success('Diagram attached successfully!', { id: toastId });
      }
    } catch (err) {
      toast.error('Image upload failed', { id: toastId });
    } finally {
      setUploadingExampleIdx(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (status = 'draft') => {
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required');
      setActiveTab('statement');
      return;
    }

    const payload = {
      title,
      slug: slug.trim() || undefined,
      difficulty,
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      description,
      constraints: constraints.filter((c) => c.trim()),
      hints: hints.filter((h) => h.trim()),
      editorial,
      examples: examples.filter((ex) => ex.input.trim() || ex.output.trim()),
      visibleTestcases: visibleTestcases.filter((tc) => tc.expectedOutput.trim()),
      hiddenTestcases: hiddenTestcases.filter((tc) => tc.expectedOutput.trim()),
      starterCode,
      timeLimitMs: Number(timeLimitMs),
      memoryLimitMb: Number(memoryLimitMb),
      status,
    };

    setIsSaving(true);
    try {
      if (editingProblemId) {
        const res = await judgeService.updateProblem(editingProblemId, payload);
        toast.success(res.message || (status === 'published' ? (isAdmin ? 'Problem Published!' : 'Submitted for Approval! 🚀') : 'Draft Saved!'));
      } else {
        const res = await judgeService.createProblem(payload);
        toast.success(res.message || (status === 'published' ? (isAdmin ? 'Problem Published!' : 'Submitted for Approval! 🚀') : 'Draft Created!'));
      }
      fetchMyProblems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save problem');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this problem?')) return;
    try {
      await judgeService.deleteProblem(id);
      toast.success('Problem deleted');
      if (editingProblemId === id) resetForm();
      fetchMyProblems();
    } catch (err) {
      toast.error('Failed to delete problem');
    }
  };

  // Helper for parsing batch testcases
  const handleImportBatchJson = () => {
    try {
      const parsed = JSON.parse(batchJsonInput);
      if (!Array.isArray(parsed)) {
        toast.error('JSON must be an array of { input, expectedOutput } objects');
        return;
      }
      setHiddenTestcases((prev) => [...prev, ...parsed]);
      setShowBatchModal(false);
      setBatchJsonInput('');
      toast.success(`Imported ${parsed.length} hidden testcases!`);
    } catch {
      toast.error('Invalid JSON format');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Hidden File Input for Cloudinary Uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-neon-green text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Problem Setter Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            {editingProblemId ? `Editing: ${title || 'Untitled'}` : 'Author New Problem'}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {editingProblemId && (
            <button
              onClick={resetForm}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-dark-300 text-xs font-medium border border-white/10 transition"
            >
              New Problem
            </button>
          )}
          <button
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> Save Draft
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-green hover:brightness-110 text-dark-950 text-xs font-bold transition shadow-lg shadow-neon-green/20 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> {isAdmin ? 'Publish to Arena' : 'Submit for Approval 🚀'}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'statement', label: '1. Statement & Details', icon: FileText },
          { id: 'examples', label: '2. Examples & Diagrams', icon: ImageIcon },
          { id: 'testcases', label: '3. Test Cases Builder', icon: ListPlus },
          { id: 'code', label: '4. Starter Code & Limits', icon: Code2 },
          { id: 'myProblems', label: `My Authored (${myProblems.length})`, icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-neon-green text-neon-green bg-neon-green/5 rounded-t-lg'
                  : 'border-transparent text-dark-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: STATEMENT & DETAILS */}
      {activeTab === 'statement' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Statement Editor */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">
                Problem Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Merge K Sorted Lists"
                className="w-full px-4 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white text-sm focus:border-neon-green/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">
                Problem Description (Markdown + Math supported) *
              </label>
              <textarea
                rows={12}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write clear problem statement, background context, and input/output expectations..."
                className="w-full p-4 bg-dark-900 border border-white/10 rounded-xl text-white text-sm font-mono focus:border-neon-green/60 focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">
                Editorial & Solution Walkthrough (Optional)
              </label>
              <textarea
                rows={6}
                value={editorial}
                onChange={(e) => setEditorial(e.target.value)}
                placeholder="Provide intuition, optimal time/space complexity analysis, and approach..."
                className="w-full p-4 bg-dark-900 border border-white/10 rounded-xl text-white text-sm font-mono focus:border-neon-green/60 focus:outline-none"
              />
            </div>
          </div>

          {/* Right Sidebar Metadata */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-white/10 bg-dark-900/60 space-y-4">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Problem Parameters
              </h3>

              {/* Difficulty */}
              <div>
                <label className="block text-xs text-dark-400 mb-1.5">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Easy', 'Medium', 'Hard'].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition ${
                        difficulty === diff
                          ? diff === 'Easy'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : diff === 'Medium'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : 'bg-white/5 text-dark-400 border-white/5 hover:border-white/15'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* URL Slug */}
              <div>
                <label className="block text-xs text-dark-400 mb-1.5">
                  Custom Slug (optional)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="auto-generated-from-title"
                  className="w-full px-3 py-2 bg-dark-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-neon-green/50 font-mono"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs text-dark-400 mb-1.5">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Array, Hash Table, Two Pointers"
                  className="w-full px-3 py-2 bg-dark-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-neon-green/50"
                />
              </div>
            </div>

            {/* Constraints */}
            <div className="p-5 rounded-2xl border border-white/10 bg-dark-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Constraints
                </h3>
                <button
                  type="button"
                  onClick={() => setConstraints([...constraints, ''])}
                  className="text-xs text-neon-green hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              {constraints.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={c}
                    onChange={(e) => {
                      const updated = [...constraints];
                      updated[idx] = e.target.value;
                      setConstraints(updated);
                    }}
                    placeholder="e.g. 1 <= n <= 10^5"
                    className="flex-1 px-3 py-1.5 bg-dark-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-neon-green/50 font-mono"
                  />
                  {constraints.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setConstraints(constraints.filter((_, i) => i !== idx))
                      }
                      className="text-dark-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXAMPLES & DIAGRAMS */}
      {activeTab === 'examples' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-dark-400">
              Provide visual examples to help solvers understand the problem. You can attach diagrams stored securely on Cloudinary.
            </p>
            <button
              onClick={() =>
                setExamples([
                  ...examples,
                  { input: '', output: '', explanation: '', imageUrl: '' },
                ])
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-green/10 text-neon-green border border-neon-green/30 text-xs font-semibold hover:bg-neon-green/20 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Example
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {examples.map((ex, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-white/10 bg-dark-900/60 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neon-green uppercase tracking-wider">
                    Example {idx + 1}
                  </span>
                  {examples.length > 1 && (
                    <button
                      onClick={() => setExamples(examples.filter((_, i) => i !== idx))}
                      className="text-dark-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] text-dark-400 mb-1">Input</label>
                  <textarea
                    rows={2}
                    value={ex.input}
                    onChange={(e) => {
                      const updated = [...examples];
                      updated[idx].input = e.target.value;
                      setExamples(updated);
                    }}
                    placeholder="nums = [2,7,11,15], target = 9"
                    className="w-full p-2.5 bg-dark-950 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-neon-green/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-dark-400 mb-1">Output</label>
                  <input
                    type="text"
                    value={ex.output}
                    onChange={(e) => {
                      const updated = [...examples];
                      updated[idx].output = e.target.value;
                      setExamples(updated);
                    }}
                    placeholder="[0, 1]"
                    className="w-full px-2.5 py-1.5 bg-dark-950 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-neon-green/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-dark-400 mb-1">Explanation</label>
                  <textarea
                    rows={2}
                    value={ex.explanation}
                    onChange={(e) => {
                      const updated = [...examples];
                      updated[idx].explanation = e.target.value;
                      setExamples(updated);
                    }}
                    placeholder="Because nums[0] + nums[1] == 9, we return [0, 1]."
                    className="w-full p-2.5 bg-dark-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-neon-green/50"
                  />
                </div>

                {/* Image Upload Area */}
                <div>
                  <label className="block text-[11px] text-dark-400 mb-1">
                    Diagram / Illustration (Optional)
                  </label>
                  {ex.imageUrl ? (
                    <div className="relative rounded-lg overflow-hidden border border-white/10 group/img">
                      <img
                        src={ex.imageUrl}
                        alt="Example diagram"
                        className="w-full max-h-48 object-contain bg-black/40 p-2"
                      />
                      <button
                        onClick={() => {
                          const updated = [...examples];
                          updated[idx].imageUrl = '';
                          setExamples(updated);
                        }}
                        className="absolute top-2 right-2 p-1 rounded-md bg-rose-500 text-white opacity-0 group-hover/img:opacity-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setUploadingExampleIdx(idx);
                        fileInputRef.current?.click();
                      }}
                      className="w-full py-3 px-4 border border-dashed border-white/15 hover:border-neon-green/40 rounded-xl bg-dark-950 text-xs text-dark-400 hover:text-white flex items-center justify-center gap-2 transition"
                    >
                      <Upload className="w-3.5 h-3.5 text-neon-green" />
                      Upload Diagram Image (Cloudinary)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TESTCASES BUILDER */}
      {activeTab === 'testcases' && (
        <div className="space-y-8">
          {/* Section 1: Visible Testcases */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-neon-green" />
                  Visible Sample Test Cases (Used for "Run Code")
                </h3>
                <p className="text-xs text-dark-400 mt-0.5">
                  These test cases are visible to solvers in the bottom drawer tabs.
                </p>
              </div>
              <button
                onClick={() =>
                  setVisibleTestcases([
                    ...visibleTestcases,
                    { input: '', expectedOutput: '' },
                  ])
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Sample Case
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleTestcases.map((tc, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-white/10 bg-dark-900/60 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-dark-300">
                    <span>Sample Case {idx + 1}</span>
                    {visibleTestcases.length > 1 && (
                      <button
                        onClick={() =>
                          setVisibleTestcases(
                            visibleTestcases.filter((_, i) => i !== idx)
                          )
                        }
                        className="text-dark-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] text-dark-400 uppercase font-semibold">Input (stdin - multi-line supported)</label>
                    <textarea
                      rows={3}
                      value={tc.input}
                      onChange={(e) => {
                        const updated = [...visibleTestcases];
                        updated[idx].input = e.target.value;
                        setVisibleTestcases(updated);
                      }}
                      placeholder={"4\n1 2 3 4"}
                      className="w-full p-2 bg-dark-950 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-neon-green/50 whitespace-pre leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-dark-400 uppercase font-semibold">Expected Output (stdout)</label>
                    <textarea
                      rows={2}
                      value={tc.expectedOutput}
                      onChange={(e) => {
                        const updated = [...visibleTestcases];
                        updated[idx].expectedOutput = e.target.value;
                        setVisibleTestcases(updated);
                      }}
                      placeholder="10"
                      className="w-full p-2 bg-dark-950 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-neon-green/50 whitespace-pre leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/10" />

          {/* Section 2: Hidden Testcases */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Hidden Judge Test Cases (Used for "Submit Code")
                </h3>
                <p className="text-xs text-dark-400 mt-0.5">
                  These test cases are completely hidden from the client to prevent hardcoding.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBatchModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-green/10 text-neon-green border border-neon-green/30 text-xs font-semibold hover:bg-neon-green/20 transition"
                >
                  <ListPlus className="w-3.5 h-3.5" /> Batch Paste JSON
                </button>
                <button
                  onClick={() =>
                    setHiddenTestcases([
                      ...hiddenTestcases,
                      { input: '', expectedOutput: '' },
                    ])
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Hidden Case
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
              {hiddenTestcases.map((tc, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-white/10 bg-dark-900/60 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-dark-300">
                    <span className="text-amber-400/80">Hidden Case {idx + 1}</span>
                    {hiddenTestcases.length > 1 && (
                      <button
                        onClick={() =>
                          setHiddenTestcases(
                            hiddenTestcases.filter((_, i) => i !== idx)
                          )
                        }
                        className="text-dark-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] text-dark-400 uppercase font-semibold">Input (stdin - multi-line supported)</label>
                    <textarea
                      rows={3}
                      value={tc.input}
                      onChange={(e) => {
                        const updated = [...hiddenTestcases];
                        updated[idx].input = e.target.value;
                        setHiddenTestcases(updated);
                      }}
                      placeholder={"5\n10 20 30 40 50"}
                      className="w-full p-2 bg-dark-950 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-neon-green/50 whitespace-pre leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-dark-400 uppercase font-semibold">Expected Output (stdout)</label>
                    <textarea
                      rows={2}
                      value={tc.expectedOutput}
                      onChange={(e) => {
                        const updated = [...hiddenTestcases];
                        updated[idx].expectedOutput = e.target.value;
                        setHiddenTestcases(updated);
                      }}
                      placeholder="150"
                      className="w-full p-2 bg-dark-950 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-neon-green/50 whitespace-pre leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STARTER CODE & LIMITS */}
      {activeTab === 'code' && (
        <div className="space-y-6">
          {/* Limits row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl border border-white/10 bg-dark-900/60">
            <div>
              <label className="block text-xs font-semibold text-white mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neon-green" /> Time Limit (ms)
              </label>
              <input
                type="number"
                value={timeLimitMs}
                onChange={(e) => setTimeLimitMs(e.target.value)}
                min={100}
                max={10000}
                step={100}
                className="w-full px-3 py-2 bg-dark-950 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-neon-green/50"
              />
              <p className="text-[10px] text-dark-400 mt-1">Default: 1000ms (1.0 second)</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-neon-green" /> Memory Limit (MB)
              </label>
              <input
                type="number"
                value={memoryLimitMb}
                onChange={(e) => setMemoryLimitMb(e.target.value)}
                min={16}
                max={1024}
                step={32}
                className="w-full px-3 py-2 bg-dark-950 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-neon-green/50"
              />
              <p className="text-[10px] text-dark-400 mt-1">Default: 256MB</p>
            </div>
          </div>

          {/* Starter Code Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Language Boilerplates & Starter Code
              </h3>
              <div className="flex items-center gap-1.5">
                {['python', 'cpp', 'java', 'javascript'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveCodeLang(lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition border ${
                      activeCodeLang === lang
                        ? 'bg-neon-green text-dark-950 border-neon-green'
                        : 'bg-dark-900 text-dark-300 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {lang === 'cpp' ? 'C++' : lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[400px] rounded-2xl overflow-hidden border border-white/10">
              <CodeEditor
                value={starterCode[activeCodeLang] || ''}
                onChange={(val) =>
                  setStarterCode({ ...starterCode, [activeCodeLang]: val })
                }
                language={activeCodeLang}
                theme="tokyoNight"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MY AUTHORED PROBLEMS */}
      {activeTab === 'myProblems' && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-dark-900/50">
            {isLoadingProblems ? (
              <div className="p-8 text-center text-dark-400 text-sm animate-pulse">
                Loading your authored problems...
              </div>
            ) : myProblems.length === 0 ? (
              <div className="p-12 text-center text-dark-400 space-y-2">
                <Layers className="w-8 h-8 mx-auto text-dark-500" />
                <p className="text-sm">You haven't authored any problems yet.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.02] text-xs text-dark-400 uppercase font-medium">
                  <tr>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submissions</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {myProblems.map((prob) => (
                    <tr key={prob._id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4 font-medium text-white">
                        {prob.title}
                        <div className="text-xs text-dark-400 font-mono">
                          /solve/{prob.slug}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            prob.difficulty === 'Easy'
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : prob.difficulty === 'Medium'
                              ? 'text-amber-400 bg-amber-500/10'
                              : 'text-rose-400 bg-rose-500/10'
                          }`}
                        >
                          {prob.difficulty}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1.5 ${
                            prob.status === 'published'
                              ? 'text-neon-green bg-neon-green/10 border border-neon-green/30'
                              : prob.status === 'pending'
                              ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30 animate-pulse'
                              : 'text-dark-400 bg-white/5 border border-white/10'
                          }`}
                        >
                          {prob.status === 'published' && <CheckCircle2 className="w-3 h-3" />}
                          {prob.status === 'pending' && <Clock className="w-3 h-3 text-amber-400" />}
                          {prob.status === 'draft' && <Edit3 className="w-3 h-3" />}
                          {prob.status === 'published' ? 'Published' : prob.status === 'pending' ? 'Pending Approval' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-dark-300">
                        {prob.acceptedSubmissions || 0} / {prob.totalSubmissions || 0} AC
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => loadProblemForEdit(prob)}
                          className="px-2.5 py-1 rounded bg-white/10 hover:bg-neon-green hover:text-dark-950 text-white text-xs transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(prob._id)}
                          className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-xs transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Batch Import JSON Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-dark-900 border border-white/15 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Batch Import Test Cases</h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-dark-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-dark-300">
              Paste a JSON array of test cases formatted as:{' '}
              <code className="text-neon-green">
                [{'{"input": "...", "expectedOutput": "..."}'}]
              </code>
            </p>
            <textarea
              rows={8}
              value={batchJsonInput}
              onChange={(e) => setBatchJsonInput(e.target.value)}
              placeholder={`[\n  {\n    "input": "100\\n1 2 3",\n    "expectedOutput": "6"\n  }\n]`}
              className="w-full p-3 bg-dark-950 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-neon-green/50"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBatchModal(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-dark-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleImportBatchJson}
                className="px-4 py-1.5 rounded-lg bg-neon-green text-dark-950 text-xs font-bold"
              >
                Import Test Cases
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemSetterStudio;
