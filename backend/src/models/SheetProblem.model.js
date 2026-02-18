import mongoose from 'mongoose';

// Individual problem within a sheet (like TakeUForward's structure)
const sheetProblemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sheet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sheet',
      required: true,
    },
    // Problem details
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true,
      maxlength: 300,
    },
    // Topic/Day grouping (e.g., "Day 1", "Arrays", "Linked List")
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    // Problem number within sheet
    problemNumber: {
      type: Number,
      default: 1,
    },
    // Difficulty
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    // Links
    problemLink: {
      type: String,
      default: '',
    },
    articleLink: {
      type: String,
      default: '',
    },
    youtubeLink: {
      type: String,
      default: '',
    },
    // Status tracking
    status: {
      type: String,
      enum: ['pending', 'solved', 'revision'],
      default: 'pending',
    },
    // User's solution code
    code: {
      type: String,
      default: '',
    },
    // Programming language
    language: {
      type: String,
      enum: ['cpp', 'java', 'python', 'javascript', 'c', 'go', 'rust', 'other'],
      default: 'cpp',
    },
    // Notes
    notes: {
      type: String,
      default: '',
    },
    // Times revised
    revisionCount: {
      type: Number,
      default: 0,
    },
    // Last solved/revised date
    lastAttemptedAt: {
      type: Date,
    },
    // Order within topic
    order: {
      type: Number,
      default: 0,
    },
    // Platform (optional)
    platform: {
      type: String,
      enum: ['leetcode', 'geeksforgeeks', 'codechef', 'codeforces', 'hackerrank', 'interviewbit', 'other'],
      default: 'leetcode',
    },
    // Tags
    tags: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
sheetProblemSchema.index({ sheet: 1, topic: 1, order: 1 });
sheetProblemSchema.index({ user: 1, sheet: 1 });
sheetProblemSchema.index({ sheet: 1, status: 1 });
sheetProblemSchema.index({ sheet: 1, difficulty: 1 });

const SheetProblem = mongoose.model('SheetProblem', sheetProblemSchema);
export default SheetProblem;
