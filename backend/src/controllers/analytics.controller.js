import DailyLog from '../models/DailyLog.model.js';
import PhysiqueLog from '../models/PhysiqueLog.model.js';
import User from '../models/User.model.js';

// @desc    Get dashboard overview
// @route   GET /api/analytics/dashboard
// @access  Private
export const getDashboardData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const dailyLogs = await DailyLog.find({ user: req.user._id }).sort({ date: 1 });
    const physiqueLogs = await PhysiqueLog.find({ user: req.user._id }).sort({ date: 1 });

    // Calculate totals
    const totals = {
      leetcodeProblems: 0,
      codechefProblems: 0,
      codeforcesProblems: 0,
      totalProblems: 0,
      contestsParticipated: 0,
      gymDays: 0,
      cleanDietDays: 0,
      daysLogged: dailyLogs.length,
    };

    dailyLogs.forEach((log) => {
      totals.leetcodeProblems += log.leetcode.problemsSolved;
      totals.codechefProblems += log.codechef.problemsSolved;
      totals.codeforcesProblems += log.codeforces.problemsSolved;

      if (log.leetcode.contestParticipated) totals.contestsParticipated++;
      if (log.codechef.contestParticipated) totals.contestsParticipated++;
      if (log.codeforces.contestParticipated) totals.contestsParticipated++;

      if (log.gym.completed) totals.gymDays++;
      if (log.diet.cleanDiet) totals.cleanDietDays++;
    });

    totals.totalProblems =
      totals.leetcodeProblems + totals.codechefProblems + totals.codeforcesProblems;

    // Calculate current day
    const startDate = new Date(user.startDate);
    const today = new Date();
    const currentDay = Math.min(
      75,
      Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1
    );

    // Weekly completion percentage (last 7 days)
    const last7Days = dailyLogs.slice(-7);
    const weeklyCompletion =
      last7Days.length > 0
        ? Math.round(
            last7Days.reduce((sum, log) => sum + log.completionScore, 0) /
              last7Days.length
          )
        : 0;

    // Diet compliance
    const dietCompliance =
      dailyLogs.length > 0
        ? Math.round((totals.cleanDietDays / dailyLogs.length) * 100)
        : 0;

    // Gym compliance
    const gymCompliance =
      dailyLogs.length > 0
        ? Math.round((totals.gymDays / dailyLogs.length) * 100)
        : 0;

    // Weight progress
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
      dietCompliance,
      gymCompliance,
      weightProgress,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get problems over time data
// @route   GET /api/analytics/problems-trend
// @access  Private
export const getProblemsTrend = async (req, res) => {
  try {
    const dailyLogs = await DailyLog.find({ user: req.user._id })
      .sort({ date: 1 })
      .select('date leetcode codechef codeforces dayNumber');

    const trendData = dailyLogs.map((log) => ({
      date: log.date,
      dayNumber: log.dayNumber,
      leetcode: log.leetcode.problemsSolved,
      codechef: log.codechef.problemsSolved,
      codeforces: log.codeforces.problemsSolved,
      total:
        log.leetcode.problemsSolved +
        log.codechef.problemsSolved +
        log.codeforces.problemsSolved,
    }));

    // Calculate cumulative
    let cumulative = 0;
    const cumulativeData = trendData.map((d) => {
      cumulative += d.total;
      return { ...d, cumulative };
    });

    res.json(cumulativeData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get platform distribution
// @route   GET /api/analytics/platform-distribution
// @access  Private
export const getPlatformDistribution = async (req, res) => {
  try {
    const dailyLogs = await DailyLog.find({ user: req.user._id });

    const distribution = {
      leetcode: 0,
      codechef: 0,
      codeforces: 0,
    };

    dailyLogs.forEach((log) => {
      distribution.leetcode += log.leetcode.problemsSolved;
      distribution.codechef += log.codechef.problemsSolved;
      distribution.codeforces += log.codeforces.problemsSolved;
    });

    res.json([
      { platform: 'LeetCode', problems: distribution.leetcode, color: '#FFA116' },
      { platform: 'CodeChef', problems: distribution.codechef, color: '#5B4638' },
      { platform: 'Codeforces', problems: distribution.codeforces, color: '#1F8ACB' },
    ]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get difficulty breakdown
// @route   GET /api/analytics/difficulty-breakdown
// @access  Private
export const getDifficultyBreakdown = async (req, res) => {
  try {
    const dailyLogs = await DailyLog.find({ user: req.user._id });

    const breakdown = { easy: 0, medium: 0, hard: 0 };

    dailyLogs.forEach((log) => {
      if (log.leetcode.problemDifficulty === 'easy') {
        breakdown.easy += log.leetcode.problemsSolved;
      } else if (log.leetcode.problemDifficulty === 'medium') {
        breakdown.medium += log.leetcode.problemsSolved;
      } else if (log.leetcode.problemDifficulty === 'hard') {
        breakdown.hard += log.leetcode.problemsSolved;
      }
    });

    res.json([
      { difficulty: 'Easy', count: breakdown.easy, color: '#00B8A3' },
      { difficulty: 'Medium', count: breakdown.medium, color: '#FFC01E' },
      { difficulty: 'Hard', count: breakdown.hard, color: '#FF375F' },
    ]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get heatmap data
// @route   GET /api/analytics/heatmap
// @access  Private
export const getHeatmapData = async (req, res) => {
  try {
    const dailyLogs = await DailyLog.find({ user: req.user._id })
      .select('date completionScore')
      .sort({ date: 1 });

    const heatmapData = dailyLogs.map((log) => ({
      date: log.date.toISOString().split('T')[0],
      value: log.completionScore,
      level:
        log.completionScore >= 80
          ? 4
          : log.completionScore >= 60
          ? 3
          : log.completionScore >= 40
          ? 2
          : log.completionScore >= 20
          ? 1
          : 0,
    }));

    res.json(heatmapData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get codeforces rating history
// @route   GET /api/analytics/codeforces-rating
// @access  Private
export const getCodeforcesRating = async (req, res) => {
  try {
    const dailyLogs = await DailyLog.find({
      user: req.user._id,
      'codeforces.rating': { $ne: null },
    })
      .select('date codeforces.rating dayNumber')
      .sort({ date: 1 });

    const ratingData = dailyLogs.map((log) => ({
      date: log.date,
      dayNumber: log.dayNumber,
      rating: log.codeforces.rating,
    }));

    res.json(ratingData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get weight progress data
// @route   GET /api/analytics/weight-progress
// @access  Private
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
