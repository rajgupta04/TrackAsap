import mongoose from 'mongoose';

const emailQueueSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'WELCOME',
        'INACTIVE_USER',
        'WEEKLY_SUMMARY',
        'MONTHLY_SUMMARY',
        'REVISION_REMINDER',
        'CONTEST_REMINDER',
        'GOAL_REMINDER',
        'ACHIEVEMENT',
        'MILESTONE',
        'AI_RECOMMENDATION',
      ],
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    error: String,
    processedAt: Date,
  },
  { timestamps: true }
);

// Helpful for queue workers to pick up pending emails efficiently
emailQueueSchema.index({ status: 1, createdAt: 1 });

const EmailQueue = mongoose.model('EmailQueue', emailQueueSchema);
export default EmailQueue;
