import { create } from 'zustand';
import discussionService from '../services/discussionService';

export const useDiscussionStore = create((set, get) => ({
  posts: [],
  pagination: null,
  isLoading: false,
  error: null,
  category: 'all',
  searchQuery: '',
  selectedTag: '',

  fetchPosts: async (page = 1, customFilters = {}) => {
    set({ isLoading: true, error: null });
    const { category, searchQuery, selectedTag } = get();
    const effectiveCategory = customFilters.category !== undefined ? customFilters.category : category;
    const effectiveSearch = customFilters.search !== undefined ? customFilters.search : searchQuery;
    const effectiveTag = customFilters.tag !== undefined ? customFilters.tag : selectedTag;

    try {
      const data = await discussionService.getPosts(page, 20, {
        category: effectiveCategory,
        search: effectiveSearch,
        tag: effectiveTag,
      });

      if (page === 1) {
        set({ posts: data.posts, pagination: data.pagination, isLoading: false });
      } else {
        set((state) => ({
          posts: [...state.posts, ...data.posts],
          pagination: data.pagination,
          isLoading: false,
        }));
      }
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to load resources', isLoading: false });
    }
  },

  setCategory: (category) => {
    set({ category });
    get().fetchPosts(1, { category });
  },

  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    get().fetchPosts(1, { search: searchQuery });
  },

  setSelectedTag: (tag) => {
    const newTag = get().selectedTag === tag ? '' : tag;
    set({ selectedTag: newTag });
    get().fetchPosts(1, { tag: newTag });
  },

  createPost: async (data, sharedSheetId = null) => {
    try {
      const post = await discussionService.createPost(data, sharedSheetId);
      set((state) => ({ posts: [post, ...state.posts] }));
      return { success: true, post };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to publish resource';
      const requiresAgreement = error.response?.data?.requiresAgreement || false;
      return { success: false, error: message, requiresAgreement };
    }
  },

  likePost: async (postId) => {
    try {
      const result = await discussionService.likePost(postId);
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId
            ? {
                ...post,
                likesCount: result.likesCount,
                likes: result.liked
                  ? [...(post.likes || []), 'current-user']
                  : (post.likes || []).slice(0, -1),
              }
            : post
        ),
      }));
      return result;
    } catch (error) {
      return { error: error.response?.data?.message || 'Failed to like post' };
    }
  },

  trackDownload: async (postId) => {
    try {
      // Optimistic update
      set((state) => ({
        posts: state.posts.map((p) =>
          p._id === postId && p.attachment
            ? {
                ...p,
                attachment: {
                  ...p.attachment,
                  downloadsCount: (p.attachment.downloadsCount || 0) + 1,
                },
              }
            : p
        ),
      }));
      const result = await discussionService.trackDownload(postId);
      return result;
    } catch (error) {
      console.error('Track download error:', error);
    }
  },

  addComment: async (postId, content) => {
    try {
      const updatedPost = await discussionService.commentPost(postId, content);
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId ? updatedPost : post
        ),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add comment' };
    }
  },

  deletePost: async (postId) => {
    try {
      await discussionService.deletePost(postId);
      set((state) => ({
        posts: state.posts.filter((post) => post._id !== postId),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to delete post' };
    }
  },

  cloneSheet: async (postId, options = {}) => {
    try {
      const result = await discussionService.cloneSheet(postId, options);
      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to clone sheet' };
    }
  },
}));
