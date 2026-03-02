import SheetBucket from '../models/SheetBucket.model.js';
import SheetProblem from '../models/SheetProblem.model.js';
import Sheet from '../models/Sheet.model.js';
import mongoose from 'mongoose';
import { buildProblemKey, inferPlatform, normalizePlatform } from '../utils/problemIdentity.js';
import logger from '../config/logger.js';

const VALID_SHEET_CATEGORIES = new Set([
  'dsa',
  'cp',
  'os',
  'cn',
  'oops',
  'dev',
  'system-design',
  'custom',
]);

function mapBucketCategoryToSheetCategory(bucketCategory = '') {
  const normalized = String(bucketCategory || '').trim().toLowerCase();
  if (VALID_SHEET_CATEGORIES.has(normalized)) {
    return normalized;
  }
  return 'dsa';
}

// Get all available buckets
export const getBuckets = async (req, res) => {
  try {
    const buckets = await SheetBucket.find({ isActive: true })
      .select('name description category icon color totalProblems difficultyBreakdown topics popularity')
      .sort({ popularity: -1, name: 1 });

    res.json(buckets);
  } catch (error) {
    logger.error('Get buckets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single bucket with all problems
export const getBucket = async (req, res) => {
  try {
    const bucket = await SheetBucket.findById(req.params.id);

    if (!bucket) {
      return res.status(404).json({ message: 'Bucket not found' });
    }

    res.json(bucket);
  } catch (error) {
    logger.error('Get bucket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Import bucket problems into user's sheet
export const importBucketToSheet = async (req, res) => {
  try {
    const { bucketId, sheetId } = req.body;
    const userId = req.user._id;

    // Verify bucket exists
    const bucket = await SheetBucket.findById(bucketId);
    if (!bucket) {
      return res.status(404).json({ message: 'Bucket not found' });
    }

    // Verify sheet exists and belongs to user
    const sheet = await Sheet.findOne({ _id: sheetId, user: userId });
    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    // Get existing problem keys to avoid duplicates
    const existingProblems = await SheetProblem.find({ sheet: sheetId });
    const existingKeys = new Set(
      existingProblems
        .map((problem) => problem.problemKey || buildProblemKey(problem))
        .filter(Boolean)
    );

    // Filter out duplicates and prepare problems for insertion
    const newProblems = bucket.problems
      .filter((problem) => {
        const problemKey = problem.problemKey || buildProblemKey(problem);
        return problemKey && !existingKeys.has(problemKey);
      })
      .map((problem, index) => ({
        user: userId,
        sheet: sheetId,
        title: problem.title,
        topic: problem.topic,
        difficulty: problem.difficulty,
        problemLink: problem.problemLink,
        articleLink: problem.articleLink,
        youtubeLink: problem.youtubeLink,
        problemKey: problem.problemKey || buildProblemKey(problem),
        platform: normalizePlatform(problem.platform || inferPlatform(problem.problemLink)),
        tags: problem.tags,
        order: existingProblems.length + index,
        status: 'pending',
      }));

    if (newProblems.length === 0) {
      return res.json({
        message: 'All problems from this bucket already exist in your sheet',
        imported: 0,
        skipped: bucket.problems.length,
      });
    }

    // Insert problems
    await SheetProblem.insertMany(newProblems);

    // Update bucket popularity
    bucket.popularity += 1;
    await bucket.save();

    // Update sheet totals
    await updateSheetTotals(sheetId);

    res.json({
      message: `Successfully imported ${newProblems.length} problems`,
      imported: newProblems.length,
      skipped: bucket.problems.length - newProblems.length,
    });
  } catch (error) {
    logger.error('Import bucket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new sheet from bucket
export const createSheetFromBucket = async (req, res) => {
  try {
    const { bucketId, sheetName } = req.body;
    const userId = req.user._id;

    // Verify bucket exists
    const bucket = await SheetBucket.findById(bucketId);
    if (!bucket) {
      return res.status(404).json({ message: 'Bucket not found' });
    }

    // Create new sheet
    const sheet = await Sheet.create({
      user: userId,
      name: sheetName || bucket.name,
      description: bucket.description,
      category: mapBucketCategoryToSheetCategory(bucket.category),
      color: bucket.color,
      totalProblems: bucket.totalProblems,
      solvedProblems: 0,
      topics: (bucket.topics || []).map(topic => ({
        name: topic,
        totalProblems: bucket.problems.filter(p => p.topic === topic).length,
        solvedProblems: 0,
      })),
    });

    // Create problems for the sheet
    const problems = bucket.problems.map((problem, index) => ({
      user: userId,
      sheet: sheet._id,
      title: problem.title,
      topic: problem.topic,
      difficulty: problem.difficulty,
      problemLink: problem.problemLink,
      articleLink: problem.articleLink,
      youtubeLink: problem.youtubeLink,
      problemKey: problem.problemKey || buildProblemKey(problem),
      platform: normalizePlatform(problem.platform || inferPlatform(problem.problemLink)),
      tags: problem.tags,
      order: index,
      status: 'pending',
    }));

    await SheetProblem.insertMany(problems);

    // Update bucket popularity
    bucket.popularity += 1;
    await bucket.save();

    res.status(201).json({
      message: 'Sheet created successfully',
      sheet,
      problemsAdded: problems.length,
    });
  } catch (error) {
    logger.error('Create sheet from bucket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Create or update bucket
export const upsertBucket = async (req, res) => {
  try {
    const { name, description, category, icon, color, problems } = req.body;

    const normalizedProblems = (problems || []).map((problem, index) => ({
      ...problem,
      order: typeof problem.order === 'number' ? problem.order : index,
      platform: normalizePlatform(problem.platform || inferPlatform(problem.problemLink)),
      problemKey: problem.problemKey || buildProblemKey(problem),
    }));

    const bucket = await SheetBucket.findOneAndUpdate(
      { name },
      {
        name,
        description,
        category,
        icon,
        color,
        problems: normalizedProblems,
      },
      { upsert: true, new: true }
    );

    res.json(bucket);
  } catch (error) {
    logger.error('Upsert bucket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to update sheet totals
async function updateSheetTotals(sheetId) {
  const sheetObjectId = new mongoose.Types.ObjectId(sheetId);

  const stats = await SheetProblem.aggregate([
    { $match: { sheet: sheetObjectId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        solved: { $sum: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] } },
      },
    },
  ]);

  const { total = 0, solved = 0 } = stats[0] || {};

  await Sheet.findByIdAndUpdate(sheetId, {
    totalProblems: total,
    solvedProblems: solved,
  });
}
