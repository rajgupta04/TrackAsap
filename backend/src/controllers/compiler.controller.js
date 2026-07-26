import fetch from 'node-fetch';

const PISTON_URL = process.env.PISTON_URL || 'http://20.235.181.16:2358';

// Piston language name + version mapping
const PISTON_LANG_MAP = {
  cpp:        { language: 'c++',     version: '10.2.0' },
  c:          { language: 'c',       version: '10.2.0' },
  java:       { language: 'java',    version: '15.0.2' },
  python:     { language: 'python',  version: '3.10.0' },
  javascript: { language: 'javascript', version: '15.10.0' },
  sql:        { language: 'sqlite3', version: '3.36.0' },
};

// Admin-configurable compiler settings
export const compilerConfig = {
  enabled: true,
  maxRunsPerMinute: 15,
};

// In-memory execution map per user: userId -> timestamp[]
const userExecutions = new Map();

/**
 * @desc    Execute code via Azure Piston Compiler Engine
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
    const windowMs = 60000; // 1 minute window

    const timestamps = (userExecutions.get(userId) || []).filter(t => now - t < windowMs);

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

    const langConfig = PISTON_LANG_MAP[language] || PISTON_LANG_MAP.cpp;

    // Detect Java class name so javac doesn't throw file/class mismatch errors
    let fileName;
    if (language === 'java') {
      const match = source_code.match(/(?:public\s+)?class\s+([A-Za-z0-9_]+)/);
      fileName = match ? `${match[1]}.java` : 'Main.java';
    }

    const fileObj = fileName ? { name: fileName, content: source_code } : { content: source_code };

    const response = await fetch(`${PISTON_URL}/api/v2/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: langConfig.language,
        version: langConfig.version,
        files: [fileObj],
        stdin: stdin || '',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({
        message: `Piston execution failed: ${errText || response.statusText}`,
      });
    }

    const result = await response.json();

    // Map Piston response to same format frontend expects
    const run = result.run || {};
    const compile = result.compile || {};
    const isCompileError = compile.code !== 0 && (compile.stderr || compile.stdout);
    const succeeded = !isCompileError && run.code === 0 && !run.signal;
    const timeMs = run.cpu_time || 0;
    const memoryKb = run.memory ? Math.round(run.memory / 1024) : 0;
    const memoryMb = memoryKb ? (memoryKb / 1024).toFixed(1) : 0;

    let statusDesc = 'Accepted';
    let statusCode = 3;
    if (isCompileError) {
      statusDesc = 'Compilation Error';
      statusCode = 6;
    } else if (!succeeded) {
      statusCode = 11;
      if (run.signal === 'SIGKILL' || run.signal === 'SIGABRT' || (run.stderr && run.stderr.includes('signal 6'))) {
        statusDesc = 'Stack Overflow / Memory Exceeded';
      } else {
        statusDesc = 'Runtime Error';
      }
    }

    res.json({
      success: true,
      status: {
        id: statusCode,
        description: statusDesc,
      },
      stdout: run.stdout || '',
      stderr: run.stderr || '',
      compile_output: compile.stderr || compile.stdout || '',
      message: run.message || '',
      timeMs,
      memoryKb,
      memoryMb,
    });
  } catch (error) {
    console.error('Compiler run error:', error?.message);
    res.status(500).json({
      message: error?.message || 'Failed to connect to Azure Compiler Engine',
    });
  }
};
