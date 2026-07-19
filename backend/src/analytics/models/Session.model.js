import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    duration: {
      type: Number, // In seconds
      default: 0,
    },
    pagesVisited: {
      type: [String],
      default: [],
    },
    featureUsage: {
      type: Map,
      of: Number,
      default: {},
    },
    browser: String,
    os: String,
    device: String,
    country: String,
    city: String,
    ip: String,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Helps find the currently active session for a user
sessionSchema.index({ user: 1, isActive: 1 });

const Session = mongoose.model('Session', sessionSchema);
export default Session;
