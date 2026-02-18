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

// Update stats before saving
sheetBucketSchema.pre('save', function (next) {
  this.totalProblems = this.problems.length;
  
  // Calculate difficulty breakdown
  this.difficultyBreakdown = {
    easy: this.problems.filter(p => p.difficulty === 'easy').length,
    medium: this.problems.filter(p => p.difficulty === 'medium').length,
    hard: this.problems.filter(p => p.difficulty === 'hard').length,
  };
  
  // Extract unique topics
  this.topics = [...new Set(this.problems.map(p => p.topic))];
  
  next();
});

const SheetBucket = mongoose.model('SheetBucket', sheetBucketSchema);

export default SheetBucket;
