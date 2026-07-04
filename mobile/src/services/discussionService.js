import api from './api';

const discussionService = {
  // Get all posts
  getPosts: async (page = 1, limit = 20) => {
    const response = await api.get(`/discussions?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Create a post
  createPost: async (content, sharedSheetId = null) => {
    const response = await api.post('/discussions', { content, sharedSheetId });
    return response.data;
  },

  // Toggle like
  likePost: async (postId) => {
    const response = await api.post(`/discussions/${postId}/like`);
    return response.data;
  },

  // Add comment
  commentPost: async (postId, content) => {
    const response = await api.post(`/discussions/${postId}/comment`, { content });
    return response.data;
  },

  // Delete post
  deletePost: async (postId) => {
    const response = await api.delete(`/discussions/${postId}`);
    return response.data;
  },

  // Clone shared sheet
  cloneSheet: async (postId) => {
    const response = await api.post('/discussions/clone-sheet', { postId });
    return response.data;
  },
};

export default discussionService;
