import mongoose from 'mongoose';

const roadmapProblemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'Easy', 'Medium', 'Hard'],
    default: 'medium',
  },
  url: {
    type: String,
    default: '',
  },
  xp: {
    type: Number,
    default: 10,
  },
  tags: [{
    type: String,
  }],
  blind75: {
    type: Boolean,
    default: false,
  },
  rabbit150: {
    type: Boolean,
    default: false,
  },
  running175: {
    type: Boolean,
    default: false,
  },
  judgeProblem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JudgeProblem',
  },
  judgeSlug: {
    type: String,
    default: '',
  },
});

const roadmapBossLevelSchema = new mongoose.Schema({
  id: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  xp: {
    type: Number,
    default: 100,
  },
  problems: [roadmapProblemSchema],
});

const roadmapThemeSchema = new mongoose.Schema({
  bgColor: { type: String, default: '#022c22' },
  nodeColor: { type: String, default: '#10b981' },
  accent: { type: String, default: 'emerald' },
  particleColors: { type: [String], default: ['#39FF14', '#10b981', '#059669'] },
  glowColor: { type: String, default: 'rgba(16, 185, 129, 0.4)' },
  bgOverlay: { type: String, default: 'radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.15) 0%, transparent 70%)' },
});

const roadmapWorldSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    emoji: {
      type: String,
      default: '🏰',
    },
    difficulty: {
      type: Number,
      default: 2,
    },
    estimatedTime: {
      type: String,
      default: '4-6 hours',
    },
    description: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    theme: {
      type: roadmapThemeSchema,
      default: () => ({}),
    },
    problems: [roadmapProblemSchema],
    bossLevel: {
      type: roadmapBossLevelSchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

roadmapWorldSchema.index({ order: 1, isActive: 1 });

const RoadmapWorld = mongoose.model('RoadmapWorld', roadmapWorldSchema);

export default RoadmapWorld;
