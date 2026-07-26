import fetch from 'node-fetch';

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://20.235.181.16:2358';

const LANGUAGE_ID_MAP = {
  cpp: 54,        // C++ (GCC 9.2.0)
  c: 50,          // C (GCC 9.2.0)
  java: 62,       // Java (OpenJDK 13.0.1)
  python: 71,     // Python (3.8.1)
  javascript: 63, // JavaScript (Node.js 12.14.0)
  go: 60,         // Go (1.13.5)
  rust: 73,       // Rust (1.40.0)
  other: 71,      // Fallback Python
};

/**
 * @desc    Execute code via Azure Judge0 Compiler Engine
 * @route   POST /api/compiler/run
 * @access  Private
 */
export const runCode = async (req, res) => {
  try {
    const { source_code, language, stdin } = req.body;

    if (!source_code || !source_code.trim()) {
      return res.status(400).json({ message: 'Source code cannot be empty' });
    }

    const language_id = LANGUAGE_ID_MAP[language] || LANGUAGE_ID_MAP.other;

    const response = await fetch(`${JUDGE0_URL}/submissions?wait=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_code,
        language_id,
        stdin: stdin || '',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({
        message: `Judge0 execution failed: ${errText || response.statusText}`,
      });
    }

    const result = await response.json();

    // Calculate memory in KB/MB and execution time in ms
    const timeMs = result.time ? Math.round(parseFloat(result.time) * 1000) : 0;
    const memoryKb = result.memory ? result.memory : 0;
    const memoryMb = memoryKb ? (memoryKb / 1024).toFixed(1) : 0;

    res.json({
      success: true,
      status: result.status, // { id, description }
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      compile_output: result.compile_output || '',
      message: result.message || '',
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
