import mongoose from 'mongoose';

const physiqueLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
      min: 20,
      max: 300,
    },
    bodyFat: {
      type: Number,
      min: 1,
      max: 50,
      default: null,
    },
    measurements: {
      chest: { type: Number, default: null },
      waist: { type: Number, default: null },
      hips: { type: Number, default: null },
      arms: { type: Number, default: null },
      thighs: { type: Number, default: null },
    },
    weekNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 11, // 75 days = ~11 weeks
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for user and date
physiqueLogSchema.index({ user: 1, date: -1 });
physiqueLogSchema.index({ user: 1, weekNumber: 1 });

const PhysiqueLog = mongoose.model('PhysiqueLog', physiqueLogSchema);
export default PhysiqueLog;
