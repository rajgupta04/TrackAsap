import { v4 as uuidv4 } from 'uuid';
import { AnalyticsTracker } from '../services/eventTracker.js';
import logger from '../../utils/logger.js';

/**
 * Middleware to capture API request performance and status.
 * - Logs every API call to the console via Winston (colored, human-readable)
 * - Persists analytics data via the non-blocking AnalyticsTracker SDK
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  // Assign a unique request ID for tracing if not already present
  req.id = req.id || uuidv4();

  // Wait for the response to finish to calculate duration and status code
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Skip OPTIONS preflight requests
    if (req.method === 'OPTIONS') return;

    const statusCode = res.statusCode;
    const userId     = req.user?._id?.toString() || req.user || null;
    const endpoint   = req.originalUrl || req.url;
    const method     = req.method;

    // ── Console logging (Winston) ──────────────────────────────────────
    const logMeta = {
      requestId: req.id,
      method,
      endpoint,
      statusCode,
      duration: `${duration}ms`,
      ...(userId ? { userId } : {}),
      ip: req.ip,
    };

    if (statusCode >= 500) {
      logger.error(`API ${method} ${endpoint} → ${statusCode}`, logMeta);
    } else if (statusCode >= 400) {
      logger.warn(`API ${method} ${endpoint} → ${statusCode}`, logMeta);
    } else {
      logger.debug(`API ${method} ${endpoint} → ${statusCode}`, logMeta);
    }

    // ── Persist to analytics store (non-blocking) ──────────────────────
    AnalyticsTracker.trackPerformance({
      requestId: req.id,
      user:      userId,
      endpoint,
      method,
      statusCode,
      responseTime: duration,
      ip:        req.ip,
    });
  });

  next();
};
