import User from '../models/User.model.js';
import Problem from '../models/Problem.model.js';
import TaskLog from '../models/TaskLog.model.js';
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
      // We will reuse the same logic we implemented for the frontend streak
      // For performance in a cron, it's better to fetch and compute locally
      const completedLogs = await TaskLog.find({
        user: user._id,
        completed: true,
      }).sort({ date: -1 }).select('date');

      let currentStreak = 0;
      if (completedLogs.length > 0) {
        const uniqueDates = [...new Set(completedLogs.map(log => {
          const d = new Date(log.date);
          return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        }))];

        uniqueDates.sort((a, b) => new Date(b) - new Date(a));
        const today = new Date();
        const todayStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;
        const yesterday = new Date(today);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const yesterdayStr = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterday.getUTCDate()).padStart(2, '0')}`;

        if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
          let currentDate = new Date(uniqueDates[0]);
          let consecutiveDays = [uniqueDates[0]];

          for (let i = 1; i < uniqueDates.length; i++) {
            const expectedPrev = new Date(currentDate);
            expectedPrev.setUTCDate(expectedPrev.getUTCDate() - 1);
            const expectedPrevStr = `${expectedPrev.getUTCFullYear()}-${String(expectedPrev.getUTCMonth() + 1).padStart(2, '0')}-${String(expectedPrev.getUTCDate()).padStart(2, '0')}`;

            if (uniqueDates[i] === expectedPrevStr) {
              consecutiveDays.push(uniqueDates[i]);
              currentDate = expectedPrev;
            } else {
              break;
            }
          }

          // Streak multiplier reward
          currentStreak = completedLogs.filter(log => {
            const d = new Date(log.date);
            const logDateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
            return consecutiveDays.includes(logDateStr);
          }).length;
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
