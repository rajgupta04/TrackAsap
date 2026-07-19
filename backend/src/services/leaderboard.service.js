import User from '../models/User.model.js';
import Problem from '../models/Problem.model.js';
import TaskLog from '../models/TaskLog.model.js';
import SheetProblem from '../models/SheetProblem.model.js';
import LeaderboardProfile from '../models/LeaderboardProfile.model.js';

/**
 * Weighted Scoring Formula Constants
 */
const SCORING = {
  EASY: 10,
  MEDIUM: 30,
  HARD: 50,
  STREAK_BONUS: 5, // Per day of streak
  TASK_COMPLETED_XP: 1, // Base XP per task completed
};

export const leaderboardService = {
  /**
   * Calculate and update the score for a specific user.
   * This is the core ranking engine.
   * 
   * @param {string} userId - The ID of the user
   */
  updateUserScore: async (userId) => {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      // 1. Calculate Problem Solving Stats
      const problems = await Problem.aggregate([
        { $match: { user: user._id, status: 'solved' } },
        {
          $group: {
            _id: '$difficulty',
            count: { $sum: 1 },
          },
        },
      ]);

      let easy = 0, medium = 0, hard = 0;
      problems.forEach(p => {
        if (p._id === 'easy') easy = p.count;
        if (p._id === 'medium') medium = p.count;
        if (p._id === 'hard') hard = p.count;
      });

      // 2. Calculate Task Completions (XP)
      const tasksCompleted = await TaskLog.countDocuments({
        user: user._id,
        completed: true
      });

      // 3. Calculate Current Streak
      // (>= 2 tasks OR >= 1 solved problem with code+notes)
      const completedLogs = await TaskLog.find({ user: user._id });
      let currentStreak = 0;
      
      const taskCountByDate = {};
      completedLogs.forEach(log => {
        const targetDate = new Date(log.date);
        const createdDate = new Date(log.createdAt);
        const diffHours = (createdDate - targetDate) / (1000 * 60 * 60);

        if (diffHours <= 36) {
          const dateStr = targetDate.toISOString().split('T')[0];
          taskCountByDate[dateStr] = (taskCountByDate[dateStr] || 0) + 1;
        }
      });

      const sheetProblems = await SheetProblem.find({ 
        user: user._id, 
        status: 'solved',
        code: { $exists: true, $ne: '' },
        notes: { $exists: true, $ne: '' }
      }).select('lastAttemptedAt updatedAt');

      const problemDates = new Set();
      sheetProblems.forEach(p => {
        const d = new Date(p.lastAttemptedAt || p.updatedAt);
        const dateStr = d.toISOString().split('T')[0];
        problemDates.add(dateStr);
      });

      const validDates = new Set();
      
      Object.keys(taskCountByDate).forEach(dateStr => {
        if (taskCountByDate[dateStr] >= 2) validDates.add(dateStr);
      });

      problemDates.forEach(dateStr => validDates.add(dateStr));

      const sortedDates = Array.from(validDates).sort((a, b) => new Date(b) - new Date(a));

      if (sortedDates.length > 0) {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        let startIndex = sortedDates.findIndex(date => date <= tomorrowStr);

        if (startIndex !== -1) {
          const latestValidDate = sortedDates[startIndex];

          if (latestValidDate === tomorrowStr || latestValidDate === todayStr || latestValidDate === yesterdayStr) {
            currentStreak = 1;
            let currentDateStr = latestValidDate;

            for (let i = startIndex + 1; i < sortedDates.length; i++) {
              const expectedPrev = new Date(currentDateStr);
              expectedPrev.setDate(expectedPrev.getDate() - 1);
              const expectedPrevStr = expectedPrev.toISOString().split('T')[0];

              if (sortedDates[i] === expectedPrevStr) {
                currentStreak++;
                currentDateStr = expectedPrevStr;
              } else {
                break;
              }
            }
          }
        }
      }

      // 4. Calculate Final Total Score
      const baseScore = (easy * SCORING.EASY) + (medium * SCORING.MEDIUM) + (hard * SCORING.HARD);
      const xpScore = tasksCompleted * SCORING.TASK_COMPLETED_XP;
      const streakScore = currentStreak * SCORING.STREAK_BONUS;
      
      const totalScore = baseScore + xpScore + streakScore;

      // 5. Update Leaderboard Profile (Upsert)
      const lbProfile = await LeaderboardProfile.findOneAndUpdate(
        { user: user._id },
        {
          $set: {
            college: user.college || 'Unknown', // In case user model has college later
            globalScore: totalScore,
            // Weekly and Monthly logic will be handled by the cron resetting them, 
            // but we can increment them here. For a robust system, weekly/monthly 
            // scores should be calculated by only aggregating problems/tasks within that timeframe.
            // For now, we'll assign the global score if it's the first time.
            statsBreakdown: {
              easySolved: easy,
              mediumSolved: medium,
              hardSolved: hard,
              currentStreak: currentStreak,
              totalTasksCompleted: tasksCompleted,
            },
            lastUpdated: new Date()
          },
          // Initialize weekly/monthly if not exists
          $setOnInsert: {
            weeklyScore: totalScore,
            monthlyScore: totalScore
          }
        },
        { new: true, upsert: true }
      );

      // TODO: REDIS_INTEGRATION_POINT
      // When Redis is active, we push the globalScore to the global sorted set:
      // redisClient.zadd('leaderboard:global', totalScore, user._id.toString());
      // redisClient.zadd(`leaderboard:college:${user.college || 'Unknown'}`, totalScore, user._id.toString());

      return lbProfile;
    } catch (error) {
      console.error(`Error updating score for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Bulk update all users (Called by Cron Job)
   */
  updateAllUsers: async () => {
    const users = await User.find({}, '_id');
    const results = { success: 0, failed: 0 };
    
    for (const user of users) {
      try {
        await leaderboardService.updateUserScore(user._id);
        results.success++;
      } catch (e) {
        results.failed++;
      }
    }
    
    return results;
  }
};
