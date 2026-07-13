import mongoose from 'mongoose';

const taskLogSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomTask',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    completed: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// A task can only be logged once per day by a user
taskLogSchema.index({ task: 1, date: 1 }, { unique: true });
taskLogSchema.index({ user: 1, date: 1 }); // Useful for chart aggregation queries

const TaskLog = mongoose.model('TaskLog', taskLogSchema);
export default TaskLog;
