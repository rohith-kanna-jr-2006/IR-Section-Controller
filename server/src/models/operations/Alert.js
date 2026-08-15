import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true },
  scenarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'SimulationScenario', required: true },
  type: { type: String, required: true },
  severity: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'], required: true },
  message: { type: String, required: true },
  detectedAt: { type: Date, required: true },
  status: { type: String, enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'], default: 'OPEN' }
}, { timestamps: true });

export const Alert = mongoose.model('Alert', schema);