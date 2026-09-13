import app from './app.js';
import connectDB from './config/db.js';
import { initLeaderboardCron } from './cron/leaderboard.cron.js';
import { startAnalyticsCronJobs } from './analytics/cron/aggregateDaily.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Initialize Cron Jobs
initLeaderboardCron();
startAnalyticsCronJobs();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
