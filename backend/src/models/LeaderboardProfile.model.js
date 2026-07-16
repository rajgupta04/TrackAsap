import mongoose from 'mongoose';

const leaderboardProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One leaderboard profile per user
    },
    college: {
      type: String,
      default: 'Unknown',
    },
    globalScore: {
      type: Number,
      default: 0,
      index: true,
    },
    weeklyScore: {
      type: Number,
      default: 0,
      index: true,
    },
    monthlyScore: {
      type: Number,
      default: 0,
      index: true,
    },
    statsBreakdown: {
      easySolved: { type: Number, default: 0 },
      mediumSolved: { type: Number, default: 0 },
      hardSolved: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      totalTasksCompleted: { type: Number, default: 0 },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficiently querying Top N globally, weekly, and by college
// TODO: REDIS_INTEGRATION_POINT - When Redis is integrated, we won't need to heavily rely on these compound indexes for sorting Top N, 
// as Redis Sorted Sets (ZREVRANGE) will handle the fast ranking and pagination.
leaderboardProfileSchema.index({ globalScore: -1 });
leaderboardProfileSchema.index({ weeklyScore: -1 });
leaderboardProfileSchema.index({ monthlyScore: -1 });
leaderboardProfileSchema.index({ college: 1, globalScore: -1 });

const LeaderboardProfile = mongoose.model('LeaderboardProfile', leaderboardProfileSchema);

export default LeaderboardProfile;
