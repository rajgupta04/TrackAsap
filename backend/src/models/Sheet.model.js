import mongoose from 'mongoose';

// Topic schema for individual topics in a sheet
const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  totalProblems: {
    type: Number,
    default: 0,
  },
  solvedProblems: {
    type: Number,
    default: 0,
  },
  order: {
    type: Number,
    default: 0,
  },
  // Sub-topics for more granular organization
  subTopics: [{
    name: String,
    totalProblems: { type: Number, default: 0 },
    solvedProblems: { type: Number, default: 0 },
  }],
});

const sheetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Sheet name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
    },
    // Category of the sheet
    category: {
      type: String,
      enum: ['dsa', 'cp', 'os', 'cn', 'oops', 'dev', 'system-design', 'custom'],
      required: true,
    },
    // Color theme for the sheet
    color: {
      type: String,
      default: '#39FF14',
    },
    icon: {
      type: String,
      default: 'code',
    },
    // Topics in this sheet
    topics: [topicSchema],
    // Overall progress
    totalProblems: {
      type: Number,
      default: 0,
    },
    solvedProblems: {
      type: Number,
      default: 0,
    },
    // Is this a public template or custom
    isTemplate: {
      type: Boolean,
      default: false,
    },
    // Active status
    isActive: {
      type: Boolean,
      default: true,
    },
    // Target completion date
    targetDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for completion percentage
sheetSchema.virtual('completionPercentage').get(function () {
  if (this.totalProblems === 0) return 0;
  return Math.round((this.solvedProblems / this.totalProblems) * 100);
});

sheetSchema.set('toJSON', { virtuals: true });
sheetSchema.set('toObject', { virtuals: true });

// Index
sheetSchema.index({ user: 1, category: 1 });

const Sheet = mongoose.model('Sheet', sheetSchema);
export default Sheet;
