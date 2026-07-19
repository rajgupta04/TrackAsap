import mongoose from 'mongoose';

const analyticsDailySchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD format
      required: true,
      unique: true,
      index: true,
    },
    dailyActiveUsers: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 },
    completedProblems: { type: Number, default: 0 },
    revisions: { type: Number, default: 0 },
    sessions: { type: Number, default: 0 },
    avgSessionTime: { type: Number, default: 0 }, // in seconds
    goalCompletion: { type: Number, default: 0 },
    featureUsage: {
      type: Map,
      of: Number,
      default: {},
    },
    lastAggregatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const AnalyticsDaily = mongoose.model('AnalyticsDaily', analyticsDailySchema);
export default AnalyticsDaily;
