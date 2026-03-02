import mongoose from 'mongoose';

const bucketProblemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
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
  problemKey: {
    type: String,
    default: '',
    index: true,
  },
  platform: {
    type: String,
    default: 'leetcode',
  },
  tags: [{
    type: String,
  }],
  order: {
    type: Number,
    default: 0,
  },
});

const sheetBucketSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
      enum: ['dsa', 'graph', 'dp', 'trees', 'strings', 'arrays', 'linked-list', 'stack-queue', 'binary-search', 'greedy', 'backtracking', 'bit-manipulation', 'math', 'system-design', 'other'],
    },
    icon: {
      type: String,
      default: 'BookOpen',
    },
    color: {
      type: String,
      default: '#00FF88',
    },
    problems: [bucketProblemSchema],
    totalProblems: {
      type: Number,
      default: 0,
    },
    difficultyBreakdown: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
    },
    topics: [{
      type: String,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    popularity: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

function buildBucketStats(problems = []) {
  return {
    totalProblems: problems.length,
    difficultyBreakdown: {
      easy: problems.filter((problem) => problem.difficulty === 'easy').length,
      medium: problems.filter((problem) => problem.difficulty === 'medium').length,
      hard: problems.filter((problem) => problem.difficulty === 'hard').length,
    },
    topics: [...new Set(problems.map((problem) => problem.topic).filter(Boolean))],
  };
}

// Update stats before saving
sheetBucketSchema.pre('save', function (next) {
  const stats = buildBucketStats(this.problems || []);
  this.totalProblems = stats.totalProblems;
  this.difficultyBreakdown = stats.difficultyBreakdown;
  this.topics = stats.topics;
  next();
});

// Update stats for findOneAndUpdate upserts
sheetBucketSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() || {};
  const directProblems = update.problems;
  const setProblems = update.$set?.problems;
  const problems = directProblems || setProblems;

  if (!Array.isArray(problems)) {
    return next();
  }

  const stats = buildBucketStats(problems);

  if (update.$set) {
    update.$set.totalProblems = stats.totalProblems;
    update.$set.difficultyBreakdown = stats.difficultyBreakdown;
    update.$set.topics = stats.topics;
  } else {
    update.totalProblems = stats.totalProblems;
    update.difficultyBreakdown = stats.difficultyBreakdown;
    update.topics = stats.topics;
  }

  this.setUpdate(update);
  return next();
});

const SheetBucket = mongoose.model('SheetBucket', sheetBucketSchema);

export default SheetBucket;
