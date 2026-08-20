import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'main_settings',
      unique: true,
    },
    showProblems: {
      type: Boolean,
      default: false,
    },
    showLeaderboard: {
      type: Boolean,
      default: false,
    },
    compilerEnabled: {
      type: Boolean,
      default: true,
    },
    compilerMaxRunsPerMinute: {
      type: Number,
      default: 15,
    },
  },
  {
    timestamps: true,
  }
);

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

export default SystemSettings;
