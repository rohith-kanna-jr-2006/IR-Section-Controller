import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  scenarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'SimulationScenario', required: true, unique: true },
  totalTrains: { type: Number, default: 0 },
  completedTrains: { type: Number, default: 0 },
  cancelledTrains: { type: Number, default: 0 },
  totalDelayMinutes: { type: Number, default: 0 },
  averageDelayMinutes: { type: Number, default: 0 },
  maxDelayMinutes: { type: Number, default: 0 },
  criticalConflicts: { type: Number, default: 0 },
  highConflicts: { type: Number, default: 0 },
  resolvedConflicts: { type: Number, default: 0 },
  unresolvedConflicts: { type: Number, default: 0 },
  sectionUtilizationRates: { type: mongoose.Schema.Types.Mixed }, // Map of sectionId to utilization %
  throughput: { type: Number, default: 0 },
  scenarioDurationMinutes: { type: Number, default: 0 },
  topologySnapshotId: { type: mongoose.Schema.Types.ObjectId, ref: 'TopologySnapshot', required: true },
  timetableSnapshotId: { type: mongoose.Schema.Types.ObjectId, ref: 'TimetableSnapshot', required: true },
}, { timestamps: true });

export const ScenarioKPI = mongoose.model('ScenarioKPI', schema);
