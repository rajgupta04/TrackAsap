import mongoose from 'mongoose';

const roadmapProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  completedProblems: {
    type: [String],
    default: []
  },
  completedWorlds: {
    type: [String],
    default: []
  },
  unlockedWorlds: {
    type: [String],
    default: ['arrays']
  },
  totalXP: {
    type: Number,
    default: 0
  },
  coins: {
    type: Number,
    default: 0
  },
  awardedCoinProblems: {
    type: [String],
    default: []
  },
  awardedCoinWorlds: {
    type: [String],
    default: []
  },
  questionMode: {
    type: String,
    default: 'blind75'
  },
  unlockedAudioTracks: {
    type: [String],
    default: []
  },
  problemNotes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  problemCode: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

const RoadmapProgress = mongoose.model('RoadmapProgress', roadmapProgressSchema);

export default RoadmapProgress;
