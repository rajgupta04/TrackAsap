import mongoose from 'mongoose';

const securityLogSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      enum: [
        'FAILED_LOGIN',
        'PASSWORD_RESET',
        'EMAIL_VERIFICATION',
        'SUSPICIOUS_LOGIN',
        'NEW_DEVICE',
        'NEW_BROWSER',
        'MULTIPLE_DEVICE_LOGIN',
        'JWT_INVALID',
        'JWT_EXPIRED',
        'RATE_LIMIT_TRIGGER',
        'ACCOUNT_LOCK',
      ],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    ip: String,
    userAgent: String,
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const SecurityLog = mongoose.model('SecurityLog', securityLogSchema);
export default SecurityLog;
