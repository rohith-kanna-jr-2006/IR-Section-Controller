import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  trainRunId: { type: String, required: true, unique: true },
  trainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainSchedule', required: true },
  scenarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'SimulationScenario', required: true },
  serviceDate: { type: String, required: true }, // YYYY-MM-DD
  runStatus: { type: String, enum: ['PLANNED', 'READY', 'RUNNING', 'ARRIVED', 'DEPARTED', 'HELD', 'COMPLETED', 'CANCELLED', 'UNKNOWN'], default: 'PLANNED' },
  priorityClass: { type: String, default: 'NORMAL' },
  currentStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
  nextStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
  currentSectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  sourceType: { type: String, required: true, enum: ['SIMULATED', 'LIVE', 'REPLAY', 'UNKNOWN'], default: 'SIMULATED' },
  startedAt: { type: Date },
  completedAt: { type: Date },
  delayMinutes: { type: Number, default: 0 }
}, { timestamps: true });

export const TrainRun = mongoose.model('TrainRun', schema);