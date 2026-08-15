import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  trainRunId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainRun', required: true },
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  eventType: { type: String, enum: ['ARRIVAL', 'DEPARTURE', 'HALT', 'PLATFORM_ASSIGNMENT', 'PLATFORM_RELEASE', 'PASSING', 'CANCELLED_STOP'], required: true },
  scheduledTime: { type: Date },
  actualTime: { type: Date },
  delayMinutes: { type: Number, default: 0 },
  platform: { type: String },
  sourceType: { type: String, required: true, enum: ['SIMULATED', 'LIVE', 'REPLAY', 'UNKNOWN'], default: 'SIMULATED' },
  timestamp: { type: Date, required: true }
}, { timestamps: true });

export const StationEvent = mongoose.model('StationEvent', schema);