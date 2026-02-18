import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Problem details
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true,
      maxlength: 200,
    },
    link: {
      type: String,
      required: [true, 'Problem link is required'],
      trim: true,
    },
    code: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      enum: ['cpp', 'java', 'python', 'javascript', 'c', 'go', 'rust', 'other'],
      default: 'cpp',
    },
    notes: {
      type: String,
      default: '',
    },
    // Platform info
    platform: {
      type: String,
      enum: ['leetcode', 'codechef', 'codeforces', 'geeksforgeeks', 'hackerrank', 'atcoder', 'other'],
      required: true,
    },
    // Difficulty
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'unknown'],
      default: 'unknown',
    },
    // Status
    status: {
      type: String,
      enum: ['solved', 'attempted', 'revisit', 'todo'],
      default: 'solved',
    },
    // Tags for categorization
    tags: [{
      type: String,
      trim: true,
    }],
    // Time spent (in minutes)
    timeSpent: {
      type: Number,
      default: 0,
    },
    // Date solved
    solvedAt: {
      type: Date,
      default: Date.now,
    },
    // Associated daily log (optional)
    dailyLog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DailyLog',
    },
    // Sheet reference (optional)
    sheet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sheet',
    },
    sheetTopic: {
      type: String,
    },
    // SheetProblem reference (for syncing)
    sheetProblem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SheetProblem',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
problemSchema.index({ user: 1, solvedAt: -1 });
problemSchema.index({ user: 1, platform: 1 });
problemSchema.index({ user: 1, tags: 1 });
problemSchema.index({ user: 1, sheet: 1 });
problemSchema.index({ user: 1, sheetProblem: 1 }, { unique: true, sparse: true });

const Problem = mongoose.model('Problem', problemSchema);
export default Problem;
