import { executeCode } from '../services/judgeEngine.js';

// Admin-configurable compiler settings
export const compilerConfig = {
  enabled: true,
  maxRunsPerMinute: 30,
};

// In-memory execution map per user: userId -> timestamp[]
const userExecutions = new Map();

/**
 * @desc    Execute code via Resilient Piston Compiler Engine
 * @route   POST /api/compiler/run
 * @access  Private
 */
export const runCode = async (req, res) => {
  try {
    // 1. Admin Killswitch check
    if (!compilerConfig.enabled) {
      return res.status(403).json({
        message: 'Compiler execution is temporarily disabled by system administrator.',
      });
    }

    // 2. User Rate Limiter check (per 60 seconds)
    const userId = req.user?._id?.toString() || req.ip;
    const now = Date.now();
    const windowMs = 60000;

    const timestamps = (userExecutions.get(userId) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= compilerConfig.maxRunsPerMinute) {
      const oldestRun = timestamps[0];
      const secondsLeft = Math.ceil((windowMs - (now - oldestRun)) / 1000);
      return res.status(429).json({
        message: `Rate limit exceeded! You can run code max ${compilerConfig.maxRunsPerMinute} times per minute. Please wait ${secondsLeft} seconds before trying again.`,
        secondsLeft,
      });
    }

    // Record execution timestamp
    timestamps.push(now);
    userExecutions.set(userId, timestamps);

    const { source_code, language, stdin } = req.body;

    if (!source_code || !source_code.trim()) {
      return res.status(400).json({ message: 'Source code cannot be empty' });
    }

    const result = await executeCode(source_code, language, stdin || '', 5000);

    let statusCode = 3;
    let statusDesc = 'Accepted';

    if (result.status === 'CE') {
      statusCode = 6;
      statusDesc = 'Compilation Error';
    } else if (result.status === 'TLE') {
      statusCode = 5;
      statusDesc = 'Time Limit Exceeded';
    } else if (result.status === 'MLE') {
      statusCode = 11;
      statusDesc = 'Memory Limit Exceeded';
    } else if (result.status === 'RE') {
      statusCode = 11;
      statusDesc = 'Runtime Error';
    }

    res.json({
      success: true,
      status: {
        id: statusCode,
        description: statusDesc,
      },
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      timeMs: result.timeMs,
      memoryKb: result.memoryKb,
      memoryMb: (result.memoryKb / 1024).toFixed(1),
    });
  } catch (error) {
    console.error('Compiler run error:', error?.message);
    res.status(500).json({
      message: error?.message || 'Failed to execute code',
    });
  }
};

export default {
  runCode,
  compilerConfig,
};
