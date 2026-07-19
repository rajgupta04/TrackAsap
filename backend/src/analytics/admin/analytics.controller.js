import AnalyticsDaily from '../models/AnalyticsDaily.model.js';
import RequestLog from '../models/RequestLog.model.js';
import Activity from '../models/Activity.model.js';
import Session from '../models/Session.model.js';

export const getOverview = async (req, res) => {
  try {
    // Return last 7 days of historical aggregated stats
    const recentStats = await AnalyticsDaily.find().sort({ date: -1 }).limit(7);

    // Calculate today's live stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const liveActiveUsers = await Session.countDocuments({
      lastActivity: { $gte: today }
    });

    const problemsCompleted = await Activity.countDocuments({
      eventName: 'PROBLEM_COMPLETED',
      createdAt: { $gte: today }
    });

    const totalErrors = await RequestLog.countDocuments({
      statusCode: { $gte: 400 },
      createdAt: { $gte: today }
    });

    // Format date string as YYYY-MM-DD
    const dateString = today.toISOString().split('T')[0];

    const todayStats = {
      date: dateString,
      activeUsers: liveActiveUsers,
      problemsCompleted,
      totalErrors,
    };

    // If recentStats already includes today (e.g. if we ran the cron manually), replace it.
    // Otherwise, prepend todayStats.
    let combinedStats = [todayStats, ...recentStats];
    if (recentStats.length > 0 && recentStats[0].date === dateString) {
      combinedStats = [todayStats, ...recentStats.slice(1)];
    }

    res.status(200).json({
      success: true,
      data: combinedStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching analytics overview', error: error.message });
  }
};

export const getPerformanceMetrics = async (req, res) => {
  try {
    // Aggregate request logs for the past 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const globalStats = await RequestLog.aggregate([
      { $match: { createdAt: { $gte: yesterday } } },
      { $group: { _id: null, totalRequests: { $sum: 1 }, averageResponseTime: { $avg: "$responseTime" } } }
    ]);

    const slowestEndpoints = await RequestLog.aggregate([
      { $match: { createdAt: { $gte: yesterday }, responseTime: { $gt: 100 } } },
      { $group: { _id: "$endpoint", count: { $sum: 1 }, avgTime: { $avg: "$responseTime" } } },
      { $sort: { avgTime: -1 } },
      { $limit: 3 }
    ]).then(res => res.map(r => ({ endpoint: r._id, avgTime: r.avgTime })));

    res.status(200).json({
      success: true,
      data: {
        averageResponseTime: globalStats[0]?.averageResponseTime || 0,
        totalRequests: globalStats[0]?.totalRequests || 0,
        slowestEndpoints
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching performance metrics', error: error.message });
  }
};

export const getPopularFeatures = async (req, res) => {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const featureUsage = await Activity.aggregate([
      { $match: { createdAt: { $gte: yesterday } } },
      { $group: { _id: "$eventName", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: featureUsage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching feature usage', error: error.message });
  }
};

export const getActivityLogs = async (req, res) => {
  try {
    const logs = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('user', 'name email');

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching activity logs', error: error.message });
  }
};
