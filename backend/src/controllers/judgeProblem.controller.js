import mongoose from 'mongoose';
import JudgeProblem from '../models/JudgeProblem.model.js';
import Submission from '../models/Submission.model.js';

// Helper to generate URL-safe slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * @desc    Get all published judge problems (for Problem Arena)
 * @route   GET /api/judge-problems
 * @access  Public
 */
export const getProblems = async (req, res) => {
  try {
    const { difficulty, tag, search, page = 1, limit = 50 } = req.query;

    const query = { status: 'published' };

    if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      query.difficulty = difficulty;
    }

    if (tag) {
      query.tags = tag;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [problems, total] = await Promise.all([
      JudgeProblem.find(query)
        .select('title slug difficulty tags totalSubmissions acceptedSubmissions author createdAt')
        .populate('author', 'name profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      JudgeProblem.countDocuments(query),
    ]);

    // If user is authenticated, find which problems they have solved
    let userSolvedMap = {};
    if (req.user) {
      const userSubmissions = await Submission.find({
        user: req.user._id,
        status: 'AC',
      }).select('problem');

      userSubmissions.forEach((sub) => {
        userSolvedMap[sub.problem.toString()] = true;
      });
    }

    const formattedProblems = problems.map((prob) => {
      const isSolved = Boolean(userSolvedMap[prob._id.toString()]);
      const acceptanceRate =
        prob.totalSubmissions > 0
          ? ((prob.acceptedSubmissions / prob.totalSubmissions) * 100).toFixed(1)
          : '0.0';

      return {
        _id: prob._id,
        title: prob.title,
        slug: prob.slug,
        difficulty: prob.difficulty,
        tags: prob.tags,
        totalSubmissions: prob.totalSubmissions,
        acceptedSubmissions: prob.acceptedSubmissions,
        acceptanceRate,
        author: prob.author,
        isSolved,
        createdAt: prob.createdAt,
      };
    });

    res.json({
      success: true,
      data: formattedProblems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('getProblems error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch problems' });
  }
};

/**
 * @desc    Get single problem by slug (for Solving Workspace)
 * @route   GET /api/judge-problems/:slug
 * @access  Public / Protected
 */
export const getProblemBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    let query = isObjectId
      ? JudgeProblem.findOne({ $or: [{ slug }, { _id: slug }] })
      : JudgeProblem.findOne({ slug });

    // If requester is author or admin, include hidden testcases for editing/previewing
    const isPrivileged =
      req.user && (req.user.role === 'admin' || req.user.role === 'setter');

    if (isPrivileged) {
      query = query.select('+hiddenTestcases');
    }

    const problem = await query.populate('author', 'name profilePicture');

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Only author/admin can see draft or pending problems
    if (
      (problem.status === 'draft' || problem.status === 'pending') &&
      (!req.user || (req.user.role !== 'admin' && problem.author._id.toString() !== req.user._id.toString()))
    ) {
      return res.status(403).json({ message: `This problem is currently ${problem.status}` });
    }

    res.json({
      success: true,
      data: problem,
    });
  } catch (error) {
    console.error('getProblemBySlug error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch problem' });
  }
};

/**
 * @desc    Search judge problems for easy linking (Roadmaps & Buckets)
 * @route   GET /api/judge-problems/search
 * @access  Public / Protected
 */
export const searchJudgeProblems = async (req, res) => {
  try {
    const { q = '', limit = 10 } = req.query;
    const filter = {};
    
    // If not admin, only show published
    if (!req.user || req.user.role !== 'admin') {
      filter.status = 'published';
    }

    if (q.trim()) {
      filter.$or = [
        { title: { $regex: q.trim(), $options: 'i' } },
        { tags: { $regex: q.trim(), $options: 'i' } },
        { slug: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    const problems = await JudgeProblem.find(filter)
      .select('title slug difficulty tags status')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: problems,
    });
  } catch (error) {
    console.error('searchJudgeProblems error:', error);
    res.status(500).json({ message: 'Failed to search problems' });
  }
};

/**
 * @desc    Get all problems with filter, search, and pagination (Admin Only)
 * @route   GET /api/judge-problems/admin/all
 * @access  Admin
 */
export const getAllAdminProblems = async (req, res) => {
  try {
    const { status, difficulty, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { slug: regex },
        { tags: regex },
      ];
    }

    const problems = await JudgeProblem.find(query)
      .populate('author', 'name email profilePicture')
      .sort({ updatedAt: -1, createdAt: -1 });

    const total = await JudgeProblem.countDocuments(query);
    const pendingCount = await JudgeProblem.countDocuments({ status: 'pending' });
    const publishedCount = await JudgeProblem.countDocuments({ status: 'published' });
    const draftCount = await JudgeProblem.countDocuments({ status: 'draft' });

    res.json({
      success: true,
      data: problems,
      counts: {
        total,
        pending: pendingCount,
        published: publishedCount,
        draft: draftCount,
      },
    });
  } catch (error) {
    console.error('getAllAdminProblems error:', error);
    res.status(500).json({ message: 'Failed to fetch all problems' });
  }
};

/**
 * @desc    Get all pending problems (Admin Only)
 * @route   GET /api/judge-problems/admin/pending
 * @access  Admin
 */
export const getPendingProblems = async (req, res) => {
  try {
    const problems = await JudgeProblem.find({ status: 'pending' })
      .populate('author', 'name email profilePicture')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: problems,
    });
  } catch (error) {
    console.error('getPendingProblems error:', error);
    res.status(500).json({ message: 'Failed to fetch pending problems' });
  }
};

/**
 * @desc    Admin Approve or Reject Problem
 * @route   PUT /api/judge-problems/admin/review/:id
 * @access  Admin
 */
export const reviewProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminFeedback } = req.body; // status: 'published' | 'draft'

    if (!['published', 'draft'].includes(status)) {
      return res.status(400).json({ message: 'Status must be published or draft' });
    }

    const problem = await JudgeProblem.findById(id);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    problem.status = status;
    if (adminFeedback) {
      problem.adminFeedback = adminFeedback;
    }
    await problem.save();

    res.json({
      success: true,
      message: `Problem has been ${status === 'published' ? 'approved and published' : 'rejected back to draft'}.`,
      data: problem,
    });
  } catch (error) {
    console.error('reviewProblem error:', error);
    res.status(500).json({ message: 'Failed to review problem' });
  }
};

/**
 * @desc    Create new judge problem
 * @route   POST /api/judge-problems
 * @access  Setter / Admin
 */
export const createProblem = async (req, res) => {
  try {
    const {
      title,
      slug: customSlug,
      difficulty,
      description,
      constraints,
      tags,
      hints,
      editorial,
      examples,
      visibleTestcases,
      hiddenTestcases,
      starterCode,
      timeLimitMs,
      memoryLimitMb,
      status,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    let slug = customSlug ? generateSlug(customSlug) : generateSlug(title);
    
    // Check if slug exists
    const existing = await JudgeProblem.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Role-based status: non-admins cannot directly publish; publishing sends to pending
    let finalStatus = status || 'draft';
    if (req.user.role !== 'admin' && finalStatus === 'published') {
      finalStatus = 'pending';
    }

    const newProblem = await JudgeProblem.create({
      title,
      slug,
      difficulty: difficulty || 'Medium',
      description,
      constraints: constraints || [],
      tags: tags || [],
      hints: hints || [],
      editorial: editorial || '',
      examples: examples || [],
      visibleTestcases: visibleTestcases || [],
      hiddenTestcases: hiddenTestcases || [],
      starterCode: starterCode || {},
      timeLimitMs: timeLimitMs || 1000,
      memoryLimitMb: memoryLimitMb || 256,
      author: req.user._id,
      status: finalStatus,
    });

    res.status(201).json({
      success: true,
      message: finalStatus === 'pending' 
        ? 'Problem submitted for Admin approval! 🚀' 
        : 'Problem created successfully',
      data: newProblem,
    });
  } catch (error) {
    console.error('createProblem error:', error);
    res.status(500).json({ message: error.message || 'Failed to create problem' });
  }
};

/**
 * @desc    Update existing judge problem
 * @route   PUT /api/judge-problems/:id
 * @access  Setter / Admin
 */
export const updateProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await JudgeProblem.findById(id).select('+hiddenTestcases');

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Check ownership (Admin can edit all, Setter can edit own)
    if (req.user.role !== 'admin' && problem.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to edit this problem' });
    }

    const updates = { ...req.body };
    delete updates._id;
    delete updates.__v;
    delete updates.author;
    delete updates.totalSubmissions;
    delete updates.acceptedSubmissions;

    if (updates.title && !updates.slug) {
      updates.slug = generateSlug(updates.title);
    }

    // Non-admin publishing requires approval
    if (req.user.role !== 'admin' && updates.status === 'published') {
      updates.status = 'pending';
    }

    // Protect critical code fields from being wiped by incomplete payloads.
    // If the frontend sends an empty object/array (e.g. because getProblemBySlug
    // failed and fell back to partial list data), preserve the existing DB values.
    const isEmptyCodeObj = (obj) => {
      if (!obj || typeof obj !== 'object') return true;
      return Object.values(obj).every((v) => !v || (typeof v === 'string' && v.trim() === ''));
    };

    if (isEmptyCodeObj(updates.starterCode) && !isEmptyCodeObj(problem.starterCode?.toObject?.() || problem.starterCode)) {
      delete updates.starterCode;
    }
    if (isEmptyCodeObj(updates.solutions) && !isEmptyCodeObj(problem.solutions?.toObject?.() || problem.solutions)) {
      delete updates.solutions;
    }
    if (isEmptyCodeObj(updates.driverCode) && !isEmptyCodeObj(problem.driverCode?.toObject?.() || problem.driverCode)) {
      delete updates.driverCode;
    }

    // Protect hidden testcases from being replaced with empty placeholder
    if (
      Array.isArray(updates.hiddenTestcases) &&
      (updates.hiddenTestcases.length === 0 ||
        (updates.hiddenTestcases.length === 1 && !updates.hiddenTestcases[0]?.expectedOutput?.trim())) &&
      problem.hiddenTestcases?.length > 0
    ) {
      delete updates.hiddenTestcases;
    }

    Object.assign(problem, updates);
    await problem.save();

    res.json({
      success: true,
      message: updates.status === 'pending'
        ? 'Problem submitted for Admin approval! 🚀'
        : 'Problem updated successfully',
      data: problem,
    });
  } catch (error) {
    console.error('updateProblem error:', error);
    res.status(500).json({ message: error.message || 'Failed to update problem' });
  }
};

/**
 * @desc    Delete judge problem
 * @route   DELETE /api/judge-problems/:id
 * @access  Setter / Admin
 */
export const deleteProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await JudgeProblem.findById(id);

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    if (req.user.role !== 'admin' && problem.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to delete this problem' });
    }

    await JudgeProblem.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Problem deleted successfully',
    });
  } catch (error) {
    console.error('deleteProblem error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete problem' });
  }
};

/**
 * @desc    Get problems created by the logged-in setter
 * @route   GET /api/judge-problems/setter/my-problems
 * @access  Setter / Admin
 */
export const getMyAuthoredProblems = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { author: req.user._id };

    const problems = await JudgeProblem.find(query)
      .select('+hiddenTestcases')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: problems,
    });
  } catch (error) {
    console.error('getMyAuthoredProblems error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch authored problems' });
  }
};

/**
 * @desc    Upload problem diagram or example illustration to Cloudinary
 * @route   POST /api/judge-problems/upload-image
 * @access  Setter / Admin
 */
export const uploadProblemDiagram = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }

    res.json({
      success: true,
      imageUrl: req.file.path,
    });
  } catch (error) {
    console.error('uploadProblemDiagram error:', error);
    res.status(500).json({ message: error.message || 'Image upload failed' });
  }
};
