import EventEmitter from 'events';
import Activity from '../models/Activity.model.js';
import Session from '../models/Session.model.js';
import RequestLog from '../models/RequestLog.model.js';
import SecurityLog from '../models/SecurityLog.model.js';
import EmailQueue from '../models/EmailQueue.model.js';

class AnalyticsQueueManager extends EventEmitter {
  constructor() {
    super();
    // In-memory queues for batching
    this.activityQueue = [];
    this.requestLogQueue = [];
    
    // Batch sizes
    this.BATCH_SIZE = 50;
    this.FLUSH_INTERVAL = 5000; // 5 seconds
    
    // Initialize background flushing
    setInterval(() => this.flushActivityQueue(), this.FLUSH_INTERVAL);
    setInterval(() => this.flushRequestLogQueue(), this.FLUSH_INTERVAL);
    
    // Setup event listeners for non-batchable or immediate actions
    this.on('trackSession', this.handleTrackSession.bind(this));
    this.on('trackSecurity', this.handleTrackSecurity.bind(this));
    this.on('queueEmail', this.handleQueueEmail.bind(this));
  }

  // --- Background Flush Methods ---

  async flushActivityQueue() {
    if (this.activityQueue.length === 0) return;
    const batch = this.activityQueue.splice(0, this.BATCH_SIZE);
    try {
      await Activity.insertMany(batch);
    } catch (error) {
      console.error('[Analytics] Failed to flush activity queue:', error);
      // In a more robust system (Redis/BullMQ), we would retry.
    }
  }

  async flushRequestLogQueue() {
    if (this.requestLogQueue.length === 0) return;
    const batch = this.requestLogQueue.splice(0, this.BATCH_SIZE);
    try {
      await RequestLog.insertMany(batch);
    } catch (error) {
      console.error('[Analytics] Failed to flush request log queue:', error);
    }
  }

  // --- Queue pushers (Non-blocking) ---

  pushActivity(activityData) {
    this.activityQueue.push(activityData);
    if (this.activityQueue.length >= this.BATCH_SIZE) {
      this.flushActivityQueue();
    }
  }

  pushRequestLog(logData) {
    this.requestLogQueue.push(logData);
    if (this.requestLogQueue.length >= this.BATCH_SIZE) {
      this.flushRequestLogQueue();
    }
  }

  // --- Immediate Async Handlers ---

  async handleTrackSession(sessionData) {
    try {
      // Find active session for user or create new
      const { user, ip, userAgent, browser, os, device, path } = sessionData;
      
      const activeSession = await Session.findOne({ user, isActive: true });
      if (activeSession) {
        // Update existing session
        const now = new Date();
        const duration = Math.floor((now - new Date(activeSession.startTime)) / 1000);
        
        const updateDoc = {
          lastActivity: now,
          duration
        };
        
        // Ensure path is tracked without duplicates
        if (path && !activeSession.pagesVisited.includes(path)) {
           updateDoc.$push = { pagesVisited: path };
        }
        
        await Session.updateOne({ _id: activeSession._id }, updateDoc);
      } else {
        // Create new session
        await Session.create({
          user,
          ip,
          browser,
          os,
          device,
          pagesVisited: path ? [path] : []
        });
      }
    } catch (error) {
      console.error('[Analytics] Failed to track session:', error);
    }
  }

  async handleTrackSecurity(securityData) {
    try {
      await SecurityLog.create(securityData);
    } catch (error) {
      console.error('[Analytics] Failed to track security event:', error);
    }
  }

  async handleQueueEmail(emailData) {
    try {
      await EmailQueue.create(emailData);
    } catch (error) {
      console.error('[Analytics] Failed to queue email:', error);
    }
  }
}

// Singleton export
export const queueManager = new AnalyticsQueueManager();
