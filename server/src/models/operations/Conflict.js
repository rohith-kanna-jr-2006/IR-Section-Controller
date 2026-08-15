import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  conflictId: { type: String, required: true, unique: true },
  scenarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'SimulationScenario', required: true },
  type: { type: String, required: true }, // e.g., 'SAME_SECTION_OCCUPANCY', 'OPPOSING_MOVEMENT'
  severity: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'], required: true },
  trainRunIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TrainRun' }],
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
  detectedAt: { type: Date, required: true },
  description: { type: String },
  status: { type: String, enum: ['DETECTED', 'OPEN', 'ACKNOWLEDGED', 'MITIGATION_PROPOSED', 'RESOLVED', 'DISMISSED', 'EXPIRED'], default: 'DETECTED' }
}, { timestamps: true });

export const Conflict = mongoose.model('Conflict', schema);