import api from '../lib/api';

const discussionService = {
  // Get all posts with filtering
  getPosts: async (page = 1, limit = 20, { category = 'all', search = '', tag = '' } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (category && category !== 'all') params.append('category', category);
    if (search && search.trim()) params.append('search', search.trim());
    if (tag && tag.trim()) params.append('tag', tag.trim());

    const response = await api.get(`/discussions?${params.toString()}`);
    return response.data;
  },

  // Create a post or share a resource (supports FormData, files, sheets, tags)
  createPost: async (data, sharedSheetId = null) => {
    if (data instanceof FormData) {
      const response = await api.post('/discussions', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }

    if (typeof data === 'object' && data !== null && (data.file || data.title || data.category || data.tags)) {
      const formData = new FormData();
      formData.append('content', data.content || '');
      if (data.title) formData.append('title', data.title);
      if (data.category) formData.append('category', data.category);
      if (data.sharedSheetId) formData.append('sharedSheetId', data.sharedSheetId);
      if (data.tags) {
        formData.append('tags', Array.isArray(data.tags) ? JSON.stringify(data.tags) : data.tags);
      }
      if (data.file) {
        formData.append('file', data.file);
      }
      const response = await api.post('/discussions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }

    // Legacy fallback (content string, sharedSheetId)
    const response = await api.post('/discussions', { content: data, sharedSheetId });
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

  // Track attachment download
  trackDownload: async (postId) => {
    const response = await api.post(`/discussions/${postId}/download`);
    return response.data;
  },

  // Delete post
  deletePost: async (postId) => {
    const response = await api.delete(`/discussions/${postId}`);
    return response.data;
  },

  // Clone shared sheet
  cloneSheet: async (postId, options = {}) => {
    const response = await api.post('/discussions/clone-sheet', { postId, ...options });
    return response.data;
  },

  // Accept agreement
  acceptAgreement: async () => {
    const response = await api.put('/auth/accept-agreement');
    return response.data;
  },
};

export default discussionService;
