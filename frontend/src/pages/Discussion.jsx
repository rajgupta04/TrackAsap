import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useDiscussionStore } from '../store/discussionStore';
import sheetService from '../services/sheetService';
import UserAgreementModal from '../components/discussion/UserAgreementModal';
import toast from 'react-hot-toast';

const Discussion = () => {
  const { user, acceptAgreement } = useAuthStore();
  const {
    posts,
    pagination,
    isLoading,
    fetchPosts,
    createPost,
    likePost,
    addComment,
    deletePost,
    cloneSheet,
  } = useDiscussionStore();

  const [content, setContent] = useState('');
  const [selectedSheet, setSelectedSheet] = useState('');
  const [userSheets, setUserSheets] = useState([]);
  const [showAgreement, setShowAgreement] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [isPosting, setIsPosting] = useState(false);
  const [showSheetPicker, setShowSheetPicker] = useState(false);

  useEffect(() => {
    fetchPosts();
    loadUserSheets();
  }, []);

  useEffect(() => {
    // Check if user needs agreement when trying to access discussion
    if (user && !user.acceptedDiscussionAgreement) {
      setShowAgreement(true);
    }
  }, [user]);

  const loadUserSheets = async () => {
    try {
      const sheets = await sheetService.getAll();
      setUserSheets(sheets);
    } catch {
      // silently fail
    }
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

  const handleCreatePost = async () => {
    if (!content.trim()) return;

    if (!user?.acceptedDiscussionAgreement) {
      setShowAgreement(true);
      return;
    }

    setIsPosting(true);
    const result = await createPost(content.trim(), selectedSheet || null);
    setIsPosting(false);

    if (result.success) {
      setContent('');
      setSelectedSheet('');
      toast.success('Posted to community!');
    } else if (result.requiresAgreement) {
      setShowAgreement(true);
    } else {
      toast.error(result.error || 'Failed to post');
    }
  };

  const handleLike = async (postId) => {
    await likePost(postId);
  };

  const handleComment = async (postId) => {
    const commentContent = commentInputs[postId];
    if (!commentContent?.trim()) return;

    const result = await addComment(postId, commentContent.trim());
    if (result.success) {
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } else {
      toast.error(result.error || 'Failed to add comment');
    }
  };

  const handleDelete = async (postId) => {
    const result = await deletePost(postId);
    if (result.success) {
      toast.success('Post deleted');
    } else {
      toast.error(result.error || 'Failed to delete');
    }
  };

  const handleCloneSheet = async (postId) => {
    const result = await cloneSheet(postId);
    if (result.success) {
      toast.success(`Sheet cloned with ${result.problemsCloned} problems! Check your Sheets page.`);
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
          <MessageSquare className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Community Discussion</h1>
          <p className="text-sm text-dark-400">Share your journey, inspire others</p>
        </div>
      </motion.div>

      {/* Post Creation Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-green/20 to-cyan-500/20 flex items-center justify-center border border-dark-600/50 flex-shrink-0">
            <span className="text-neon-green font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience, progress, or thoughts with the community..."
              rows={3}
              maxLength={5000}
              className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-white placeholder-dark-500 text-sm resize-none focus:outline-none focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/20 transition-all"
            />

            {/* Selected sheet preview */}
            {selectedSheet && (() => {
              const sheet = userSheets.find((s) => s._id === selectedSheet);
              if (!sheet) return null;
              const pct = sheet.totalProblems ? Math.round((sheet.solvedProblems / sheet.totalProblems) * 100) : 0;
              return (
                <div className="p-3 rounded-xl bg-dark-900/50 border border-neon-green/20 relative">
                  <button
                    onClick={() => setSelectedSheet('')}
                    className="absolute top-2 right-2 p-1 rounded-md text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <X size={12} />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={13} className="text-neon-green" />
                    <span className="text-xs font-semibold text-white">{sheet.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-dark-700 text-dark-400 uppercase">
                      {sheet.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-neon-green transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-dark-400 font-medium">{pct}% · {sheet.solvedProblems}/{sheet.totalProblems}</span>
                  </div>
                </div>
              );
            })()}

            {/* Sheet picker panel */}
            <AnimatePresence>
              {showSheetPicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 rounded-xl bg-dark-900/40 border border-dark-600/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-dark-300">Attach one of your sheets</p>
                      <button
                        onClick={() => setShowSheetPicker(false)}
                        className="text-dark-500 hover:text-white p-0.5 rounded transition-all"
                      >
                        <ChevronUp size={14} />
                      </button>
                    </div>
                    {userSheets.length === 0 ? (
                      <p className="text-xs text-dark-500 py-2 text-center">No sheets found. Create one in the Sheets page first.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {userSheets.map((sheet) => {
                          const pct = sheet.totalProblems ? Math.round((sheet.solvedProblems / sheet.totalProblems) * 100) : 0;
                          const isSelected = selectedSheet === sheet._id;
                          return (
                            <button
                              key={sheet._id}
                              onClick={() => {
                                setSelectedSheet(isSelected ? '' : sheet._id);
                                setShowSheetPicker(false);
                              }}
                              className={`text-left p-2.5 rounded-lg border transition-all ${
                                isSelected
                                  ? 'bg-neon-green/10 border-neon-green/30'
                                  : 'bg-dark-800/50 border-dark-600/30 hover:border-dark-500'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <BookOpen size={12} className={isSelected ? 'text-neon-green' : 'text-dark-400'} />
                                <span className="text-xs font-semibold text-white truncate">{sheet.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 bg-dark-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${pct}%`,
                                      backgroundColor: sheet.color || '#39FF14',
                                    }}
                                  />
                                </div>
                                <span className="text-[9px] text-dark-500">{pct}%</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-dark-700/50 text-dark-500 uppercase">{sheet.category}</span>
                                <span className="text-[9px] text-dark-500">{sheet.totalProblems} problems</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* Attach sheet button */}
              <button
                onClick={() => setShowSheetPicker(!showSheetPicker)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedSheet
                    ? 'bg-neon-green/10 text-neon-green border-neon-green/20'
                    : 'bg-dark-900/50 text-dark-400 border-dark-600/50 hover:text-white hover:border-dark-500'
                }`}
              >
                <Share2 size={13} />
                {selectedSheet ? 'Sheet attached' : 'Attach a sheet'}
                {showSheetPicker ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              <button
                onClick={handleCreatePost}
                disabled={!content.trim() || isPosting}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  content.trim() && !isPosting
                    ? 'bg-gradient-to-r from-neon-green to-emerald-500 text-dark-950 hover:shadow-lg hover:shadow-neon-green/25 active:scale-[0.98]'
                    : 'bg-dark-700 text-dark-500 cursor-not-allowed'
                }`}
              >
                {isPosting ? (
                  <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Post
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Posts Feed */}
      {isLoading && posts.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Sparkles className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400 text-lg font-medium">No posts yet</p>
          <p className="text-dark-500 text-sm mt-1">Be the first to share your experience!</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {posts.map((post, index) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-5 hover:border-dark-600/50 transition-all"
              >
                {/* Post Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-green/20 to-cyan-500/20 flex items-center justify-center border border-dark-600/50">
                      <span className="text-neon-green font-bold text-xs">
                        {post.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{post.user?.name || 'Anonymous'}</span>
                        {post.user?.role === 'admin' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <Shield size={10} className="inline mr-0.5 -mt-0.5" />
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-dark-500">
                        <Clock size={10} />
                        <span>{timeAgo(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delete button */}
                  {(post.user?._id === user?._id || user?.role === 'admin') && (
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Delete post"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Post Content */}
                <p className="text-dark-200 text-sm leading-relaxed whitespace-pre-wrap mb-4">
                  {post.content}
                </p>

                {/* Shared Sheet Card */}
                {post.sharedSheetSnapshot?.name && (
                  <div className="mb-4 p-4 rounded-xl bg-dark-900/50 border border-dark-600/30">
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
                        onClick={() => handleCloneSheet(post._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neon-green/10 text-neon-green border border-neon-green/20 hover:bg-neon-green/20 transition-all"
                      >
                        <Copy size={12} />
                        Clone Sheet
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-dark-400 mb-1">
                        <span>{post.sharedSheetSnapshot.solvedProblems} / {post.sharedSheetSnapshot.totalProblems} solved</span>
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

                {/* Post Actions */}
                <div className="flex items-center gap-4 border-t border-dark-700/30 pt-3">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-all ${
                      isLikedByMe(post)
                        ? 'text-pink-400'
                        : 'text-dark-400 hover:text-pink-400'
                    }`}
                  >
                    <Heart
                      size={14}
                      className={isLikedByMe(post) ? 'fill-current' : ''}
                    />
                    <span>{post.likesCount || 0}</span>
                  </button>

                  <button
                    onClick={() => toggleComments(post._id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-dark-400 hover:text-cyan-400 transition-all"
                  >
                    <MessageSquare size={14} />
                    <span>{post.commentsCount || 0}</span>
                    {expandedComments[post._id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>

                {/* Comments Section */}
                <AnimatePresence>
                  {expandedComments[post._id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-dark-700/30 space-y-3">
                        {/* Existing comments */}
                        {post.comments?.map((comment, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-dark-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-dark-400 font-bold text-[10px]">
                                {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-dark-300">{comment.user?.name || 'Anonymous'}</span>
                                {comment.user?.role === 'admin' && (
                                  <span className="text-[9px] font-bold text-amber-400">ADMIN</span>
                                )}
                                <span className="text-[10px] text-dark-500">{timeAgo(comment.createdAt)}</span>
                              </div>
                              <p className="text-xs text-dark-400 mt-0.5">{comment.content}</p>
                            </div>
                          </div>
                        ))}

                        {/* Comment input */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={commentInputs[post._id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({ ...prev, [post._id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleComment(post._id);
                            }}
                            placeholder="Write a comment..."
                            maxLength={1000}
                            className="flex-1 bg-dark-900/50 border border-dark-600/50 rounded-lg px-3 py-2 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/50 transition-all"
                          />
                          <button
                            onClick={() => handleComment(post._id)}
                            disabled={!commentInputs[post._id]?.trim()}
                            className="p-2 rounded-lg bg-dark-700 text-dark-400 hover:text-neon-green hover:bg-dark-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send size={12} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Load more */}
          {pagination && pagination.page < pagination.pages && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => fetchPosts(pagination.page + 1)}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-sm font-medium text-dark-300 hover:text-white hover:border-dark-600 transition-all"
              >
                {isLoading ? 'Loading...' : 'Load more posts'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Agreement Modal */}
      <UserAgreementModal
        isOpen={showAgreement}
        onAccept={handleAcceptAgreement}
        onClose={() => setShowAgreement(false)}
      />
    </div>
  );
};

export default Discussion;
