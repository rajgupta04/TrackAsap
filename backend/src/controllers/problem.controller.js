import Problem from '../models/Problem.model.js';
import SheetProblem from '../models/SheetProblem.model.js';
import SheetProblem from '../models/SheetProblem.model.js';
import SheetProblem from '../models/SheetProblem.model.js';
import SheetBucket from '../models/SheetBucket.model.js';
import Sheet from '../models/Sheet.model.js';

// @desc    Create a new problem
// @route   POST /api/problems
// @access  Private
export const createProblem = async (req, res) => {
  try {
    const {
      title,
      link,
      code,
      language,
      notes,
      platform,
      difficulty,
      status,
      tags,
      timeSpent,
      solvedAt,
      dailyLogDate,
      sheetId,
      sheetTopic,
    } = req.body;

    // Create problem
    const problem = await Problem.create({
      user: req.user._id,
      title,
      link,
      code,
      language: language || 'cpp',
      notes,
      platform,
      difficulty: difficulty || 'unknown',
      status: status || 'solved',
      tags: tags || [],
      timeSpent: timeSpent || 0,
      solvedAt: solvedAt || new Date(),
      sheet: sheetId || null,
      sheetTopic: sheetTopic || null,
    });


    // If associated with a sheet, update the sheet
    if (sheetId) {
      const sheet = await Sheet.findById(sheetId);
      if (sheet) {
        sheet.solvedProblems += 1;
        
        // Update topic if specified
        if (sheetTopic) {
          const topic = sheet.topics.find(t => t.name === sheetTopic);
          if (topic) {
            topic.solvedProblems += 1;
          }
        }
        await sheet.save();
      }
    }

    res.status(201).json(problem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all problems for user
// @route   GET /api/problems
// @access  Private
export const getProblems = async (req, res) => {
  try {
    const { platform, difficulty, status, sheet, tag, search, limit = 50, page = 1 } = req.query;

    const query = { user: req.user._id };

    if (platform) query.platform = platform;
    if (difficulty) query.difficulty = difficulty;
    if (status) query.status = status;
    if (sheet) query.sheet = sheet;
    if (tag) query.tags = { $in: [tag] };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { link: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [problems, total] = await Promise.all([
      Problem.find(query)
        .sort({ solvedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('sheet', 'name category'),
      Problem.countDocuments(query),
    ]);

    res.json({
      problems,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single problem
// @route   GET /api/problems/:id
// @access  Private
export const getProblem = async (req, res) => {
  try {
    const problem = await Problem.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('sheet', 'name category');

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update problem
// @route   PUT /api/problems/:id
// @access  Private
export const updateProblem = async (req, res) => {
  try {
    const problem = await Problem.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete problem
// @route   DELETE /api/problems/:id
// @access  Private
export const deleteProblem = async (req, res) => {
  try {
    const problem = await Problem.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Update sheet if associated
    if (problem.sheet) {
      const sheet = await Sheet.findById(problem.sheet);
      if (sheet && sheet.solvedProblems > 0) {
        sheet.solvedProblems -= 1;
        if (problem.sheetTopic) {
          const topic = sheet.topics.find(t => t.name === problem.sheetTopic);
          if (topic && topic.solvedProblems > 0) {
            topic.solvedProblems -= 1;
          }
        }
        await sheet.save();
      }
    }

    res.json({ message: 'Problem deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get problems by date
// @route   GET /api/problems/by-date/:date
// @access  Private
export const getProblemsByDate = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const problems = await Problem.find({
      user: req.user._id,
      solvedAt: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ solvedAt: -1 });

    res.json(problems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get problem statistics
// @route   GET /api/problems/stats
// @access  Private
export const getProblemStats = async (req, res) => {
  try {
    const stats = await Problem.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          easy: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] },
          },
          medium: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] },
          },
          hard: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] },
          },
          leetcode: {
            $sum: { $cond: [{ $eq: ['$platform', 'leetcode'] }, 1, 0] },
          },
          codechef: {
            $sum: { $cond: [{ $eq: ['$platform', 'codechef'] }, 1, 0] },
          },
          codeforces: {
            $sum: { $cond: [{ $eq: ['$platform', 'codeforces'] }, 1, 0] },
          },
          totalTimeSpent: { $sum: '$timeSpent' },
        },
      },
    ]);

    // Get tag distribution
    const tagStats = await Problem.aggregate([
      { $match: { user: req.user._id } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.json({
      ...stats[0],
      tagDistribution: tagStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Search all problems (Problem, SheetProblem, SheetBucket) globally
// @route   GET /api/problems/search-global
// @access  Private
export const searchGlobalProblems = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q) return res.json({ problems: [] });

    const regex = new RegExp(q, 'i');

    const [problems, sheetProblems, bucketProblems] = await Promise.all([
      Problem.find({ user: req.user._id, $or: [{ title: regex }, { link: regex }] })
        .limit(parseInt(limit))
        .lean(),
      SheetProblem.find({ user: req.user._id, $or: [{ title: regex }, { problemLink: regex }] })
        .limit(parseInt(limit))
        .lean(),
      SheetBucket.aggregate([
        { $unwind: "$problems" },
        { 
          $match: { 
            $or: [
              { "problems.title": regex },
              { "problems.problemLink": regex }
            ]
          } 
        },
        { $limit: parseInt(limit) }
      ])
    ]);

    // Normalize and merge unique problems by link OR title (case insensitive)
    const uniqueMap = new Map();
    const uniqueTitleMap = new Set();
    
    const addProblem = (p) => {
      const link = p.link || p.problemLink;
      const titleLower = p.title?.toLowerCase() || '';

      if ((link && uniqueMap.has(link)) || uniqueTitleMap.has(titleLower)) {
        return null; // Skip duplicate
      }
      
      const normalizedProblem = {
        _id: p._id || p.title,
        title: p.title,
        link: link || '',
        difficulty: p.difficulty,
        platform: p.platform,
        tags: p.tags,
        sourceModel: p.sourceModel
      };

      if (link) uniqueMap.set(link, normalizedProblem);
      if (titleLower) uniqueTitleMap.add(titleLower);

      return normalizedProblem;
    };

    const finalProblems = [];

    problems.forEach(p => {
      p.sourceModel = 'Problem';
      const added = addProblem(p);
      if (added) finalProblems.push(added);
    });

    sheetProblems.forEach(sp => {
      sp.sourceModel = 'SheetProblem';
      const added = addProblem(sp);
      if (added) finalProblems.push(added);
    });

    bucketProblems.forEach(bp => {
      bp.problems.sourceModel = 'SheetBucket';
      const added = addProblem(bp.problems);
      if (added) finalProblems.push(added);
    });

    res.json({ problems: finalProblems.slice(0, parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
