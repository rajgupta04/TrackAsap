import User from '../models/User.model.js';
import PhysiqueLog from '../models/PhysiqueLog.model.js';
import Problem from '../models/Problem.model.js';
import SheetProblem from '../models/SheetProblem.model.js';
import TaskLog from '../models/TaskLog.model.js';
// DailyLog was removed for the Custom Task tracker update

export const getDashboardData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const physiqueLogs = await PhysiqueLog.find({ user: req.user._id }).sort({ date: 1 });

    // Calculate local problems solved
    const localProblemsCount = await Problem.countDocuments({ user: req.user._id });
    const sheetProblemsCount = await SheetProblem.countDocuments({ user: req.user._id, status: 'Solved' });
    const totalLocalProblems = localProblemsCount + sheetProblemsCount;

    // Calculate weekly completion (active days out of last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Find distinct dates in the last 7 days where the user completed at least one task
    const activeDays = await TaskLog.distinct('date', {
      user: req.user._id,
      completed: true,
      date: { $gte: sevenDaysAgo }
    });
    const weeklyCompletion = Math.round((activeDays.length / 7) * 100);

    const totals = {
      leetcodeProblems: 0,
      codechefProblems: 0,
      codeforcesProblems: 0,
      totalProblems: totalLocalProblems,
      contestsParticipated: 0,
      gymDays: 0,
      cleanDietDays: 0,
      daysLogged: activeDays.length,
    };

    const startDate = new Date(user.startDate);
    const today = new Date();
    const currentDay = Math.min(75, Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1);

    const weightProgress = {
      start: physiqueLogs[0]?.weight || null,
      current: physiqueLogs[physiqueLogs.length - 1]?.weight || null,
      target: user.targetWeight,
      change: physiqueLogs.length >= 2
        ? Math.round((physiqueLogs[physiqueLogs.length - 1].weight - physiqueLogs[0].weight) * 10) / 10
        : 0,
    };

    res.json({
      user: {
        name: user.name,
        startDate: user.startDate,
        currentDay,
        daysRemaining: Math.max(0, 75 - currentDay),
      },
      totals,
      weeklyCompletion,
      dietCompliance: 0,
      gymCompliance: 0,
      weightProgress,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProblemsTrend = async (req, res) => { res.json([]); };
export const getPlatformDistribution = async (req, res) => { res.json([]); };
export const getDifficultyBreakdown = async (req, res) => { res.json([]); };
export const getHeatmapData = async (req, res) => { res.json([]); };
export const getCodeforcesRating = async (req, res) => { res.json([]); };

export const getWeightProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const physiqueLogs = await PhysiqueLog.find({ user: req.user._id })
      .sort({ date: 1 })
      .select('date weight weekNumber');

    const weightData = physiqueLogs.map((log) => ({
      date: log.date,
      weight: log.weight,
      weekNumber: log.weekNumber,
      target: user.targetWeight,
    }));

    res.json(weightData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
