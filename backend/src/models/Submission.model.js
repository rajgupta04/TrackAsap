import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JudgeProblem',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Source code is required'],
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      enum: ['cpp', 'python', 'java', 'javascript', 'c'],
    },
    status: {
      type: String,
      enum: ['AC', 'WA', 'TLE', 'MLE', 'CE', 'RE', 'PENDING'],
      required: true,
      index: true,
    },
    runtimeMs: {
      type: Number,
      default: 0,
    },
    memoryKb: {
      type: Number,
      default: 0,
    },
    passedTestcases: {
      type: Number,
      default: 0,
    },
    totalTestcases: {
      type: Number,
      default: 0,
    },
    failedTestcase: {
      testcaseIndex: { type: Number, default: 0 },
      isHidden: { type: Boolean, default: false },
      input: { type: String, default: '' },
      expectedOutput: { type: String, default: '' },
      actualOutput: { type: String, default: '' },
    },
    compileOutput: {
      type: String,
      default: '',
    },
    runtimeError: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast percentile calculation and "Beats X%" distribution graphs
submissionSchema.index({ problem: 1, status: 1, language: 1, runtimeMs: 1 });
submissionSchema.index({ user: 1, problem: 1, createdAt: -1 });

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
