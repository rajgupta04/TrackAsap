import mongoose from 'mongoose';

const LANG_ENUM = ['cpp', 'java', 'python', 'javascript', 'c', 'go', 'rust', 'other'];

// ── Sub-schema: one approach/solution ────────────────────────────────────────
const solutionSchema = new mongoose.Schema(
  {
    language: { type: String, enum: LANG_ENUM, default: 'cpp' },
    code: { type: String, default: '' },
    label: { type: String, default: 'Approach 1', trim: true, maxlength: 60 },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

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
    // ── Multi-language / multi-approach solutions ─────────────────────────────
    solutions: {
      type: [solutionSchema],
      default: [],
    },
    // Legacy fields – kept for backward compat & TrackEx extension writes
    code: { type: String, default: '' },
    language: { type: String, enum: LANG_ENUM, default: 'cpp' },
    // ─────────────────────────────────────────────────────────────────────────
    notes: { type: String, default: '' },
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
    tags: [{ type: String, trim: true }],
    // Time spent (in minutes)
    timeSpent: { type: Number, default: 0 },
    // Date solved
    solvedAt: { type: Date, default: Date.now },
    // Sheet reference (optional)
    sheet: { type: mongoose.Schema.Types.ObjectId, ref: 'Sheet' },
    sheetTopic: { type: String },
    // SheetProblem reference (for syncing)
    sheetProblem: { type: mongoose.Schema.Types.ObjectId, ref: 'SheetProblem' },
    // TrackEx extension fields
    source: {
      type: String,
      enum: ['manual', 'track-ex', 'github-sync'],
      default: 'manual',
    },
    runtime: { type: String, default: '' },
    memory: { type: String, default: '' },
    attempts: { type: Number, default: 1 },
    submissionId: { type: String, default: '' },
    leetcodeSlug: { type: String, default: '' },
  },
  { timestamps: true }
);

// Indexes
problemSchema.index({ user: 1, solvedAt: -1 });
problemSchema.index({ user: 1, platform: 1 });
problemSchema.index({ user: 1, tags: 1 });
problemSchema.index({ user: 1, sheet: 1 });
problemSchema.index(
  { user: 1, sheetProblem: 1 },
  { unique: true, partialFilterExpression: { sheetProblem: { $type: 'objectId' } } }
);
problemSchema.index(
  { user: 1, submissionId: 1 },
  { unique: true, partialFilterExpression: { submissionId: { $ne: '' } } }
);

const Problem = mongoose.model('Problem', problemSchema);
export default Problem;
