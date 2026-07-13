import mongoose from 'mongoose';

const customTaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // Optional: when this task starts
    startDate: {
      type: Date,
    },
    // Optional: when this task ends (e.g., after 30 days)
    endDate: {
      type: Date,
    },
    // Optional array of days of the week [0, 1, 2, 3, 4, 5, 6] (0 = Sunday). 
    // If empty and no specificDate is set, it applies every day between start and end.
    daysOfWeek: [
      {
        type: Number,
        min: 0,
        max: 6,
      },
    ],
    // Optional: if this task is only for one specific calendar day
    specificDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

customTaskSchema.index({ user: 1 });

const CustomTask = mongoose.model('CustomTask', customTaskSchema);
export default CustomTask;
