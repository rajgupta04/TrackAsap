import api from '../lib/api';

const compilerService = {
  /**
   * Run code via Azure Piston Compiler Engine API
   * @param {Object} data { source_code, language, stdin }
   */
  runCode: async (data) => {
    const res = await api.post('/compiler/run', data);
    return res.data;
  },
};

export default compilerService;
