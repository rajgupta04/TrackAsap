import { v4 as uuidv4 } from 'uuid';
import { AnalyticsTracker } from '../services/eventTracker.js';

/**
 * Middleware to capture API request performance and status.
 * Uses the non-blocking AnalyticsTracker SDK.
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  // Assign a unique request ID for tracing if not already present
  req.id = req.id || uuidv4();

  // Wait for the response to finish to calculate duration and status code
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Skip logging OPTIONS or static assets if any hit the API router
    if (req.method === 'OPTIONS') return;

    AnalyticsTracker.trackPerformance({
      requestId: req.id,
      user: req.user?._id || req.user,
      endpoint: req.originalUrl || req.url,
      method: req.method,
      statusCode: res.statusCode,
      responseTime: duration,
      ip: req.ip,
    });
  });

  next();
};
