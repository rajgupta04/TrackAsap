import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String, // Masked if privacy is enabled
    },
    browser: String,
    device: String,
    os: String,
  },
  { timestamps: true }
);

// Compound index for querying a user's specific events over time
activitySchema.index({ user: 1, eventName: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
