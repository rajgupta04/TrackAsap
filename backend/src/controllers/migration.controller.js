import Sheet from '../models/Sheet.model.js';
import SheetProblem from '../models/SheetProblem.model.js';
import { buildProblemKey, inferPlatform, normalizePlatform } from '../utils/problemIdentity.js';

// @desc    Migrate guest browser-stored sheets & problems into user account
// @route   POST /api/auth/migrate-guest-data
// @access  Private
export const migrateGuestData = async (req, res) => {
  try {
    const { sheets = [] } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(sheets) || sheets.length === 0) {
      return res.status(200).json({
        message: 'No guest sheets to migrate',
        migratedSheets: 0,
        sheets: [],
      });
    }

    const createdSheets = [];

    for (const gSheet of sheets) {
      if (!gSheet || !gSheet.name) continue;

      const rawProblems = Array.isArray(gSheet.problems) ? gSheet.problems : [];

      // Calculate solved and total problems
      const solvedProblemsCount = rawProblems.filter(p => p.status === 'solved').length;
      const totalProblemsCount = rawProblems.length || gSheet.totalProblems || 0;

      // Group problems by topic for topic counts
      const topicStats = {};
      rawProblems.forEach(p => {
        const topName = p.topic || 'General';
        if (!topicStats[topName]) {
          topicStats[topName] = { total: 0, solved: 0 };
        }
        topicStats[topName].total += 1;
        if (p.status === 'solved') {
          topicStats[topName].solved += 1;
        }
      });

      // Construct topics array preserving user's topic progress
      const topics = (gSheet.topics || Object.keys(topicStats).map((name, i) => ({ name, order: i }))).map(t => {
        const stats = topicStats[t.name] || { total: t.totalProblems || 0, solved: t.solvedProblems || 0 };
        return {
          name: t.name,
          description: t.description || '',
          totalProblems: stats.total,
          solvedProblems: stats.solved,
          order: t.order || 0,
        };
      });

      // Create new Sheet document
      const newSheet = await Sheet.create({
        user: userId,
        name: gSheet.name.slice(0, 100),
        description: gSheet.description || '',
        category: gSheet.category || 'dsa',
        color: gSheet.color || '#39FF14',
        icon: gSheet.icon || 'code',
        totalProblems: totalProblemsCount,
        solvedProblems: solvedProblemsCount,
        topics,
      });

      // If problems exist, insert them as SheetProblem documents
      if (rawProblems.length > 0) {
        const sheetProblemsToInsert = rawProblems.map((p, idx) => ({
          user: userId,
          sheet: newSheet._id,
          title: p.title || `Problem ${idx + 1}`,
          topic: p.topic || 'General',
          problemNumber: p.problemNumber || idx + 1,
          difficulty: ['easy', 'medium', 'hard'].includes(p.difficulty) ? p.difficulty : 'medium',
          problemLink: p.problemLink || '',
          articleLink: p.articleLink || '',
          youtubeLink: p.youtubeLink || '',
          problemKey: p.problemKey || buildProblemKey(p),
          platform: normalizePlatform(p.platform || inferPlatform(p.problemLink)),
          tags: Array.isArray(p.tags) ? p.tags : [],
          order: typeof p.order === 'number' ? p.order : idx,
          status: ['pending', 'solved', 'revision'].includes(p.status) ? p.status : 'pending',
          notes: p.notes || '',
          code: p.code || '',
          language: p.language || 'cpp',
          solutions: Array.isArray(p.solutions) ? p.solutions : [],
        }));

        await SheetProblem.insertMany(sheetProblemsToInsert);
      }

      createdSheets.push(newSheet);
    }

    res.status(201).json({
      message: `Successfully migrated ${createdSheets.length} sheet(s) to your account!`,
      migratedSheets: createdSheets.length,
      sheets: createdSheets,
    });
  } catch (error) {
    console.error('Migrate guest data error:', error);
    res.status(500).json({ message: 'Failed to migrate guest data', error: error.message });
  }
};
