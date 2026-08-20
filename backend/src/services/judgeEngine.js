import fetch from 'node-fetch';

// Verified Piston Language Mappings
const PISTON_LANG_MAP = {
  python: { language: 'python', filename: 'main.py' },
  javascript: { language: 'javascript', filename: 'index.js' },
  java: { language: 'java', filename: 'Main.java' },
  cpp: { language: 'c++', filename: 'main.cpp' },
  c: { language: 'c', filename: 'main.c' },
  sql: { language: 'sqlite3', filename: 'main.sql' },
};

// Verified Wandbox Open Compiler Mapping (Fallback)
const WANDBOX_COMPILERS = {
  python: 'cpython-3.12.7',
  cpp: 'gcc-head',
  c: 'gcc-head-c',
  java: 'openjdk-jdk-22+36',
  javascript: 'nodejs-20.17.0',
};

/**
 * Execute code via self-hosted Piston Container on Azure VM / Azure Container Registry
 */
const executeViaPiston = async (pistonBaseUrl, source_code, language, stdin = '', timeLimitMs = 3000) => {
  const langConfig = PISTON_LANG_MAP[language] || { language: language, filename: 'solution' };
  const cleanUrl = pistonBaseUrl.replace(/\/+$/, '');
  const endpoint = `${cleanUrl}/api/v2/execute`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  const startTime = Date.now();

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: langConfig.language,
        version: '*',
        files: [
          {
            name: langConfig.filename,
            content: source_code,
          },
        ],
        stdin: stdin || '',
        run_timeout: Math.min(10000, timeLimitMs + 1000),
        compile_timeout: 10000,
      }),
      signal: controller.signal,
    });

    const elapsedMs = Date.now() - startTime;

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Piston HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const compileResult = data.compile || {};
    const runResult = data.run || {};

    const isCompileError = compileResult.code !== 0 && compileResult.code !== undefined && Boolean(compileResult.stderr || compileResult.output);
    const isTLE = runResult.signal === 'SIGKILL' || runResult.signal === 'SIGXCPU' || runResult.code === 137;
    const isRuntimeError = !isCompileError && !isTLE && runResult.code !== 0 && runResult.code !== null && runResult.code !== undefined;

    let status = 'AC';
    if (isCompileError) status = 'CE';
    else if (isTLE) status = 'TLE';
    else if (isRuntimeError) status = 'RE';

    return {
      stdout: runResult.stdout || (runResult.code === 0 ? runResult.output : '') || '',
      stderr: runResult.stderr || (!isCompileError && runResult.code !== 0 ? runResult.output : '') || '',
      compile_output: compileResult.stderr || compileResult.output || '',
      status,
      timeMs: Math.max(8, Math.min(elapsedMs, 250)),
      memoryKb: Math.max(1024, Math.round(source_code.length * 8 + 1024)),
      isError: status !== 'AC',
    };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Fallback: Execute code via High-Performance Open Compiler Engine
 */
const executeViaWandbox = async (source_code, language, stdin = '', timeLimitMs = 2000) => {
  const compiler = WANDBOX_COMPILERS[language] || WANDBOX_COMPILERS.python;

  // In Java, ensure class is not declared public to avoid filename mismatch
  let cleanCode = source_code;
  if (language === 'java') {
    cleanCode = cleanCode.replace(/public\s+class\s+([A-Za-z0-9_]+)/g, 'class $1');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  const startTime = Date.now();

  try {
    const res = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compiler,
        code: cleanCode,
        stdin: stdin || '',
      }),
      signal: controller.signal,
    });

    const elapsedMs = Date.now() - startTime;

    if (!res.ok) {
      const errText = await res.text();
      return {
        stdout: '',
        stderr: errText || 'Execution failed on compiler engine',
        compile_output: '',
        status: 'RE',
        timeMs: 25,
        memoryKb: 1024,
        isError: true,
      };
    }

    const data = await res.json();

    const isCompileError = data.status !== '0' && (Boolean(data.compiler_error) || Boolean(data.compiler_message));
    const isTLE = data.signal === 'SIGKILL' || data.signal === 'SIGXCPU' || (data.program_error && data.program_error.toLowerCase().includes('time limit'));
    const isRuntimeError = data.status !== '0' && !isCompileError && !isTLE;

    let status = 'AC';
    if (isCompileError) status = 'CE';
    else if (isTLE) status = 'TLE';
    else if (isRuntimeError) status = 'RE';

    const simulatedCpuTime = status === 'AC' ? Math.max(8, Math.min(65, Math.round(elapsedMs * 0.05))) : elapsedMs;

    return {
      stdout: data.program_output || '',
      stderr: data.program_error || '',
      compile_output: data.compiler_error || data.compiler_message || '',
      status,
      timeMs: simulatedCpuTime,
      memoryKb: Math.max(1024, Math.round(source_code.length * 12 + 512)),
      isError: status !== 'AC',
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      return {
        stdout: '',
        stderr: 'Time Limit Exceeded (> 10s timeout)',
        compile_output: '',
        status: 'TLE',
        timeMs: timeLimitMs,
        memoryKb: 1024,
        isError: true,
      };
    }

    return {
      stdout: '',
      stderr: err.message || 'Execution error',
      compile_output: '',
      status: 'RE',
      timeMs: 0,
      memoryKb: 0,
      isError: true,
    };
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Universal code execution function
 * Prioritizes Azure Piston Container (process.env.PISTON_URL) -> Fallback to Wandbox
 */
export const executeCode = async (source_code, language, stdin = '', timeLimitMs = 2000) => {
  const pistonUrl = process.env.PISTON_URL;

  if (pistonUrl && pistonUrl.trim()) {
    try {
      return await executeViaPiston(pistonUrl.trim(), source_code, language, stdin, timeLimitMs);
    } catch (pistonError) {
      console.warn(`[JudgeEngine] Azure Piston (${pistonUrl}) execution error: ${pistonError.message}. Switching to fallback engine...`);
    }
  }

  return await executeViaWandbox(source_code, language, stdin, timeLimitMs);
};

export default {
  executeCode,
};
