import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startedAt: { type: Date, required: true },
  endedAt: { type: Date },
  status: { type: String, enum: ['ACTIVE', 'ENDED'], default: 'ACTIVE' },
  scenarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'SimulationScenario' },
  sourceType: { type: String, required: true, enum: ['SIMULATED', 'LIVE', 'REPLAY', 'UNKNOWN'], default: 'SIMULATED' },
  actionIds: [{ type: String }] // For idempotency
}, { timestamps: true });

export const ControllerSession = mongoose.model('ControllerSession', schema);