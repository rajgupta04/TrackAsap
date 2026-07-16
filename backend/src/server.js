import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import taskRoutes from './routes/task.routes.js';
import physiqueRoutes from './routes/physique.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import problemRoutes from './routes/problem.routes.js';
import sheetRoutes from './routes/sheet.routes.js';
import sheetProblemRoutes from './routes/sheetProblem.routes.js';
import sheetBucketRoutes from './routes/sheetBucket.routes.js';
import platformStatsRoutes from './routes/platformStats.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import githubRoutes from './routes/github.routes.js';
import discussionRoutes from './routes/discussion.routes.js';
import adminRoutes from './routes/admin.routes.js';
import extensionRoutes from './routes/extension.routes.js';
import { initLeaderboardCron } from './cron/leaderboard.cron.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Initialize Cron Jobs
initLeaderboardCron();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow chrome-extension:// origins for TrackEx
    if (origin.startsWith('chrome-extension://')) return callback(null, true);
    // Allow all other origins (existing behavior)
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/physique', physiqueRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/sheets', sheetRoutes);
app.use('/api/sheet-problems', sheetProblemRoutes);
app.use('/api/buckets', sheetBucketRoutes);
app.use('/api/platform-stats', platformStatsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/extension', extensionRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '75-Day Tracker API is running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      tasks: '/api/tasks',
      physique: '/api/physique',
      analytics: '/api/analytics',
      problems: '/api/problems',
      sheets: '/api/sheets',
      platformStats: '/api/platform-stats',
      github: '/api/github',
      discussions: '/api/discussions',
      admin: '/api/admin',
      extension: '/api/extension',
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '75-Day Tracker API is running' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
