import Problem from '../models/Problem.model.js';

// Language mapping from LeetCode language slugs to our enum values
const LANG_MAP = {
  cpp: 'cpp',
  'c++': 'cpp',
  java: 'java',
  python: 'python',
  python3: 'python',
  javascript: 'javascript',
  typescript: 'javascript',
  c: 'c',
  go: 'go',
  golang: 'go',
  rust: 'rust',
};

function normalizeLang(lang) {
  if (!lang) return 'cpp';
  return LANG_MAP[lang.toLowerCase()] || 'other';
}

function normalizeDifficulty(diff) {
  if (!diff) return 'unknown';
  const d = diff.toLowerCase();
  if (['easy', 'medium', 'hard'].includes(d)) return d;
  return 'unknown';
}

// @desc    Submit a problem from TrackEx extension
// @route   POST /api/extension/submit
// @access  Private
export const submitFromExtension = async (req, res) => {
  try {
    const {
      title,
      slug,
      difficulty,
      tags,
      code,
      language,
      timeSpent,
      result,
      runtime,
      memory,
      attempts,
      submissionId,
      problemLink,
      notes,
    } = req.body;

    if (!title || !submissionId) {
      return res.status(400).json({ message: 'title and submissionId are required' });
    }

    const link = problemLink || `https://leetcode.com/problems/${slug}/`;

    // Check for existing submission (deduplication)
    const existing = await Problem.findOne({
      user: req.user._id,
      submissionId: String(submissionId),
    });

    if (existing) {
      // Update existing — user may have re-submitted with better solution
      existing.code = code || existing.code;
      existing.runtime = runtime || existing.runtime;
      existing.memory = memory || existing.memory;
      existing.attempts = (existing.attempts || 1) + (attempts ? attempts - 1 : 0);
      existing.timeSpent = timeSpent || existing.timeSpent;
      if (notes) existing.notes = notes;
      if (result === 'Accepted') existing.status = 'solved';
      await existing.save();

      return res.json({
        message: 'Submission updated',
        problem: existing,
        action: 'updated',
      });
    }

    // Create new problem
    const problem = await Problem.create({
      user: req.user._id,
      title,
      link,
      code: code || '',
      language: normalizeLang(language),
      platform: 'leetcode',
      difficulty: normalizeDifficulty(difficulty),
      status: result === 'Accepted' ? 'solved' : 'attempted',
      tags: Array.isArray(tags) ? tags : [],
      timeSpent: timeSpent || 0,
      solvedAt: new Date(),
      source: 'track-ex',
      runtime: runtime || '',
      memory: memory || '',
      attempts: attempts || 1,
      submissionId: String(submissionId),
      leetcodeSlug: slug || '',
      notes: notes || '',
    });


    res.status(201).json({
      message: 'Submission synced',
      problem,
      action: 'created',
    });
  } catch (error) {
    // Handle duplicate key error gracefully
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Submission already synced' });
    }
    console.error('TrackEx submit error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check extension auth status
// @route   GET /api/extension/status
// @access  Private
export const getExtensionStatus = async (req, res) => {
  res.json({
    authenticated: true,
    user: {
      name: req.user.name,
      email: req.user.email,
      _id: req.user._id,
    },
  });
};
