import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Github,
  X,
  Sparkles,
  GitCommit,
  GitBranch,
  FileCode,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Plus,
  Edit2,
  FolderGit2,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import githubService from '../../services/githubService';
import GlassCard from '../ui/GlassCard';

const COMMIT_TYPES = ['feat', 'docs', 'refactor', 'fix', 'chore'];

const GitSyncModal = ({ isOpen, onClose, onSuccess }) => {
  const [loadingDiff, setLoadingDiff] = useState(true);
  const [diffData, setDiffData] = useState(null);
  const [commitTitle, setCommitTitle] = useState('');
  const [commitBody, setCommitBody] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Fetch diff on open
  useEffect(() => {
    if (isOpen) {
      fetchDiff();
      setSyncResult(null);
    }
  }, [isOpen]);

  const fetchDiff = async () => {
    try {
      setLoadingDiff(true);
      const data = await githubService.getDiff();
      setDiffData(data);
      setCommitTitle(data.suggestedCommit?.title || 'feat(dsa): update solutions and notes');
      setCommitBody(data.suggestedCommit?.body || '');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to inspect Git repository diff');
    } finally {
      setLoadingDiff(false);
    }
  };

  const handleRegenerateCommit = async () => {
    try {
      setIsRegenerating(true);
      const data = await githubService.getDiff();
      if (data.suggestedCommit) {
        setCommitTitle(data.suggestedCommit.title);
        setCommitBody(data.suggestedCommit.body);
        toast.success('Regenerated commit message with AI! ✨');
      }
    } catch (error) {
      toast.error('Failed to regenerate commit message');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCommitTypeSelect = (type) => {
    const currentTitle = commitTitle || '';
    const match = currentTitle.match(/^[a-z]+(\([^)]+\))?:/i);
    if (match) {
      const rest = currentTitle.slice(match[0].length).trim();
      const scopeMatch = currentTitle.match(/^[a-z]+\(([^)]+)\):/i);
      const scope = scopeMatch ? `(${scopeMatch[1]})` : '';
      setCommitTitle(`${type}${scope}: ${rest}`);
    } else {
      setCommitTitle(`${type}: ${currentTitle}`);
    }
  };

  const handlePush = async () => {
    if (!commitTitle.trim()) {
      toast.error('Please provide a commit title');
      return;
    }

    try {
      setIsSyncing(true);
      const result = await githubService.sync({
        customCommitTitle: commitTitle,
        customCommitBody: commitBody,
      });

      setSyncResult(result);
      toast.success(result.message || 'Successfully synced with GitHub! 🚀');
      onSuccess?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sync with GitHub');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  const addedFiles = diffData?.diff?.added || [];
  const modifiedFiles = diffData?.diff?.modified || [];
  const allChangedFiles = [...addedFiles, ...modifiedFiles];
  const unchangedCount = diffData?.diff?.unchangedCount || 0;
  const isUpToDate = diffData?.isUpToDate || allChangedFiles.length === 0;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full max-w-2xl bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-dark-950/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-neon-green/10 text-neon-green border border-neon-green/20">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Smart Git Sync
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 font-medium">
                    <Sparkles className="w-3 h-3" /> AI Versioning
                  </span>
                </h2>
                <p className="text-xs text-dark-400">
                  {diffData?.repoUrl ? (
                    <a
                      href={diffData.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-neon-green inline-flex items-center gap-1 transition-colors"
                    >
                      {diffData.repoUrl.replace('https://github.com/', '')}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    'Incremental push to your GitHub Activity repository'
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-dark-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {loadingDiff ? (
              <div className="py-16 text-center flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <Loader2 className="w-10 h-10 text-neon-green animate-spin" />
                  <div className="absolute inset-0 blur-lg bg-neon-green/30 rounded-full" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">Inspecting Git diff & generating commit...</p>
                  <p className="text-xs text-dark-400">Comparing local problems against remote tree</p>
                </div>
              </div>
            ) : syncResult ? (
              /* Success Screen */
              <div className="py-8 text-center flex flex-col items-center justify-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center text-neon-green shadow-[0_0_20px_rgba(57,255,20,0.2)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2 max-w-md">
                  <h3 className="text-xl font-bold text-white">Sync Completed! 🚀</h3>
                  <p className="text-sm text-dark-300">
                    {syncResult.message || 'Your repository has been updated with the latest changes.'}
                  </p>
                  {syncResult.commitUrl && (
                    <a
                      href={syncResult.commitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-neon-green hover:underline mt-2 bg-neon-green/5 border border-neon-green/20 px-3 py-1.5 rounded-lg"
                    >
                      <GitCommit className="w-3.5 h-3.5" />
                      View Commit on GitHub
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="btn-primary text-sm px-6 py-2.5 mt-4"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* Diff Overview Badges */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                    <div className="text-lg font-bold text-emerald-400 flex items-center justify-center gap-1">
                      <Plus className="w-4 h-4" /> {addedFiles.length}
                    </div>
                    <div className="text-[11px] font-medium text-emerald-300/80 uppercase tracking-wider">New Files</div>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                    <div className="text-lg font-bold text-amber-400 flex items-center justify-center gap-1">
                      <Edit2 className="w-4 h-4" /> {modifiedFiles.length}
                    </div>
                    <div className="text-[11px] font-medium text-amber-300/80 uppercase tracking-wider">Modified</div>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center">
                    <div className="text-lg font-bold text-dark-300">{unchangedCount}</div>
                    <div className="text-[11px] font-medium text-dark-400 uppercase tracking-wider">Unchanged (Skipped)</div>
                  </div>
                </div>

                {/* Changed Files List */}
                {allChangedFiles.length > 0 ? (
                  <div className="bg-dark-950/60 border border-white/10 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-dark-300 pb-1 border-b border-white/5">
                      <span className="flex items-center gap-1.5">
                        <FolderGit2 className="w-3.5 h-3.5 text-neon-green" />
                        Changed Files ({allChangedFiles.length})
                      </span>
                      {allChangedFiles.length > 4 && (
                        <button
                          type="button"
                          onClick={() => setShowAllFiles(!showAllFiles)}
                          className="text-neon-green hover:underline flex items-center gap-0.5 text-[11px]"
                        >
                          {showAllFiles ? 'Show less' : `Show all (${allChangedFiles.length})`}
                          {showAllFiles ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                      {(showAllFiles ? allChangedFiles : allChangedFiles.slice(0, 4)).map((file, idx) => {
                        const isAdded = addedFiles.some((f) => f.path === file.path);
                        const isNote = file.path.endsWith('.notes.md');
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                              {isNote ? (
                                <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              ) : (
                                <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              )}
                              <span className="text-dark-200 truncate">{file.path}</span>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-sans font-semibold shrink-0 uppercase tracking-wider ${
                                isAdded
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {isAdded ? 'Added' : 'Modified'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-300">Repository is Up to Date</h4>
                      <p className="text-xs text-emerald-400/80">
                        No new code or note changes detected since your last sync.
                      </p>
                    </div>
                  </div>
                )}

                {/* Commit Message Box */}
                {!isUpToDate && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-dark-300 flex items-center gap-1.5">
                        <GitCommit className="w-3.5 h-3.5 text-neon-green" /> Commit Message
                      </label>
                      <button
                        type="button"
                        onClick={handleRegenerateCommit}
                        disabled={isRegenerating}
                        className="text-xs text-purple-300 hover:text-purple-200 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <Sparkles className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                        {isRegenerating ? 'Generating...' : 'Regenerate with AI'}
                      </button>
                    </div>

                    {/* Commit Type Tag Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      <span className="text-[11px] text-dark-400 mr-1">Type:</span>
                      {COMMIT_TYPES.map((type) => {
                        const isSelected = commitTitle.startsWith(`${type}`);
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleCommitTypeSelect(type)}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                              isSelected
                                ? 'bg-neon-green text-dark-950 font-bold shadow-[0_0_10px_rgba(57,255,20,0.3)]'
                                : 'bg-white/5 text-dark-300 hover:text-white hover:bg-white/10 border border-white/10'
                            }`}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>

                    {/* Title Input */}
                    <input
                      type="text"
                      value={commitTitle}
                      onChange={(e) => setCommitTitle(e.target.value)}
                      placeholder="e.g., feat(arrays): solve Two Sum with hash map"
                      className="w-full bg-dark-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-dark-500 focus:border-neon-green outline-none transition-colors"
                    />

                    {/* Body Textarea */}
                    <textarea
                      value={commitBody}
                      onChange={(e) => setCommitBody(e.target.value)}
                      placeholder="Commit body / detailed bullet points..."
                      rows={3}
                      className="w-full bg-dark-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-dark-200 font-mono placeholder-dark-500 focus:border-neon-green outline-none resize-none transition-colors"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          {!syncResult && !loadingDiff && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-dark-950/60">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-dark-300 hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePush}
                disabled={isSyncing || isUpToDate}
                className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Pushing to GitHub...
                  </>
                ) : (
                  <>
                    <Github className="w-4 h-4" />
                    {isUpToDate
                      ? 'Already Up to Date'
                      : `Push ${allChangedFiles.length} Change${allChangedFiles.length === 1 ? '' : 's'}`}
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default GitSyncModal;
