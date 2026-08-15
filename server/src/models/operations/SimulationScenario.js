import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  scenarioId: { type: String, required: true, unique: true },
  name: { type: String },
  randomSeed: { type: Number, required: true },
  simulationClockTime: { type: Date, required: true },
  status: { type: String, enum: ['PLANNED', 'READY', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED'], default: 'PLANNED' },
  topologySnapshotId: { type: mongoose.Schema.Types.ObjectId, ref: 'TopologySnapshot', required: true },
  sourceType: { type: String, required: true, enum: ['SIMULATED', 'LIVE', 'REPLAY', 'UNKNOWN'], default: 'SIMULATED' },
  multiplier: { type: Number, default: 1 }
}, { timestamps: true });

export const SimulationScenario = mongoose.model('SimulationScenario', schema);