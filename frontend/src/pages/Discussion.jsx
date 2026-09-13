import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Heart,
  Send,
  Trash2,
  BookOpen,
  Copy,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
  Sparkles,
  Share2,
  X,
  FileText,
  Download,
  ExternalLink,
  Search,
  Tag,
  Paperclip,
  Upload,
  Zap,
  Layers,
  Image as ImageIcon,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useDiscussionStore } from '../store/discussionStore';
import sheetService from '../services/sheetService';
import { getAvatarSrc } from '../utils/avatar';
import UserAgreementModal from '../components/discussion/UserAgreementModal';
import CloneSheetModal from '../components/discussion/CloneSheetModal';
import PdfFlipViewer from '../components/hub/PdfFlipViewer';
import useSheetStore from '../store/sheetStore';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'all', label: 'All Resources', icon: Sparkles },
  { id: 'notes', label: 'Notes & PDFs', icon: FileText },
  { id: 'sheet', label: 'Practice Sheets', icon: BookOpen },
  { id: 'cheat_sheet', label: 'Cheat Sheets', icon: Zap },
  { id: 'system_design', label: 'System Design', icon: Layers },
  { id: 'general', label: 'Discussions', icon: MessageSquare },
];

const POPULAR_TAGS = ['dsa', 'dp', 'system-design', 'cheatsheet', 'graphs', 'interview-prep', 'sql'];

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getCategoryBadge = (category) => {
  switch (category) {
    case 'notes':
      return { label: 'Notes / PDF', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    case 'sheet':
      return { label: 'Practice Sheet', color: 'bg-neon-green/15 text-neon-green border-neon-green/30' };
    case 'cheat_sheet':
      return { label: 'Cheat Sheet', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    case 'system_design':
      return { label: 'System Design', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
    case 'interview_prep':
      return { label: 'Interview Prep', color: 'bg-pink-500/15 text-pink-400 border-pink-500/30' };
    default:
      return { label: 'Discussion', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' };
  }
};

const getFileIcon = (fileType) => {
  switch (fileType) {
    case 'pdf':
      return <FileText className="w-5 h-5 text-red-400" />;
    case 'doc':
      return <FileText className="w-5 h-5 text-blue-400" />;
    case 'image':
      return <ImageIcon className="w-5 h-5 text-emerald-400" />;
    default:
      return <Paperclip className="w-5 h-5 text-amber-400" />;
  }
};

const Discussion = () => {
  const { user, acceptAgreement } = useAuthStore();
  const isVerified = user?.role === 'admin' || Boolean(user?.isEmailVerified);
  const {
    posts,
    pagination,
    isLoading,
    category,
    searchQuery,
    selectedTag,
    fetchPosts,
    setCategory,
    setSearchQuery,
    setSelectedTag,
    createPost,
    likePost,
    trackDownload,
    addComment,
    deletePost,
    cloneSheet,
  } = useDiscussionStore();

  // Creation form state
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('notes');
  const [content, setContent] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [tagsInput, setTagsInput] = useState('');
  const [tagList, setTagList] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [userSheets, setUserSheets] = useState([]);
  const [showSheetPicker, setShowSheetPicker] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Modals & comments
  const [showAgreement, setShowAgreement] = useState(false);
  const [activePdfPreview, setActivePdfPreview] = useState(null);
  const [postToClone, setPostToClone] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [searchInput, setSearchInput] = useState(searchQuery || '');

  const fileInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    fetchPosts(1);
    loadUserSheets();
  }, []);

  useEffect(() => {
    if (user && !user.acceptedDiscussionAgreement) {
      setShowAgreement(true);
    }
  }, [user]);

  const loadUserSheets = async () => {
    try {
      const sheets = await sheetService.getAll();
      setUserSheets(sheets || []);
    } catch {
      // silently fail
    }
  };

  const handleSearchChange = (value) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 400);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handleAddTag = (tagToAdd) => {
    const clean = tagToAdd.trim().toLowerCase().replace(/^#/, '');
    if (clean && !tagList.includes(clean)) {
      setTagList([...tagList, clean]);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTagList(tagList.filter((t) => t !== tagToRemove));
  };

  const handleTagsKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagsInput.trim()) {
        handleAddTag(tagsInput);
        setTagsInput('');
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds the 10 MB limit.');
      return;
    }

    setAttachedFile(file);
    if (!postTitle && file.name) {
      // Set default title to filename without extension
      setPostTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAcceptAgreement = async () => {
    const result = await acceptAgreement();
    if (result.success) {
      setShowAgreement(false);
      toast.success('Welcome to the community! 🎉');
    } else {
      toast.error(result.error || 'Failed to accept agreement');
    }
  };

  const handleCreateResource = async () => {
    if (!content.trim() && !attachedFile && !selectedSheet) {
      toast.error('Please write a description or attach a file/sheet');
      return;
    }

    if (!user?.acceptedDiscussionAgreement) {
      setShowAgreement(true);
      return;
    }

    if (!isVerified) {
      toast.error('Please verify your email before posting resources.');
      return;
    }

    setIsPosting(true);

    const postPayload = {
      title: postTitle.trim(),
      category: postCategory,
      content: content.trim() || (postTitle ? `Shared resource: ${postTitle}` : 'Community Resource'),
      sharedSheetId: selectedSheet || null,
      tags: tagList,
      file: attachedFile || null,
    };

    const result = await createPost(postPayload);
    setIsPosting(false);

    if (result.success) {
      setContent('');
      setPostTitle('');
      setAttachedFile(null);
      setSelectedSheet('');
      setTagList([]);
      setTagsInput('');
      setIsCreatorOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Resource shared successfully to the Hub! 🚀');
    } else if (result.requiresAgreement) {
      setShowAgreement(true);
    } else {
      toast.error(result.error || 'Failed to publish resource');
    }
  };

  const handleLike = async (postId) => {
    await likePost(postId);
  };

  const handleDownloadAttachment = async (post) => {
    if (!post.attachment?.fileUrl) return;
    try {
      await trackDownload(post._id);
      // Trigger download
      const link = document.createElement('a');
      link.href = post.attachment.fileUrl;
      link.download = post.attachment.fileName || 'download';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(post.attachment.fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleComment = async (postId) => {
    const commentContent = commentInputs[postId];
    if (!commentContent?.trim()) return;

    if (!isVerified) {
      toast.error('Verify your email to comment');
      return;
    }

    const result = await addComment(postId, commentContent.trim());
    if (result.success) {
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } else {
      toast.error(result.error || 'Failed to add comment');
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    const result = await deletePost(postId);
    if (result.success) {
      toast.success('Resource deleted');
    } else {
      toast.error(result.error || 'Failed to delete');
    }
  };

  const handleCloneSheetClick = (post) => {
    if (!isVerified) {
      toast.error('Verify your email to clone sheets');
      return;
    }
    setPostToClone(post);
  };

  const handleConfirmClone = async (cloneData) => {
    if (!postToClone) return;
    const result = await cloneSheet(postToClone._id, cloneData);
    if (result.success) {
      toast.success(`Sheet "${cloneData.name}" cloned with ${result.problemsCloned} problems! Check your Sheets tab.`);
      useSheetStore.getState().fetchSheets();
      setPostToClone(null);
    } else {
      toast.error(result.error || 'Failed to clone sheet');
    }
  };

  const toggleComments = (postId) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const isLikedByMe = (post) => {
    return post.likes?.some((id) => id === user?._id || id === 'current-user');
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const completionPercent = (snapshot) => {
    if (!snapshot?.totalProblems) return 0;
    return Math.round((snapshot.solvedProblems / snapshot.totalProblems) * 100);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark-900 via-dark-800 to-dark-900 border border-dark-700/60 p-6 md:p-8 shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-neon-green/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-neon-green/10 flex items-center justify-center border border-neon-green/30 shadow-lg shadow-neon-green/10">
              <Share2 className="w-6 h-6 text-neon-green" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Share Hub</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neon-green/15 text-neon-green border border-neon-green/30">
                  COMMUNITY
                </span>
              </div>
              <p className="text-sm text-dark-300 mt-1">
                Explore & share notes, PDFs, curated sheets, cheat sheets, and interview wisdom.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreatorOpen(!isCreatorOpen)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neon-green text-dark-950 font-bold text-sm shadow-lg shadow-neon-green/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Upload size={16} />
            {isCreatorOpen ? 'Close Creator' : 'Share a Resource'}
          </button>
        </div>
      </motion.div>

      {/* Resource Creator Box */}
      <AnimatePresence>
        {isCreatorOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-dark-900/90 backdrop-blur-xl border border-neon-green/30 rounded-2xl p-5 md:p-6 shadow-2xl relative">
              {/* Unverified Email Warning Overlay */}
              {!isVerified && (
                <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-amber-300 text-sm font-medium">
                    <Shield className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Please verify your email address to unlock sharing notes, PDFs, and sheets.</span>
                  </div>
                  <a
                    href="/profile"
                    className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold whitespace-nowrap transition-all"
                  >
                    Verify in Profile →
                  </a>
                </div>
              )}

              <div className="space-y-4">
                {/* Category Selector */}
                <div>
                  <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
                    Resource Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {[
                      { id: 'notes', label: 'Notes & PDF', icon: FileText },
                      { id: 'sheet', label: 'Practice Sheet', icon: BookOpen },
                      { id: 'cheat_sheet', label: 'Cheat Sheet', icon: Zap },
                      { id: 'system_design', label: 'System Design', icon: Layers },
                      { id: 'general', label: 'Discussion', icon: MessageSquare },
                    ].map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = postCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setPostCategory(cat.id)}
                          className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-neon-green/15 text-neon-green border-neon-green/40 shadow-sm'
                              : 'bg-dark-800/60 text-dark-400 border-dark-700 hover:border-dark-600 hover:text-white'
                          }`}
                        >
                          <Icon size={14} />
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title Input */}
                <div>
                  <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wider mb-1.5">
                    Resource Title
                  </label>
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="e.g., Striver DP Cheatsheet & Handwritten Notes"
                    maxLength={300}
                    className="w-full bg-dark-800/80 border border-dark-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/20 transition-all"
                  />
                </div>

                {/* Description / Content Input */}
                <div>
                  <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wider mb-1.5">
                    Description & Key Takeaways
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Provide a summary of what's inside, key patterns, tips, or what people will learn..."
                    rows={3}
                    maxLength={5000}
                    className="w-full bg-dark-800/80 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white placeholder-dark-500 resize-none focus:outline-none focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/20 transition-all"
                  />
                </div>

                {/* File Attachment & Sheet Selector Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* File Upload Area */}
                  <div className="p-3.5 rounded-xl bg-dark-800/50 border border-dark-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-dark-300 flex items-center gap-1.5">
                        <Upload size={14} className="text-neon-green" />
                        Attach Document (PDF, Notes, Image)
                      </span>
                      <span className="text-[10px] text-dark-500">Max 10 MB</span>
                    </div>

                    {attachedFile ? (
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-dark-900 border border-neon-green/30">
                        <div className="flex items-center gap-2 overflow-hidden">
                          {getFileIcon(attachedFile.name.endsWith('.pdf') ? 'pdf' : 'doc')}
                          <div className="truncate">
                            <p className="text-xs font-semibold text-white truncate">{attachedFile.name}</p>
                            <p className="text-[10px] text-dark-400">{formatFileSize(attachedFile.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="p-1 rounded-md text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer border border-dashed border-dark-600 hover:border-neon-green/50 rounded-lg p-3 text-center transition-all bg-dark-900/40 hover:bg-dark-900/80"
                      >
                        <Upload size={18} className="mx-auto text-dark-400 mb-1" />
                        <p className="text-xs text-dark-300 font-medium">Click to upload or drag & drop</p>
                        <p className="text-[10px] text-dark-500 mt-0.5">PDF, DOC, DOCX, TXT, MD, PNG, JPG</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt,.md,image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Practice Sheet Attachment Area */}
                  <div className="p-3.5 rounded-xl bg-dark-800/50 border border-dark-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-dark-300 flex items-center gap-1.5">
                        <BookOpen size={14} className="text-neon-green" />
                        Attach Practice Sheet
                      </span>
                      {selectedSheet && (
                        <button
                          type="button"
                          onClick={() => setSelectedSheet('')}
                          className="text-[10px] text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {selectedSheet ? (
                      (() => {
                        const sheet = userSheets.find((s) => s._id === selectedSheet);
                        if (!sheet) return null;
                        const pct = sheet.totalProblems
                          ? Math.round((sheet.solvedProblems / sheet.totalProblems) * 100)
                          : 0;
                        return (
                          <div className="p-2.5 rounded-lg bg-dark-900 border border-neon-green/30 flex items-center justify-between gap-2">
                            <div className="truncate">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-white truncate">{sheet.name}</span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-dark-800 text-neon-green uppercase font-mono">
                                  {sheet.category}
                                </span>
                              </div>
                              <p className="text-[10px] text-dark-400 mt-0.5">
                                {pct}% completed · {sheet.solvedProblems}/{sheet.totalProblems} solved
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedSheet('')}
                              className="p-1 rounded text-dark-500 hover:text-red-400"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })()
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowSheetPicker(!showSheetPicker)}
                        className="w-full flex items-center justify-center gap-1.5 border border-dark-600 hover:border-dark-500 rounded-lg p-3 text-xs text-dark-300 font-medium bg-dark-900/40 hover:bg-dark-900/80 transition-all"
                      >
                        <FileSpreadsheet size={16} className="text-dark-400" />
                        Select one of your sheets
                      </button>
                    )}

                    {/* Sheet Picker Dropdown */}
                    <AnimatePresence>
                      {showSheetPicker && !selectedSheet && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-2"
                        >
                          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                            {userSheets.length === 0 ? (
                              <p className="text-xs text-dark-500 text-center py-2">
                                No sheets found in your account.
                              </p>
                            ) : (
                              userSheets.map((s) => (
                                <button
                                  key={s._id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSheet(s._id);
                                    setShowSheetPicker(false);
                                  }}
                                  className="w-full text-left p-2 rounded-lg bg-dark-900 hover:bg-dark-700/60 border border-dark-700 text-xs text-dark-300 flex items-center justify-between"
                                >
                                  <span className="font-semibold text-white truncate">{s.name}</span>
                                  <span className="text-[10px] text-dark-500">{s.totalProblems} qs</span>
                                </button>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Tags Section */}
                <div>
                  <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wider mb-1.5">
                    Tags (Press Enter or comma to add)
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-dark-800/80 border border-dark-700 min-h-[42px]">
                    {tagList.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-neon-green/15 text-neon-green border border-neon-green/30"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-400 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      onKeyDown={handleTagsKeyDown}
                      placeholder={tagList.length === 0 ? 'Type tag and press Enter (e.g. dsa, striver, dp)...' : ''}
                      className="flex-1 min-w-[140px] bg-transparent border-none text-xs text-white placeholder-dark-500 focus:outline-none px-1"
                    />
                  </div>

                  {/* Suggested tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-dark-500">Popular:</span>
                    {POPULAR_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddTag(tag)}
                        className="px-2 py-0.5 rounded-md text-[10px] bg-dark-800 hover:bg-dark-700 text-dark-400 hover:text-white border border-dark-700 transition-all"
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-dark-800">
                  <button
                    type="button"
                    onClick={() => setIsCreatorOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-dark-400 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateResource}
                    disabled={isPosting || !isVerified}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all ${
                      !isPosting && isVerified
                        ? 'bg-gradient-to-r from-neon-green to-emerald-500 text-dark-950 hover:brightness-110 active:scale-95 shadow-neon-green/20'
                        : 'bg-dark-700 text-dark-500 cursor-not-allowed'
                    }`}
                  >
                    {isPosting ? (
                      <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    Publish to Hub
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-neon-green text-dark-950 border-neon-green shadow-lg shadow-neon-green/20'
                    : 'bg-dark-900/60 text-dark-300 border-dark-800 hover:border-dark-700 hover:text-white'
                }`}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Tag Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-dark-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search notes, PDFs, sheets, or topics..."
              className="w-full bg-dark-900/70 border border-dark-800 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/50 transition-all"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white p-0.5 rounded"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Active Tag Filter Indicator */}
          {selectedTag && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neon-green/10 border border-neon-green/30 text-xs text-neon-green">
              <Tag size={12} />
              <span>#{selectedTag}</span>
              <button
                onClick={() => setSelectedTag('')}
                className="hover:text-red-400 transition-colors ml-1"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Feed List */}
      {isLoading && posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin mb-3" />
          <p className="text-xs text-dark-400">Loading resources from Share Hub...</p>
        </div>
      ) : posts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 rounded-2xl bg-dark-900/40 border border-dark-800/80 p-8"
        >
          <Sparkles className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <h3 className="text-white text-lg font-bold">No resources found</h3>
          <p className="text-dark-400 text-xs mt-1 max-w-md mx-auto">
            {searchQuery || category !== 'all' || selectedTag
              ? 'No matching resources for your filters. Try clearing search or choosing another category.'
              : 'Be the first pioneer to upload notes, a practice sheet, or share interview insights!'}
          </p>
          {(searchQuery || category !== 'all' || selectedTag) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchInput('');
                setCategory('all');
                setSelectedTag('');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-xs font-semibold text-white transition-all border border-dark-700"
            >
              Reset All Filters
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {posts.map((post, index) => {
              const catBadge = getCategoryBadge(post.category);
              const hasAttachment = Boolean(post.attachment?.fileUrl);
              const hasSheet = Boolean(post.sharedSheetSnapshot?.name);

              return (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ delay: index * 0.04 }}
                  className="bg-dark-900/60 backdrop-blur-xl border border-dark-800 hover:border-dark-700/80 rounded-2xl p-5 sm:p-6 transition-all shadow-xl"
                >
                  {/* Post Top Row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={getAvatarSrc(post.user)}
                        alt={post.user?.name || 'User'}
                        className="w-10 h-10 rounded-full object-cover border border-dark-700 bg-dark-800 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">{post.user?.name || 'Anonymous Member'}</span>
                          {post.user?.role === 'admin' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              <Shield size={10} className="inline mr-0.5 -mt-0.5" />
                              ADMIN
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${catBadge.color}`}>
                            {catBadge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-dark-500 mt-0.5">
                          <Clock size={11} />
                          <span>{timeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delete button (Author or Admin) */}
                    {(post.user?._id === user?._id || user?.role === 'admin') && (
                      <button
                        onClick={() => handleDelete(post._id)}
                        className="p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete resource"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Resource Title */}
                  {post.title && (
                    <h3 className="text-base sm:text-lg font-bold text-white mb-2 tracking-tight">
                      {post.title}
                    </h3>
                  )}

                  {/* Resource Tags */}
                  {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setSelectedTag(tag)}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-dark-800 hover:bg-neon-green/10 text-dark-400 hover:text-neon-green border border-dark-700 hover:border-neon-green/30 transition-all"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Content / Notes */}
                  <p className="text-dark-200 text-sm leading-relaxed whitespace-pre-wrap mb-4">
                    {post.content}
                  </p>

                  {/* Document / File Attachment Box */}
                  {hasAttachment && (
                    <div className="mb-4 p-3.5 sm:p-4 rounded-xl bg-dark-800/60 border border-dark-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-dark-600 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-dark-900 border border-dark-700 flex items-center justify-center shrink-0">
                          {getFileIcon(post.attachment.fileType)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-white truncate max-w-xs md:max-w-md">
                            {post.attachment.fileName || 'Attached Resource'}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-dark-400 mt-0.5">
                            <span>{formatFileSize(post.attachment.fileSize)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-dark-400">
                              <Download size={11} />
                              {post.attachment.downloadsCount || 0} downloads
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                        {post.attachment.fileType === 'pdf' ||
                        post.attachment.fileName?.toLowerCase().endsWith('.pdf') ||
                        post.attachment.fileUrl?.toLowerCase().includes('.pdf') ? (
                          <>
                            <button
                              onClick={() =>
                                setActivePdfPreview({
                                  url: post.attachment.fileUrl,
                                  name: post.attachment.fileName || post.title || 'PDF Document',
                                  post: post,
                                })
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neon-green/15 text-neon-green hover:bg-neon-green/25 border border-neon-green/30 transition-all shadow-[0_0_12px_rgba(57,255,20,0.12)] group"
                              title="Open interactive 3D page-flipping preview"
                            >
                              <BookOpen size={13} className="group-hover:rotate-6 transition-transform" />
                              <span>Preview</span>
                            </button>
                            <a
                              href={post.attachment.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-dark-400 hover:text-white bg-dark-700/60 hover:bg-dark-700 border border-dark-600 transition-all"
                              title="Open raw PDF in new browser tab"
                            >
                              <ExternalLink size={13} />
                            </a>
                          </>
                        ) : (
                          <a
                            href={post.attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-700/60 hover:bg-dark-700 text-dark-300 hover:text-white border border-dark-600 transition-all"
                          >
                            <ExternalLink size={12} />
                            Preview
                          </a>
                        )}
                        <button
                          onClick={() => handleDownloadAttachment(post)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-dark-700/80 hover:bg-dark-700 text-dark-200 hover:text-white border border-dark-600 transition-all shadow-sm"
                        >
                          <Download size={12} />
                          Download
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Shared Practice Sheet Card */}
                  {hasSheet && (
                    <div className="mb-4 p-4 rounded-xl bg-dark-800/60 border border-dark-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <BookOpen size={14} className="text-neon-green" />
                          <span className="text-sm font-semibold text-white">
                            {post.sharedSheetSnapshot.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-dark-700 text-dark-400 uppercase">
                            {post.sharedSheetSnapshot.category}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCloneSheetClick(post)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            !isVerified
                              ? 'bg-dark-800 text-dark-500 border border-dark-700 cursor-not-allowed'
                              : 'bg-neon-green/10 text-neon-green border border-neon-green/20 hover:bg-neon-green/20'
                          }`}
                        >
                          <Copy size={12} />
                          Clone Sheet
                        </button>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-dark-400 mb-1">
                          <span>
                            {post.sharedSheetSnapshot.solvedProblems} / {post.sharedSheetSnapshot.totalProblems} solved
                          </span>
                          <span>{completionPercent(post.sharedSheetSnapshot)}%</span>
                        </div>
                        <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${completionPercent(post.sharedSheetSnapshot)}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: post.sharedSheetSnapshot.color || '#39FF14',
                            }}
                          />
                        </div>
                      </div>

                      {/* Topics preview */}
                      {post.sharedSheetSnapshot.topics?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {post.sharedSheetSnapshot.topics.slice(0, 6).map((topic, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-dark-700/50 text-dark-400 border border-dark-600/30"
                            >
                              {topic.name}
                            </span>
                          ))}
                          {post.sharedSheetSnapshot.topics.length > 6 && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-dark-700/50 text-dark-500">
                              +{post.sharedSheetSnapshot.topics.length - 6} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Post Actions Bar */}
                  <div className="flex items-center gap-4 border-t border-dark-800 pt-3">
                    <button
                      onClick={() => handleLike(post._id)}
                      className={`flex items-center gap-1.5 text-xs font-semibold transition-all ${
                        isLikedByMe(post) ? 'text-pink-400' : 'text-dark-400 hover:text-pink-400'
                      }`}
                    >
                      <Heart size={14} className={isLikedByMe(post) ? 'fill-current' : ''} />
                      <span>{post.likesCount || 0}</span>
                    </button>

                    <button
                      onClick={() => toggleComments(post._id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-dark-400 hover:text-cyan-400 transition-all"
                    >
                      <MessageSquare size={14} />
                      <span>{post.commentsCount || 0}</span>
                      {expandedComments[post._id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>

                  {/* Comments Thread */}
                  <AnimatePresence>
                    {expandedComments[post._id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-dark-800 space-y-3">
                          {/* Existing comments */}
                          {post.comments?.map((comment, idx) => (
                            <div key={idx} className="flex items-start gap-2.5">
                              <img
                                src={getAvatarSrc(comment.user)}
                                alt={comment.user?.name || 'User'}
                                className="w-7 h-7 rounded-full object-cover border border-dark-700 bg-dark-800 shrink-0 mt-0.5"
                              />
                              <div className="flex-1 bg-dark-800/40 rounded-xl p-2.5 border border-dark-800">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">
                                    {comment.user?.name || 'Anonymous'}
                                  </span>
                                  {comment.user?.role === 'admin' && (
                                    <span className="text-[9px] font-bold text-amber-400">ADMIN</span>
                                  )}
                                  <span className="text-[10px] text-dark-500">{timeAgo(comment.createdAt)}</span>
                                </div>
                                <p className="text-xs text-dark-300 mt-1">{comment.content}</p>
                              </div>
                            </div>
                          ))}

                          {/* Comment input */}
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={commentInputs[post._id] || ''}
                              onChange={(e) =>
                                setCommentInputs((prev) => ({ ...prev, [post._id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleComment(post._id);
                              }}
                              placeholder={
                                isVerified
                                  ? 'Write a helpful comment or ask a question...'
                                  : 'Verify email to comment'
                              }
                              disabled={!isVerified}
                              maxLength={1000}
                              className="flex-1 bg-dark-800/60 border border-dark-700 rounded-xl px-3 py-2 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/50 transition-all disabled:opacity-60"
                            />
                            <button
                              onClick={() => handleComment(post._id)}
                              disabled={!commentInputs[post._id]?.trim() || !isVerified}
                              className="p-2.5 rounded-xl bg-neon-green text-dark-950 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                            >
                              <Send size={12} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Load More Button */}
          {pagination && pagination.page < pagination.pages && (
            <div className="flex justify-center pt-6">
              <button
                onClick={() => fetchPosts(pagination.page + 1)}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-xs font-bold text-dark-200 hover:text-white hover:border-neon-green/40 transition-all shadow-lg"
              >
                {isLoading ? 'Loading more...' : 'Load More Resources'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Community Guidelines Modal */}
      <UserAgreementModal
        isOpen={showAgreement}
        onAccept={handleAcceptAgreement}
        onClose={() => setShowAgreement(false)}
      />

      {/* Clone Practice Sheet Customization Modal */}
      {postToClone && (
        <CloneSheetModal
          isOpen={Boolean(postToClone)}
          post={postToClone}
          onClose={() => setPostToClone(null)}
          onClone={handleConfirmClone}
        />
      )}

      {/* Interactive 3D Page Flip PDF Previewer Modal */}
      {activePdfPreview && (
        <PdfFlipViewer
          fileUrl={activePdfPreview.url}
          fileName={activePdfPreview.name}
          onClose={() => setActivePdfPreview(null)}
          onDownload={() => handleDownloadAttachment(activePdfPreview.post)}
        />
      )}
    </div>
  );
};

export default Discussion;
