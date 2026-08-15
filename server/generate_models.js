import fs from 'fs';
import path from 'path';

const modelsPath = path.resolve(process.cwd(), 'src/models/operations');

const models = {
  'TopologySnapshot.js': `
import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  snapshotId: { type: String, required: true, unique: true },
  sourceAuthority: { type: String, required: true },
  sourceType: { type: String, required: true, enum: ['SIMULATED', 'LIVE', 'REPLAY', 'UNKNOWN'] },
  sourceVersion: { type: String },
  sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
  stations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Station' }],
  verificationStatus: { type: String, enum: ['VERIFIED', 'NOT VERIFIED', 'REVIEW_REQUIRED', 'CONFLICT'], default: 'NOT VERIFIED' }
}, { timestamps: true });

export const TopologySnapshot = mongoose.model('TopologySnapshot', schema);
`,
  'SimulationScenario.js': `
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
`,
  'ControllerSession.js': `
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
`,
  'TrainRun.js': `
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
`,
  'TrainPosition.js': `
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
`,
  'SectionOccupancy.js': `
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
`,
  'StationEvent.js': `
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
`,
  'ControlEvent.js': `
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
`,
  'Conflict.js': `
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
`,
  'Alert.js': `
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
`
};

for (const [filename, content] of Object.entries(models)) {
  fs.writeFileSync(path.join(modelsPath, filename), content.trim());
}

console.log('Operational models generated successfully.');
