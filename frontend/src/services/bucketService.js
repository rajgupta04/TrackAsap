import api from '../lib/api';

const bucketService = {
  // Get all available buckets
  getBuckets: async () => {
    const response = await api.get('/buckets');
    return response.data;
  },

  // Get single bucket with all problems
  getBucket: async (bucketId) => {
    const response = await api.get(`/buckets/${bucketId}`);
    return response.data;
  },

  // Import bucket problems into existing sheet
  importToSheet: async (bucketId, sheetId) => {
    const response = await api.post('/buckets/import', { bucketId, sheetId });
    return response.data;
  },

  // Create new sheet from bucket
  createSheetFromBucket: async (bucketId, sheetName) => {
    const response = await api.post('/buckets/create-sheet', { bucketId, sheetName });
    return response.data;
  },
};

export default bucketService;
