import cron from 'node-cron';
import Activity from '../models/Activity.model.js';
import Session from '../models/Session.model.js';
import AnalyticsDaily from '../models/AnalyticsDaily.model.js';

/**
 * Runs every day at 00:05 to aggregate the previous day's metrics
 * so we don't calculate them repeatedly on the fly.
 */
const runDailyAggregation = async () => {
  try {
    console.log('[Analytics] Running daily aggregation job...');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateString = yesterday.toISOString().split('T')[0];

    // Count Active Users
    const dailyActiveUsers = await Session.distinct('user', {
      lastActivity: { $gte: yesterday, $lt: today }
    });

    // Count Completed Problems
    const completedProblems = await Activity.countDocuments({
      eventName: 'PROBLEM_COMPLETED',
      createdAt: { $gte: yesterday, $lt: today }
    });

    // Save Aggregation
    await AnalyticsDaily.findOneAndUpdate(
      { date: dateString },
      {
        dailyActiveUsers: dailyActiveUsers.length,
        completedProblems,
        lastAggregatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log('[Analytics] Daily aggregation completed successfully.');
  } catch (error) {
    console.error('[Analytics] Error running daily aggregation:', error);
  }
};

export const startAnalyticsCronJobs = () => {
  // Run daily at 12:05 AM
  cron.schedule('5 0 * * *', runDailyAggregation);
};
