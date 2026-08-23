import mongoose from 'mongoose';

const taskItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    time: { type: String, default: '' }, // e.g. "09:00 - 10:30"
    duration: { type: Number, default: 45 }, // in minutes
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['study', 'break', 'meal', 'nap', 'beverage', 'warmup', 'cooldown', 'other'],
      default: 'study',
    },
    icon: { type: String, default: '📝' },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    linkedSheetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sheet' },
    linkedSheetName: { type: String },
    monitorTopic: { type: String },
  },
  { _id: false }
);

const dailyPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    mode: {
      type: String,
      enum: ['chill', 'grind', 'allin'],
      default: 'grind',
    },
    totalHours: {
      type: Number,
      required: true,
      min: 0.5,
      max: 24,
    },
    subjects: [
      {
        name: { type: String, required: true },
        type: { type: String, enum: ['revision', 'new', 'practice'], default: 'revision' },
        linkedSheetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sheet' },
        linkedSheetName: { type: String },
      },
    ],
    meals: { type: Number, default: 1 },
    breaks: { type: Number, default: 2 },
    powerNap: { type: Boolean, default: false },
    beverage: {
      type: String,
      enum: ['coffee', 'chai', 'water', 'none'],
      default: 'chai',
    },

    // Active Chosen Plan
    plan: {
      title: { type: String, default: 'My Study Plan' },
      tasks: [taskItemSchema],
    },

    // Alternative AI plan option (for history/reference)
    altPlan: {
      title: { type: String },
      tasks: [taskItemSchema],
    },

    // Session Execution State
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'abandoned'],
      default: 'draft',
      index: true,
    },
    sessionStartedAt: { type: Date },
    sessionEndedAt: { type: Date },
    durationSecondsPlanned: { type: Number, default: 0 },
    durationSecondsActual: { type: Number, default: 0 },

    // Sheet Snapshots for Activity / Delta Tracking
    sheetSnapshotsStart: [
      {
        sheetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sheet' },
        sheetName: { type: String },
        totalProblems: { type: Number, default: 0 },
        solvedProblems: { type: Number, default: 0 },
        revisionCount: { type: Number, default: 0 },
        updatedAt: { type: Date },
      },
    ],
    sheetSnapshotsEnd: [
      {
        sheetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sheet' },
        sheetName: { type: String },
        totalProblems: { type: Number, default: 0 },
        solvedProblems: { type: Number, default: 0 },
        revisionCount: { type: Number, default: 0 },
        updatedAt: { type: Date },
      },
    ],

    // Final Post-Session Report
    report: {
      totalTasksCompleted: { type: Number, default: 0 },
      totalTasksPlanned: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 }, // 0 - 100
      problemsSolvedDelta: { type: Number, default: 0 },
      revisionsDelta: { type: Number, default: 0 },
      totalActivityCount: { type: Number, default: 0 },
      focusScore: { type: Number, default: 0 },
      motivationalQuote: { type: String },
      sheetsMonitored: [
        {
          sheetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sheet' },
          sheetName: { type: String },
          startSolved: { type: Number, default: 0 },
          endSolved: { type: Number, default: 0 },
          solvedDelta: { type: Number, default: 0 },
          startRevision: { type: Number, default: 0 },
          endRevision: { type: Number, default: 0 },
          revisionDelta: { type: Number, default: 0 },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

dailyPlanSchema.index({ user: 1, createdAt: -1 });

const DailyPlan = mongoose.model('DailyPlan', dailyPlanSchema);
export default DailyPlan;
