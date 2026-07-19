import mongoose from 'mongoose';

const requestLogSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    endpoint: String,
    method: String,
    statusCode: Number,
    responseTime: Number, // in ms
    ip: String,
    createdAt: {
      type: Date,
      default: Date.now,
      // TTL Index: automatically delete document after 7 days
      expires: 604800, 
    },
  },
  // No timestamps needed since createdAt handles both creation and TTL
  { versionKey: false }
);

const RequestLog = mongoose.model('RequestLog', requestLogSchema);
export default RequestLog;
