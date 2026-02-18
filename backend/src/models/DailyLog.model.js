import mongoose from 'mongoose';

const dailyLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    // LeetCode tracking
    leetcode: {
      contestParticipated: { type: Boolean, default: false },
      problemsSolved: { type: Number, default: 0 },
      problemDifficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'none'],
        default: 'none',
      },
    },
    // CodeChef tracking
    codechef: {
      dailyProblem: { type: Boolean, default: false },
      contestParticipated: { type: Boolean, default: false },
      problemsSolved: { type: Number, default: 0 },
    },
    // Codeforces tracking
    codeforces: {
      problemsSolved: { type: Number, default: 0 },
      contestParticipated: { type: Boolean, default: false },
      rating: { type: Number, default: null },
    },
    // Physique tracking
    gym: {
      completed: { type: Boolean, default: false },
      workoutType: {
        type: String,
        enum: ['push', 'pull', 'legs', 'cardio', 'rest', 'other', 'none'],
        default: 'none',
      },
      duration: { type: Number, default: 0 }, // in minutes
    },
    diet: {
      cleanDiet: { type: Boolean, default: false },
      calories: { type: Number, default: null },
      protein: { type: Number, default: null }, // in grams
      notes: { type: String, default: '' },
    },
    // Internship prep
    internshipPrep: {
      completed: { type: Boolean, default: false },
      hoursSpent: { type: Number, default: 0 },
      topics: [{ type: String }],
    },
    // General notes
    notes: {
      type: String,
      default: '',
    },
    // Day number in 75-day journey
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 75,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user and date (unique per user per day)
dailyLogSchema.index({ user: 1, date: 1 }, { unique: true });

// Virtual for total problems solved
dailyLogSchema.virtual('totalProblemsSolved').get(function () {
  return (
    this.leetcode.problemsSolved +
    this.codechef.problemsSolved +
    this.codeforces.problemsSolved
  );
});

// Virtual for daily completion score (0-100)
dailyLogSchema.virtual('completionScore').get(function () {
  let score = 0;
  const totalChecks = 5;

  if (this.leetcode.problemsSolved > 0 || this.leetcode.contestParticipated) score++;
  if (this.codechef.dailyProblem || this.codechef.contestParticipated) score++;
  if (this.codeforces.problemsSolved > 0 || this.codeforces.contestParticipated) score++;
  if (this.gym.completed) score++;
  if (this.diet.cleanDiet) score++;

  return Math.round((score / totalChecks) * 100);
});

dailyLogSchema.set('toJSON', { virtuals: true });
dailyLogSchema.set('toObject', { virtuals: true });

const DailyLog = mongoose.model('DailyLog', dailyLogSchema);
export default DailyLog;
