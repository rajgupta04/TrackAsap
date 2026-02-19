import SheetBucket from '../models/SheetBucket.model.js';
import SheetProblem from '../models/SheetProblem.model.js';
import Sheet from '../models/Sheet.model.js';

// Get all available buckets
export const getBuckets = async (req, res) => {
  try {
    const buckets = await SheetBucket.find({ isActive: true })
      .select('name description category icon color totalProblems difficultyBreakdown topics popularity')
      .sort({ popularity: -1, name: 1 });

    res.json(buckets);
  } catch (error) {
    console.error('Get buckets error:', error);
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
    console.error('Get bucket error:', error);
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

    // Get existing problem titles to avoid duplicates
    const existingProblems = await SheetProblem.find({ sheet: sheetId });
    const existingTitles = new Set(existingProblems.map(p => p.title.toLowerCase()));

    // Filter out duplicates and prepare problems for insertion
    const newProblems = bucket.problems
      .filter(p => !existingTitles.has(p.title.toLowerCase()))
      .map((problem, index) => ({
        user: userId,
        sheet: sheetId,
        title: problem.title,
        topic: problem.topic,
        difficulty: problem.difficulty,
        problemLink: problem.problemLink,
        articleLink: problem.articleLink,
        youtubeLink: problem.youtubeLink,
        platform: problem.platform,
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
    console.error('Import bucket error:', error);
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
      category: bucket.category,
      color: bucket.color,
      totalProblems: bucket.totalProblems,
      solvedProblems: 0,
      topics: bucket.topics.map(topic => ({
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
      platform: problem.platform,
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
    console.error('Create sheet from bucket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Create or update bucket
export const upsertBucket = async (req, res) => {
  try {
    const { name, description, category, icon, color, problems } = req.body;

    const bucket = await SheetBucket.findOneAndUpdate(
      { name },
      {
        name,
        description,
        category,
        icon,
        color,
        problems,
      },
      { upsert: true, new: true }
    );

    res.json(bucket);
  } catch (error) {
    console.error('Upsert bucket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to update sheet totals
async function updateSheetTotals(sheetId) {
  const stats = await SheetProblem.aggregate([
    { $match: { sheet: sheetId } },
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
