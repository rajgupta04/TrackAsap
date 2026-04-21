import DailyLog from '../models/DailyLog.model.js';
import User from '../models/User.model.js';
import Problem from '../models/Problem.model.js';

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
    const toDateKey = (value) => {
      const d = new Date(value);
      d.setHours(0, 0, 0, 0);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const isLogActive = (log) => {
      if (!log) return false;
      if (log.leetcode?.problemsSolved > 0 || log.leetcode?.contestParticipated) return true;
      if (log.codechef?.dailyProblem || log.codechef?.contestParticipated || log.codechef?.problemsSolved > 0) return true;
      if (log.codeforces?.problemsSolved > 0 || log.codeforces?.contestParticipated) return true;
      if (log.gym?.completed) return true;
      if (log.diet?.cleanDiet) return true;
      if ((log.diet?.notes || '').trim()) return true;
      if (log.internshipPrep?.completed || (log.internshipPrep?.hoursSpent || 0) > 0) return true;
      if ((log.notes || '').trim()) return true;
      return false;
    };

    const [logs, problems] = await Promise.all([
      DailyLog.find({ user: req.user._id }).sort({ date: -1 }),
      Problem.find({ user: req.user._id }).select('solvedAt code notes').sort({ solvedAt: -1 }),
    ]);

    const activeDates = new Set();

    logs.forEach((log) => {
      if (isLogActive(log)) {
        activeDates.add(toDateKey(log.date));
      }
    });

    problems.forEach((problem) => {
      const hasContent = (problem.code && problem.code.trim()) || (problem.notes && problem.notes.trim());
      if (hasContent) {
        activeDates.add(toDateKey(problem.solvedAt));
      }
    });

    if (activeDates.size === 0) {
      return res.json({
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
      });
    }

    const sortedActive = Array.from(activeDates).sort();
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    sortedActive.forEach((dateKey) => {
      const currentDate = new Date(`${dateKey}T00:00:00`);
      if (prevDate) {
        const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
        if (dayDiff === 1) {
          tempStreak += 1;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      prevDate = currentDate;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = toDateKey(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = toDateKey(yesterday);

    let currentStreak = 0;
    let checkDate = null;

    if (activeDates.has(todayKey)) {
      checkDate = today;
    } else if (activeDates.has(yesterdayKey)) {
      checkDate = yesterday;
    }

    while (checkDate) {
      const key = toDateKey(checkDate);
      if (!activeDates.has(key)) break;
      currentStreak += 1;
      checkDate = new Date(checkDate);
      checkDate.setDate(checkDate.getDate() - 1);
    }

    const lastActiveDate = sortedActive[sortedActive.length - 1] || null;

    res.json({
      currentStreak,
      longestStreak,
      lastActiveDate,
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
