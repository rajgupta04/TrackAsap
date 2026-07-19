import { queueManager } from '../queues/queueManager.js';
import User from '../../models/User.model.js';

/**
 * Event Tracking SDK
 * Provides non-blocking methods for tracking user behavior, performance, and security.
 */

export const AnalyticsTracker = {
  /**
   * Track a core business event (e.g. PROBLEM_COMPLETED)
   */
  async trackEvent(eventName, params = {}) {
    try {
      const { user, sessionId, metadata, req } = params;

      const activityData = {
        eventName,
        user: user._id || user,
        sessionId,
        metadata: metadata || {},
      };

      if (req) {
        // Only extract basic non-sensitive request data
        activityData.ip = req.ip;
        activityData.browser = req.useragent?.browser;
        activityData.os = req.useragent?.os;
        activityData.device = req.useragent?.isMobile ? 'Mobile' : 'Desktop';
      }

      // Fire and forget via Queue
      queueManager.pushActivity(activityData);
    } catch (err) {
      console.error('[AnalyticsTracker] Error tracking event:', err);
    }
  },

  /**
   * Track or update a user's session
   */
  async trackSession(params = {}) {
    try {
      const { user, req } = params;

      const sessionData = {
        user: user._id || user,
        ip: req?.ip,
        browser: req?.useragent?.browser,
        os: req?.useragent?.os,
        device: req?.useragent?.isMobile ? 'Mobile' : 'Desktop',
        path: req?.path,
      };

      queueManager.emit('trackSession', sessionData);
    } catch (err) {
      console.error('[AnalyticsTracker] Error tracking session:', err);
    }
  },

  /**
   * Track API performance metrics (Lightweight request logging)
   */
  async trackPerformance(logData) {
    try {
      queueManager.pushRequestLog(logData);
    } catch (err) {
      console.error('[AnalyticsTracker] Error tracking performance:', err);
    }
  },

  /**
   * Track a security event (e.g. FAILED_LOGIN, SUSPICIOUS_LOGIN)
   * These are mandatory and ignore analytics opt-out for platform integrity.
   */
  trackSecurity(eventName, params = {}) {
    try {
      const { user, req, details } = params;
      
      const securityData = {
        event: eventName,
        user: user?._id || user,
        details: details || {},
      };

      if (req) {
        securityData.ip = req.ip;
        securityData.userAgent = req.get('User-Agent');
      }

      queueManager.emit('trackSecurity', securityData);
    } catch (err) {
      console.error('[AnalyticsTracker] Error tracking security:', err);
    }
  },

  /**
   * Queue an email for background processing
   */
  queueEmail(type, recipientId, data = {}) {
    try {
      queueManager.emit('queueEmail', {
        type,
        recipient: recipientId,
        data,
      });
    } catch (err) {
      console.error('[AnalyticsTracker] Error queuing email:', err);
    }
  }
};
