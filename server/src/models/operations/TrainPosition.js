import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  trainRunId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainRun', required: true },
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  sourceType: { type: String, required: true, enum: ['SIMULATED', 'LIVE', 'REPLAY', 'UNKNOWN'], default: 'SIMULATED' },
  timestamp: { type: Date, required: true },
  speed: { type: Number },
  direction: { type: String },
  accuracy: { type: String, default: 'SCHEMATIC' }, // NEVER geographic for simulation unless explicitly authorized
  status: { type: String }
}, { timestamps: true });

export const TrainPosition = mongoose.model('TrainPosition', schema);