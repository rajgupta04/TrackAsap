import DailyLog from '../models/DailyLog.model.js';
import User from '../models/User.model.js';

// Helper: Calculate day number from start date
const calculateDayNumber = (startDate, targetDate) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffTime = target - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(75, diffDays));
};

// @desc    Create or update daily log
// @route   POST /api/daily-logs
// @access  Private
export const createOrUpdateDailyLog = async (req, res) => {
  try {
    const {
      date,
      leetcode,
      codechef,
      codeforces,
      gym,
      diet,
      internshipPrep,
      notes,
    } = req.body;

    const user = await User.findById(req.user._id);
    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0);

    const dayNumber = calculateDayNumber(user.startDate, logDate);

    // Find existing log or create new
    let dailyLog = await DailyLog.findOne({
      user: req.user._id,
      date: logDate,
    });

    if (dailyLog) {
      // Update existing
      if (leetcode) dailyLog.leetcode = { ...dailyLog.leetcode, ...leetcode };
      if (codechef) dailyLog.codechef = { ...dailyLog.codechef, ...codechef };
      if (codeforces) dailyLog.codeforces = { ...dailyLog.codeforces, ...codeforces };
      if (gym) dailyLog.gym = { ...dailyLog.gym, ...gym };
      if (diet) dailyLog.diet = { ...dailyLog.diet, ...diet };
      if (internshipPrep) dailyLog.internshipPrep = { ...dailyLog.internshipPrep, ...internshipPrep };
      if (notes !== undefined) dailyLog.notes = notes;
      dailyLog.dayNumber = dayNumber;

      await dailyLog.save();
    } else {
      // Create new
      dailyLog = await DailyLog.create({
        user: req.user._id,
        date: logDate,
        dayNumber,
        leetcode: leetcode || {},
        codechef: codechef || {},
        codeforces: codeforces || {},
        gym: gym || {},
        diet: diet || {},
        internshipPrep: internshipPrep || {},
        notes: notes || '',
      });
    }

    res.status(201).json(dailyLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get daily log by date
// @route   GET /api/daily-logs/:date
// @access  Private
export const getDailyLog = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    const dailyLog = await DailyLog.findOne({
      user: req.user._id,
      date,
    });

    if (!dailyLog) {
      // Return empty template for new day
      const user = await User.findById(req.user._id);
      const dayNumber = calculateDayNumber(user.startDate, date);
      return res.json({
        date,
        dayNumber,
        isNew: true,
        leetcode: { contestParticipated: false, problemsSolved: 0, problemDifficulty: 'none' },
        codechef: { dailyProblem: false, contestParticipated: false, problemsSolved: 0 },
        codeforces: { problemsSolved: 0, contestParticipated: false, rating: null },
        gym: { completed: false, workoutType: 'none', duration: 0 },
        diet: { cleanDiet: false, calories: null, protein: null, notes: '' },
        internshipPrep: { completed: false, hoursSpent: 0, topics: [] },
        notes: '',
      });
    }

    res.json(dailyLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all daily logs
// @route   GET /api/daily-logs
// @access  Private
export const getAllDailyLogs = async (req, res) => {
  try {
    const { startDate, endDate, limit = 75 } = req.query;

    const query = { user: req.user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const dailyLogs = await DailyLog.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json(dailyLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Calculate current streak
// @route   GET /api/daily-logs/streak
// @access  Private
export const getStreak = async (req, res) => {
  try {
    // Get all logs - need full document for virtual completionScore to work
    const logs = await DailyLog.find({ user: req.user._id })
      .sort({ date: -1 });

    if (logs.length === 0) {
      return res.json({
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
      });
    }

    // Calculate current streak (consecutive days with completionScore >= 60%)
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort logs by date ascending for streak calculation
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate longest streak - check for consecutive days
    let prevDate = null;
    for (let i = 0; i < sortedLogs.length; i++) {
      const log = sortedLogs[i];
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      
      const isActive = log.completionScore >= 60;

      if (isActive) {
        // Check if this is consecutive to previous active day
        if (prevDate) {
          const dayDiff = (logDate - prevDate) / (1000 * 60 * 60 * 24);
          if (dayDiff === 1) {
            tempStreak++;
          } else {
            tempStreak = 1; // Reset streak but count this day
          }
        } else {
          tempStreak = 1;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
        prevDate = logDate;
      } else {
        tempStreak = 0;
        prevDate = null;
      }
    }

    // Calculate current streak (from today backwards)
    const reversedLogs = [...sortedLogs].reverse();
    let checkDate = new Date(today);
    
    for (let i = 0; i < reversedLogs.length; i++) {
      const log = reversedLogs[i];
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);

      // Calculate difference in days
      const diffDays = Math.round((checkDate - logDate) / (1000 * 60 * 60 * 24));

      // Allow for today or yesterday (in case user hasn't logged today yet)
      if (i === 0 && diffDays > 1) {
        // First log is more than 1 day old, no current streak
        break;
      }

      if (diffDays === 0 || diffDays === 1) {
        if (log.completionScore >= 60) {
          currentStreak++;
          checkDate = new Date(logDate);
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      } else {
        break;
      }
    }

    res.json({
      currentStreak,
      longestStreak,
      lastActiveDate: logs[0]?.date || null,
    });
  } catch (error) {
    console.error('Streak calculation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get weekly summary
// @route   GET /api/daily-logs/weekly-summary
// @access  Private
export const getWeeklySummary = async (req, res) => {
  try {
    const { weekNumber } = req.query;
    const user = await User.findById(req.user._id);

    const startDate = new Date(user.startDate);
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const logs = await DailyLog.find({
      user: req.user._id,
      date: { $gte: weekStart, $lte: weekEnd },
    });

    // Calculate weekly stats
    const stats = {
      weekNumber: parseInt(weekNumber),
      weekStart,
      weekEnd,
      daysLogged: logs.length,
      totalProblemsSolved: 0,
      leetcodeProblems: 0,
      codechefProblems: 0,
      codeforcesProblems: 0,
      contestsParticipated: 0,
      gymDays: 0,
      cleanDietDays: 0,
      averageCompletionScore: 0,
    };

    logs.forEach((log) => {
      stats.leetcodeProblems += log.leetcode.problemsSolved;
      stats.codechefProblems += log.codechef.problemsSolved;
      stats.codeforcesProblems += log.codeforces.problemsSolved;
      stats.totalProblemsSolved +=
        log.leetcode.problemsSolved +
        log.codechef.problemsSolved +
        log.codeforces.problemsSolved;

      if (log.leetcode.contestParticipated) stats.contestsParticipated++;
      if (log.codechef.contestParticipated) stats.contestsParticipated++;
      if (log.codeforces.contestParticipated) stats.contestsParticipated++;

      if (log.gym.completed) stats.gymDays++;
      if (log.diet.cleanDiet) stats.cleanDietDays++;

      stats.averageCompletionScore += log.completionScore;
    });

    if (logs.length > 0) {
      stats.averageCompletionScore = Math.round(
        stats.averageCompletionScore / logs.length
      );
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete daily log
// @route   DELETE /api/daily-logs/:date
// @access  Private
export const deleteDailyLog = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    const result = await DailyLog.findOneAndDelete({
      user: req.user._id,
      date,
    });

    if (!result) {
      return res.status(404).json({ message: 'Log not found' });
    }

    res.json({ message: 'Log deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
