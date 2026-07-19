import { AnalyticsTracker } from '../services/eventTracker.js';

/**
 * Middleware to track user sessions.
 * Should be placed after authentication middleware.
 * Debounces updates to prevent massive DB writes per-request.
 */
export const sessionTracker = (req, res, next) => {
  // Only track authenticated users
  if (req.user) {
    // Non-blocking track session call
    AnalyticsTracker.trackSession({
      user: req.user,
      req
    });
  }
  next();
};
