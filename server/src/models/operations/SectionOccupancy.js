import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  trainRunId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainRun', required: true },
  scenarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'SimulationScenario', required: true },
  entryTime: { type: Date },
  expectedExitTime: { type: Date },
  actualExitTime: { type: Date },
  occupancyStatus: { type: String, enum: ['RESERVED', 'OCCUPIED', 'RELEASED', 'BLOCKED', 'UNKNOWN'], required: true },
  direction: { type: String },
  sourceType: { type: String, required: true, enum: ['SIMULATED', 'LIVE', 'REPLAY', 'UNKNOWN'], default: 'SIMULATED' }
}, { timestamps: true });

export const SectionOccupancy = mongoose.model('SectionOccupancy', schema);