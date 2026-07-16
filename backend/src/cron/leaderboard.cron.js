import cron from 'node-cron';
import { leaderboardService } from '../services/leaderboard.service.js';
import LeaderboardProfile from '../models/LeaderboardProfile.model.js';

/**
 * Initializes all cron jobs related to the Leaderboard.
 */
export const initLeaderboardCron = () => {
  // 1. Update Global Scores periodically
  // Running every 15 minutes to keep leaderboards relatively fresh without overloading the DB.
  // TODO: REDIS_INTEGRATION_POINT - When Redis is used, this job can run more frequently or be 
  // replaced by real-time updates pushed directly to Redis on task completion.
  cron.schedule('*/15 * * * *', async () => {
    console.log('[CRON] Starting Leaderboard Update...');
    const startTime = Date.now();
    try {
      const results = await leaderboardService.updateAllUsers();
      console.log(`[CRON] Leaderboard Update Complete in ${Date.now() - startTime}ms. Success: ${results.success}, Failed: ${results.failed}`);
    } catch (error) {
      console.error('[CRON] Error updating leaderboards:', error);
    }
  });

  // 2. Reset Weekly Scores
  // Runs every Monday at 00:00 (Midnight)
  cron.schedule('0 0 * * 1', async () => {
    console.log('[CRON] Resetting Weekly Scores...');
    try {
      await LeaderboardProfile.updateMany({}, { $set: { weeklyScore: 0 } });
      // TODO: REDIS_INTEGRATION_POINT - Clear the weekly Redis Sorted Set here:
      // redisClient.del('leaderboard:weekly');
      console.log('[CRON] Weekly Scores Reset Successfully.');
    } catch (error) {
      console.error('[CRON] Error resetting weekly scores:', error);
    }
  });

  // 3. Reset Monthly Scores
  // Runs on the 1st of every month at 00:00 (Midnight)
  cron.schedule('0 0 1 * *', async () => {
    console.log('[CRON] Resetting Monthly Scores...');
    try {
      await LeaderboardProfile.updateMany({}, { $set: { monthlyScore: 0 } });
      // TODO: REDIS_INTEGRATION_POINT - Clear the monthly Redis Sorted Set here:
      // redisClient.del('leaderboard:monthly');
      console.log('[CRON] Monthly Scores Reset Successfully.');
    } catch (error) {
      console.error('[CRON] Error resetting monthly scores:', error);
    }
  });
};
