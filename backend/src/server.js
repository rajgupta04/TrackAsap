import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import chalk from 'chalk';
import connectDB from './config/db.js';
import logger from './config/logger.js';
import authRoutes from './routes/auth.routes.js';
import dailyLogRoutes from './routes/dailyLog.routes.js';
import physiqueRoutes from './routes/physique.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import problemRoutes from './routes/problem.routes.js';
import sheetRoutes from './routes/sheet.routes.js';
import sheetProblemRoutes from './routes/sheetProblem.routes.js';
import sheetBucketRoutes from './routes/sheetBucket.routes.js';
import platformStatsRoutes from './routes/platformStats.routes.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Morgan stream to Winston
const morganStream = {
  write: (message) => logger.http(message.trim()),
};

// Middleware
app.use(cors());
app.use(express.json());

// Morgan HTTP request logger
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: morganStream,
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/daily-logs', dailyLogRoutes);
app.use('/api/physique', physiqueRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/sheets', sheetRoutes);
app.use('/api/sheet-problems', sheetProblemRoutes);
app.use('/api/buckets', sheetBucketRoutes);
app.use('/api/platform-stats', platformStatsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '75-Day Tracker API is running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      dailyLogs: '/api/daily-logs',
      physique: '/api/physique',
      analytics: '/api/analytics',
      problems: '/api/problems',
      sheets: '/api/sheets',
      platformStats: '/api/platform-stats',
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

app.listen(PORT, () => {
  console.log(chalk.cyan.bold('\n' + '='.repeat(50)));
  console.log(chalk.green.bold('  🚀 TrackAsap Server Started!'));
  console.log(chalk.cyan.bold('='.repeat(50)));
  console.log(chalk.yellow(`  📡 Port: ${chalk.bold(PORT)}`));
  console.log(chalk.yellow(`  🌍 Environment: ${chalk.bold(process.env.NODE_ENV || 'development')}`));
  console.log(chalk.yellow(`  📝 Log Level: ${chalk.bold(process.env.LOG_LEVEL || 'info')}`));
  console.log(chalk.cyan.bold('='.repeat(50) + '\n'));
  logger.info(`Server running on port ${PORT}`);
});
