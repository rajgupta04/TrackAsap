import mongoose from 'mongoose';

const TranscriptMessageSchema = new mongoose.Schema({
  speaker: {
    type: String,
    enum: ['ai', 'user', 'system'],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Number,
    default: 0,
  },
  section: {
    type: String,
    default: 'general',
  },
});

const InterviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    roomName: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    mode: {
      type: String,
      enum: [
        'general_sde',
        'resume_interview',
        'jd_interview',
        'dsa_interview',
        'system_design',
        'backend_interview',
      ],
      default: 'general_sde',
    },
    status: {
      type: String,
      enum: ['created', 'active', 'completed', 'failed'],
      default: 'created',
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    targetRole: {
      type: String,
      default: 'Software Development Engineer',
    },
    targetCompany: {
      type: String,
      default: '',
    },
    initialQuestion: {
      type: String,
      default: '',
    },
    jobDescription: {
      type: String,
      default: '',
    },
    resumeText: {
      type: String,
      default: '',
    },
    durationMinutes: {
      type: Number,
      default: 20,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    transcript: [TranscriptMessageSchema],
    evaluation: {
      overallScore: { type: Number, default: 0 },
      incomplete: { type: Boolean, default: false },
      reason: { type: String, default: '' },
      categories: {
        technicalKnowledge: { type: Number, default: 0 },
        problemSolving: { type: Number, default: 0 },
        communication: { type: Number, default: 0 },
        projectDepth: { type: Number, default: 0 },
        systemDesign: { type: Number, default: 0 },
        confidence: { type: Number, default: 0 },
      },
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      incorrectAnswers: [
        {
          question: { type: String },
          candidateAnswer: { type: String },
          correctGuidance: { type: String },
        },
      ],
      areasToRevise: [{ type: String }],
      recommendedNextInterview: { type: String, default: '' },
      detailedFeedback: { type: String, default: '' },
      voiceMetrics: {
        totalSpeakingTimeSec: { type: Number, default: 0 },
        wpm: { type: Number, default: 0 },
        pauseCount: { type: Number, default: 0 },
        fillerWordCount: { type: Number, default: 0 },
        interruptionsCount: { type: Number, default: 0 },
      },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const InterviewSession = mongoose.model('InterviewSession', InterviewSessionSchema);

export default InterviewSession;
