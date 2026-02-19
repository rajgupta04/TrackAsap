import SheetProblem from '../models/SheetProblem.model.js';
import Sheet from '../models/Sheet.model.js';
import Problem from '../models/Problem.model.js';
import xlsx from 'xlsx';

// @desc    Get all problems for a sheet
// @route   GET /api/sheet-problems/:sheetId
// @access  Private
export const getSheetProblems = async (req, res) => {
  try {
    const { sheetId } = req.params;
    
    const problems = await SheetProblem.find({
      sheet: sheetId,
      user: req.user._id,
    }).sort({ topic: 1, order: 1 });

    // Group by topic
    const groupedProblems = problems.reduce((acc, problem) => {
      if (!acc[problem.topic]) {
        acc[problem.topic] = [];
      }
      acc[problem.topic].push(problem);
      return acc;
    }, {});

    // Calculate stats
    const stats = {
      total: problems.length,
      solved: problems.filter(p => p.status === 'solved').length,
      revision: problems.filter(p => p.status === 'revision').length,
      pending: problems.filter(p => p.status === 'pending').length,
      easy: problems.filter(p => p.difficulty === 'easy').length,
      medium: problems.filter(p => p.difficulty === 'medium').length,
      hard: problems.filter(p => p.difficulty === 'hard').length,
    };

    res.json({ problems: groupedProblems, stats, rawProblems: problems });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a single problem to sheet
// @route   POST /api/sheet-problems/:sheetId
// @access  Private
export const addSheetProblem = async (req, res) => {
  try {
    const { sheetId } = req.params;
    const { title, topic, difficulty, problemLink, articleLink, youtubeLink, platform, tags } = req.body;

    // Get max order for this topic
    const maxOrder = await SheetProblem.findOne({ sheet: sheetId, topic })
      .sort({ order: -1 })
      .select('order');

    const problemCount = await SheetProblem.countDocuments({ sheet: sheetId });

    const problem = await SheetProblem.create({
      user: req.user._id,
      sheet: sheetId,
      title,
      topic,
      difficulty: difficulty || 'medium',
      problemLink,
      articleLink,
      youtubeLink,
      platform: platform || 'leetcode',
      tags: tags || [],
      order: maxOrder ? maxOrder.order + 1 : 0,
      problemNumber: problemCount + 1,
    });

    // Update sheet totals
    await updateSheetTotals(sheetId);

    res.status(201).json(problem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update problem status (solved/revision/pending)
// @route   PATCH /api/sheet-problems/:id/status
// @access  Private
export const updateProblemStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const problem = await SheetProblem.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { 
        status,
        lastAttemptedAt: status !== 'pending' ? new Date() : undefined,
        $inc: status === 'revision' ? { revisionCount: 1 } : {},
      },
      { new: true }
    );

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Sync with Problems collection
    await syncProblemToProblemsCollection(problem, req.user._id);

    // Update sheet totals
    await updateSheetTotals(problem.sheet);

    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update problem details
// @route   PUT /api/sheet-problems/:id
// @access  Private
export const updateSheetProblem = async (req, res) => {
  try {
    const { title, topic, difficulty, problemLink, articleLink, youtubeLink, notes, code, language, platform, tags } = req.body;
    
    const problem = await SheetProblem.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title, topic, difficulty, problemLink, articleLink, youtubeLink, notes, code, language, platform, tags },
      { new: true }
    );

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Sync to Problems collection if solved/revision status
    if (problem.status === 'solved' || problem.status === 'revision') {
      await syncProblemToProblemsCollection(problem, req.user._id);
    }

    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete problem from sheet
// @route   DELETE /api/sheet-problems/:id
// @access  Private
export const deleteSheetProblem = async (req, res) => {
  try {
    const problem = await SheetProblem.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Update sheet totals
    await updateSheetTotals(problem.sheet);

    res.json({ message: 'Problem deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk import problems from Excel
// @route   POST /api/sheet-problems/:sheetId/import
// @access  Private
export const importFromExcel = async (req, res) => {
  try {
    const { sheetId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    // Get current problem count
    let problemCount = await SheetProblem.countDocuments({ sheet: sheetId });

    // Map Excel rows to problems
    const problems = data.map((row, index) => {
      // Flexible column mapping - support various column names
      const title = row.Title || row.title || row['Problem Name'] || row.Name || row.name || `Problem ${index + 1}`;
      const topic = row.Topic || row.topic || row.Day || row.day || row.Category || row.category || 'General';
      const difficulty = (row.Difficulty || row.difficulty || row.Level || row.level || 'medium').toLowerCase();
      const problemLink = row['Problem Link'] || row.problemLink || row.Link || row.link || row.URL || row.url || '';
      const articleLink = row['Article Link'] || row.articleLink || row.Article || row.article || row.Solution || row.solution || '';
      const youtubeLink = row['YouTube'] || row.youtube || row.Video || row.video || row['Video Link'] || '';
      const platform = (row.Platform || row.platform || detectPlatform(problemLink)).toLowerCase();
      const tags = row.Tags || row.tags ? String(row.Tags || row.tags).split(',').map(t => t.trim()) : [];

      return {
        user: req.user._id,
        sheet: sheetId,
        title,
        topic,
        difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
        problemLink,
        articleLink,
        youtubeLink,
        platform: ['leetcode', 'geeksforgeeks', 'codechef', 'codeforces', 'hackerrank', 'interviewbit', 'other'].includes(platform) ? platform : 'other',
        tags,
        order: index,
        problemNumber: ++problemCount,
        status: 'pending',
      };
    });

    // Insert all problems
    const inserted = await SheetProblem.insertMany(problems);

    // Update sheet totals
    await updateSheetTotals(sheetId);

    res.status(201).json({
      message: `Successfully imported ${inserted.length} problems`,
      count: inserted.length,
    });
  } catch (error) {
    console.error('Excel import error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export sheet problems to Excel
// @route   GET /api/sheet-problems/:sheetId/export
// @access  Private
export const exportToExcel = async (req, res) => {
  try {
    const { sheetId } = req.params;
    
    const problems = await SheetProblem.find({
      sheet: sheetId,
      user: req.user._id,
    }).sort({ topic: 1, order: 1 });

    const sheet = await Sheet.findById(sheetId);

    // Transform to Excel format
    const excelData = problems.map((p, index) => ({
      'S.No': index + 1,
      'Topic': p.topic,
      'Title': p.title,
      'Difficulty': p.difficulty,
      'Status': p.status,
      'Platform': p.platform,
      'Problem Link': p.problemLink,
      'Article Link': p.articleLink,
      'YouTube': p.youtubeLink,
      'Revisions': p.revisionCount,
      'Tags': p.tags.join(', '),
      'Notes': p.notes,
    }));

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(excelData);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Problems');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="${sheet?.name || 'sheet'}-problems.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get sample Excel template
// @route   GET /api/sheet-problems/template
// @access  Private
export const getExcelTemplate = async (req, res) => {
  try {
    const sampleData = [
      {
        'Topic': 'Day 1 - Arrays',
        'Title': 'Two Sum',
        'Difficulty': 'easy',
        'Platform': 'leetcode',
        'Problem Link': 'https://leetcode.com/problems/two-sum/',
        'Article Link': 'https://takeuforward.org/...',
        'YouTube': 'https://youtube.com/...',
        'Tags': 'array, hashmap',
      },
      {
        'Topic': 'Day 1 - Arrays',
        'Title': 'Best Time to Buy and Sell Stock',
        'Difficulty': 'easy',
        'Platform': 'leetcode',
        'Problem Link': 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
        'Article Link': '',
        'YouTube': '',
        'Tags': 'array, dp',
      },
      {
        'Topic': 'Day 2 - Arrays',
        'Title': '3Sum',
        'Difficulty': 'medium',
        'Platform': 'leetcode',
        'Problem Link': 'https://leetcode.com/problems/3sum/',
        'Article Link': '',
        'YouTube': '',
        'Tags': 'array, two-pointers',
      },
    ];

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(sampleData);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Template');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="sheet-template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to update sheet totals
const updateSheetTotals = async (sheetId) => {
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
};

// Helper to detect platform from URL
const detectPlatform = (url) => {
  if (!url) return 'other';
  if (url.includes('leetcode.com')) return 'leetcode';
  if (url.includes('geeksforgeeks.org')) return 'geeksforgeeks';
  if (url.includes('codechef.com')) return 'codechef';
  if (url.includes('codeforces.com')) return 'codeforces';
  if (url.includes('hackerrank.com')) return 'hackerrank';
  if (url.includes('interviewbit.com')) return 'interviewbit';
  return 'other';
};

// Helper to sync SheetProblem to Problems collection
const syncProblemToProblemsCollection = async (sheetProblem, userId) => {
  try {
    // Map SheetProblem status to Problem status
    const statusMap = {
      solved: 'solved',
      revision: 'revisit',
      pending: 'todo',
    };

    if (sheetProblem.status === 'solved' || sheetProblem.status === 'revision') {
      // Upsert: Create or update the problem in Problems collection
      await Problem.findOneAndUpdate(
        { 
          user: userId,
          sheetProblem: sheetProblem._id,
        },
        {
          user: userId,
          title: sheetProblem.title,
          link: sheetProblem.problemLink || '',
          platform: sheetProblem.platform || 'other',
          difficulty: sheetProblem.difficulty || 'unknown',
          status: statusMap[sheetProblem.status],
          tags: sheetProblem.tags || [],
          sheet: sheetProblem.sheet,
          sheetTopic: sheetProblem.topic,
          sheetProblem: sheetProblem._id,
          notes: sheetProblem.notes || '',
          code: sheetProblem.code || '',
          language: sheetProblem.language || 'cpp',
          solvedAt: sheetProblem.lastAttemptedAt || new Date(),
        },
        { upsert: true, new: true }
      );
    } else if (sheetProblem.status === 'pending') {
      // Remove from Problems collection if marked as pending
      await Problem.findOneAndDelete({
        user: userId,
        sheetProblem: sheetProblem._id,
      });
    }
  } catch (error) {
    console.error('Error syncing problem to Problems collection:', error);
    // Don't throw - this is a non-critical operation
  }
};
