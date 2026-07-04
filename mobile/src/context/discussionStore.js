import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import discussionService from '../services/discussionService';

const useDiscussionStore = create(
  persist(
    (set, get) => ({
  posts: [],
  pagination: null,
  isLoading: false,
  error: null,
  
  clearStore: () => set({ posts: [], pagination: null, isLoading: false, error: null }),

  fetchPosts: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const data = await discussionService.getPosts(page);
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
      set({ error: error.response?.data?.message || 'Failed to load posts', isLoading: false });
    }
  },

  createPost: async (content, sharedSheetId = null) => {
    try {
      const post = await discussionService.createPost(content, sharedSheetId);
      set((state) => ({ posts: [post, ...state.posts] }));
      return { success: true, post };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create post';
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

  cloneSheet: async (postId) => {
    try {
      const result = await discussionService.cloneSheet(postId);
      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to clone sheet' };
    }
  },
}), {
  name: 'discussion-storage',
  storage: createJSONStorage(() => AsyncStorage),
}));

export default useDiscussionStore;
