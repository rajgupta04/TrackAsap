import mongoose from 'mongoose';

const clickEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userEmail: {
      type: String,
      index: true,
      default: 'anonymous',
    },
    userName: {
      type: String,
      default: 'Guest',
    },
    sessionId: {
      type: String,
      index: true,
    },
    eventType: {
      type: String,
      enum: ['click', 'pageview', 'navigation', 'interaction', 'search', 'code_run', 'modal_open', 'custom'],
      default: 'click',
      index: true,
    },
    element: {
      tag: String,
      id: String,
      className: String,
      text: String,
      role: String,
      ariaLabel: String,
      targetHref: String,
    },
    page: {
      pathname: { type: String, index: true },
      search: String,
      title: String,
      referrer: String,
    },
    coordinates: {
      x: Number,
      y: Number,
      screenWidth: Number,
      screenHeight: Number,
    },
    ip: {
      type: String,
      index: true,
    },
    userAgent: String,
    device: {
      type: String,
      default: 'Desktop',
    },
    browser: {
      type: String,
      default: 'Unknown',
    },
    os: {
      type: String,
      default: 'Unknown',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 2592000, // Auto-cleanup events older than 30 days
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound indexes for fast admin timeline and aggregation queries
clickEventSchema.index({ timestamp: -1 });
clickEventSchema.index({ userEmail: 1, timestamp: -1 });
clickEventSchema.index({ ip: 1, timestamp: -1 });
clickEventSchema.index({ 'page.pathname': 1, eventType: 1 });

const ClickEvent = mongoose.model('ClickEvent', clickEventSchema);
export default ClickEvent;
