import api from './api';

const aiService = {
  autofillProblem: async (link, title, sheetTopics) => {
    const response = await api.post('/ai/autofill-problem', { link, title, sheetTopics });
    return response.data;
  },
};

export default aiService;
