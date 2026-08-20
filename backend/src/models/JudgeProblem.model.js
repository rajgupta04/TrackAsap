import mongoose from 'mongoose';

const exampleSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
  },
  { _id: false }
);

const testcaseSchema = new mongoose.Schema(
  {
    input: { type: String, default: '' },
    expectedOutput: { type: String, required: true },
  },
  { _id: false }
);

const judgeProblemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    description: {
      type: String,
      required: [true, 'Problem description is required'],
    },
    constraints: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    hints: {
      type: [String],
      default: [],
    },
    editorial: {
      type: String,
      default: '',
    },
    examples: {
      type: [exampleSchema],
      default: [],
    },
    visibleTestcases: {
      type: [testcaseSchema],
      default: [],
    },
    hiddenTestcases: {
      type: [testcaseSchema],
      default: [],
      select: false, // Never expose hidden testcases directly to client queries
    },
    starterCode: {
      cpp: { type: String, default: '' },
      python: { type: String, default: '' },
      java: { type: String, default: '' },
      javascript: { type: String, default: '' },
    },
    solutions: {
      cpp: { type: String, default: '' },
      python: { type: String, default: '' },
      java: { type: String, default: '' },
      javascript: { type: String, default: '' },
    },
    driverCode: {
      cpp: { type: String, default: '' },
      python: { type: String, default: '' },
      java: { type: String, default: '' },
      javascript: { type: String, default: '' },
    },
    timeLimitMs: {
      type: Number,
      default: 1000,
      min: 100,
      max: 10000,
    },
    memoryLimitMb: {
      type: Number,
      default: 256,
      min: 16,
      max: 1024,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'published'],
      default: 'draft',
    },
    totalSubmissions: {
      type: Number,
      default: 0,
    },
    acceptedSubmissions: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup & filtering
judgeProblemSchema.index({ status: 1, difficulty: 1 });
judgeProblemSchema.index({ tags: 1 });
judgeProblemSchema.index({ author: 1 });

const JudgeProblem = mongoose.model('JudgeProblem', judgeProblemSchema);
export default JudgeProblem;
