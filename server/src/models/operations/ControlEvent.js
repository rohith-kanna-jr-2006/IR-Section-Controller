import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  eventType: { type: String, required: true },
  timestamp: { type: Date, required: true },
  trainRunId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainRun' },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
  scenarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'SimulationScenario' },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ControllerSession' },
  sourceType: { type: String, required: true, enum: ['SIMULATED', 'LIVE', 'REPLAY', 'UNKNOWN'], default: 'SIMULATED' },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

export const ControlEvent = mongoose.model('ControlEvent', schema);