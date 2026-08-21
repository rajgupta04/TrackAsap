import JudgeProblem from '../models/JudgeProblem.model.js';
import Submission from '../models/Submission.model.js';
import { executeCode } from '../services/judgeEngine.js';

/**
 * Converts literal \n strings into actual newline characters for standard input
 */
const sanitizeInput = (input = '') => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');
};

/**
 * Normalizes output strings for robust comparison
 */
const normalizeOutput = (str = '') => {
  return str
    .trim()
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');
};

/**
 * Assembles user code with driver code and handles language-specific requirements
 * (e.g. In Java, all imports must be at the very top before any class declarations,
 * and the driver class with main() must precede the user Solution class).
 */
const assembleExecutableCode = (code = '', driver = '', language = '') => {
  const hasMain = (
    (language === 'java' && /public\s+static\s+void\s+main/i.test(code)) ||
    (language === 'python' && /if\s+__name__\s*==\s*['"]__main__['"]/i.test(code)) ||
    (language === 'cpp' && /int\s+main\s*\(/i.test(code)) ||
    (language === 'javascript' && /main\s*\(\s*\)/i.test(code))
  );

  if (hasMain || !driver) {
    return code;
  }

  if (language === 'java') {
    const full = `${driver}\n\n${code}`;
    const imports = new Set(['import java.util.*;', 'import java.io.*;']);
    const nonImports = [];
    for (const line of full.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('import ')) {
        imports.add(trimmed);
      } else {
        nonImports.push(line);
      }
    }
    return Array.from(imports).join('\n') + '\n\n' + nonImports.join('\n');
  }

  return `${code}\n\n${driver}`;
};

/**
 * @desc    Run code against visible sample testcases OR user custom input
 * @route   POST /api/judge/run
 * @access  Private
 */
export const runCode = async (req, res) => {
  try {
    const { problemId, code, language, customInput } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ message: 'Source code cannot be empty' });
    }

    const problem = problemId ? await JudgeProblem.findById(problemId) : null;
    const driver = problem?.driverCode?.[language] || '';
    const executableCode = assembleExecutableCode(code, driver, language);

    // Case 1: Run against user's custom testcase input
    if (typeof customInput === 'string' && customInput.trim()) {
      const execResult = await executeCode(executableCode, language, sanitizeInput(customInput), 3000);

      return res.json({
        success: true,
        isCustom: true,
        status: execResult.status,
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        compile_output: execResult.compile_output,
        timeMs: execResult.timeMs,
        memoryKb: execResult.memoryKb,
      });
    }

    // Case 2: Run against problem's visible sample testcases
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const testcases = problem.visibleTestcases || [];
    if (testcases.length === 0) {
      return res.status(400).json({ message: 'No sample testcases defined for this problem' });
    }

    const results = [];
    let allPassed = true;
    let maxTime = 0;
    let maxMemory = 0;

    for (let i = 0; i < testcases.length; i++) {
      const tc = testcases[i];
      const execResult = await executeCode(executableCode, language, sanitizeInput(tc.input), problem.timeLimitMs || 2000);

      maxTime = Math.max(maxTime, execResult.timeMs);
      maxMemory = Math.max(maxMemory, execResult.memoryKb);

      if (execResult.isError) {
        results.push({
          testcaseIndex: i + 1,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: execResult.stdout || execResult.stderr,
          status: execResult.status,
          passed: false,
          error: execResult.stderr || execResult.compile_output,
          timeMs: execResult.timeMs,
          memoryKb: execResult.memoryKb,
        });
        allPassed = false;
        break; // Stop on compilation or runtime error
      }

      const actualNorm = normalizeOutput(execResult.stdout);
      const expectedNorm = normalizeOutput(tc.expectedOutput);
      const passed = actualNorm === expectedNorm;

      results.push({
        testcaseIndex: i + 1,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: execResult.stdout,
        status: passed ? 'AC' : 'WA',
        passed,
        timeMs: execResult.timeMs,
        memoryKb: execResult.memoryKb,
      });

      if (!passed) {
        allPassed = false;
      }
    }

    res.json({
      success: true,
      isCustom: false,
      allPassed,
      results,
      timeMs: maxTime,
      memoryKb: maxMemory,
    });
  } catch (error) {
    console.error('judge runCode error:', error);
    res.status(500).json({ message: error.message || 'Execution failed' });
  }
};

/**
 * @desc    Submit code for official evaluation against ALL testcases
 * @route   POST /api/judge/submit
 * @access  Private
 */
export const submitCode = async (req, res) => {
  try {
    const { problemId, code, language } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ message: 'Source code cannot be empty' });
    }

    const problem = await JudgeProblem.findById(problemId).select('+hiddenTestcases');
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const visibleCases = problem.visibleTestcases || [];
    const hiddenCases = problem.hiddenTestcases || [];
    const allTestcases = [...visibleCases, ...hiddenCases];

    if (allTestcases.length === 0) {
      return res.status(400).json({ message: 'No testcases available for evaluation' });
    }

    let overallStatus = 'AC';
    let failedDetails = null;
    let maxTime = 0;
    let maxMemory = 0;
    let passedCount = 0;
    let compileOutput = '';
    let runtimeError = '';

    const driver = problem?.driverCode?.[language] || '';
    const executableCode = assembleExecutableCode(code, driver, language);

    for (let i = 0; i < allTestcases.length; i++) {
      const tc = allTestcases[i];
      const isVisible = i < visibleCases.length;

      const execResult = await executeCode(executableCode, language, sanitizeInput(tc.input), problem.timeLimitMs || 2000);

      maxTime = Math.max(maxTime, execResult.timeMs);
      maxMemory = Math.max(maxMemory, execResult.memoryKb);

      if (execResult.isError) {
        overallStatus = execResult.status;
        compileOutput = execResult.compile_output;
        runtimeError = execResult.stderr;

        failedDetails = {
          testcaseIndex: i + 1,
          isHidden: !isVisible,
          actualOutput: execResult.stderr || execResult.compile_output,
          ...(isVisible && { input: tc.input, expectedOutput: tc.expectedOutput }),
        };
        break;
      }

      const actualNorm = normalizeOutput(execResult.stdout);
      const expectedNorm = normalizeOutput(tc.expectedOutput);

      if (actualNorm !== expectedNorm) {
        overallStatus = 'WA';
        failedDetails = {
          testcaseIndex: i + 1,
          isHidden: !isVisible,
          actualOutput: execResult.stdout,
          ...(isVisible && { input: tc.input, expectedOutput: tc.expectedOutput }),
        };
        break;
      }

      passedCount++;
    }

    // Record submission in Cosmos DB
    const submission = await Submission.create({
      user: req.user._id,
      problem: problem._id,
      code,
      language,
      status: overallStatus,
      runtimeMs: maxTime,
      memoryKb: maxMemory,
      passedTestcases: passedCount,
      totalTestcases: allTestcases.length,
      failedTestcase: failedDetails || {},
      compileOutput,
      runtimeError,
    });

    // Increment submission counts on problem
    await JudgeProblem.findByIdAndUpdate(problem._id, {
      $inc: {
        totalSubmissions: 1,
        acceptedSubmissions: overallStatus === 'AC' ? 1 : 0,
      },
    });

    // Calculate percentiles if Accepted
    let beatsRuntimePercent = 0;
    let beatsMemoryPercent = 0;

    if (overallStatus === 'AC') {
      const otherSubmissions = await Submission.find({
        problem: problem._id,
        status: 'AC',
        language,
      }).select('runtimeMs memoryKb');

      if (otherSubmissions.length > 1) {
        const slowerCount = otherSubmissions.filter((s) => s.runtimeMs >= maxTime).length;
        beatsRuntimePercent = Number(((slowerCount / otherSubmissions.length) * 100).toFixed(1));

        const moreMemoryCount = otherSubmissions.filter((s) => s.memoryKb >= maxMemory).length;
        beatsMemoryPercent = Number(((moreMemoryCount / otherSubmissions.length) * 100).toFixed(1));
      } else {
        beatsRuntimePercent = 100.0;
        beatsMemoryPercent = 100.0;
      }
    }

    res.json({
      success: true,
      submissionId: submission._id,
      status: overallStatus,
      runtimeMs: maxTime,
      memoryKb: maxMemory,
      passedTestcases: passedCount,
      totalTestcases: allTestcases.length,
      failedTestcase: failedDetails,
      compileOutput,
      runtimeError,
      beatsRuntimePercent,
      beatsMemoryPercent,
      createdAt: submission.createdAt,
    });
  } catch (error) {
    console.error('judge submitCode error:', error);
    res.status(500).json({ message: error.message || 'Submission evaluation failed' });
  }
};

/**
 * @desc    Get submission history for current user on a problem
 * @route   GET /api/judge/submissions/:problemId
 * @access  Private
 */
export const getMySubmissions = async (req, res) => {
  try {
    const { problemId } = req.params;

    const submissions = await Submission.find({
      user: req.user._id,
      problem: problemId,
    })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error('getMySubmissions error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch submissions' });
  }
};

/**
 * @desc    Get aggregate runtime and memory histogram distribution for "Beats X%" charts
 * @route   GET /api/judge/stats/:problemId
 * @access  Public
 */
export const getProblemStats = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { language = 'python' } = req.query;

    const submissions = await Submission.find({
      problem: problemId,
      status: 'AC',
      language,
    }).select('runtimeMs memoryKb');

    const total = submissions.length;

    // Minimum 10 submissions required for meaningful distribution graph
    if (total < 10) {
      return res.json({
        success: true,
        hasEnoughData: false,
        totalACSubmissions: total,
        message: 'Minimum 10 submissions required for distribution chart',
      });
    }

    const runtimes = submissions.map((s) => s.runtimeMs).sort((a, b) => a - b);
    const minRuntime = runtimes[0];
    const maxRuntime = runtimes[runtimes.length - 1];

    // Build 10 histogram buckets for runtime
    const bucketCount = 10;
    const step = Math.max(1, Math.ceil((maxRuntime - minRuntime) / bucketCount));
    const runtimeDistribution = [];

    for (let b = 0; b < bucketCount; b++) {
      const bucketMin = minRuntime + b * step;
      const bucketMax = bucketMin + step;
      const count = runtimes.filter((r) => r >= bucketMin && (b === bucketCount - 1 ? r <= bucketMax : r < bucketMax)).length;

      runtimeDistribution.push({
        label: `${bucketMin}ms`,
        min: bucketMin,
        max: bucketMax,
        count,
        percentage: Number(((count / total) * 100).toFixed(1)),
      });
    }

    res.json({
      success: true,
      hasEnoughData: true,
      totalACSubmissions: total,
      minRuntime,
      maxRuntime,
      runtimeDistribution,
    });
  } catch (error) {
    console.error('getProblemStats error:', error);
    res.status(500).json({ message: error.message || 'Failed to calculate stats' });
  }
};
