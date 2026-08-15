const fs = require('fs');
const path = require('path');

const servicesPath = path.resolve(__dirname, 'server/src/services/operations');

const services = {
  'TopologySnapshotBuilder.js': `
import crypto from 'crypto';
import { Station } from '../../models/Station.js';
import { Section } from '../../models/Section.js';
import { TopologySnapshot } from '../../models/operations/TopologySnapshot.js';

export class TopologySnapshotBuilder {
  static async buildSnapshot(sourceAuthority, sourceType, sourceId, sourceVersion) {
    const stations = await Station.find().lean();
    const sections = await Section.find().lean();

    const dataString = JSON.stringify({ stations, sections });
    const topologyHash = crypto.createHash('sha256').update(dataString).digest('hex');

    const snapshot = new TopologySnapshot({
      snapshotId: \`TS-\${Date.now()}\`,
      sourceAuthority,
      sourceType,
      sourceId,
      sourceVersion,
      stations,
      sections,
      topologyHash,
      verificationStatus: 'NOT VERIFIED'
    });

    await snapshot.save();
    return snapshot;
  }
}
`,
  'TimetableSnapshotBuilder.js': `
import crypto from 'crypto';
import { TrainSchedule } from '../../models/TrainSchedule.js';
import { TrainStop } from '../../models/TrainStop.js';
import { TimetableSnapshot } from '../../models/operations/TimetableSnapshot.js';

export class TimetableSnapshotBuilder {
  static async buildSnapshot(trainIds, sourceType, sourceId, dataVersionId) {
    const schedules = await TrainSchedule.find({ trainId: { $in: trainIds } }).lean();
    const scheduleIds = schedules.map(s => s._id);
    const stops = await TrainStop.find({ scheduleId: { $in: scheduleIds } }).lean();

    const combinedData = schedules.map(sched => ({
      ...sched,
      stops: stops.filter(stop => stop.scheduleId.toString() === sched._id.toString())
    }));

    const dataString = JSON.stringify(combinedData);
    const scheduleHash = crypto.createHash('sha256').update(dataString).digest('hex');

    const snapshot = new TimetableSnapshot({
      timetableSnapshotId: \`TTS-\${Date.now()}\`,
      sourceType,
      sourceId,
      dataVersionId,
      scheduleHash,
      schedules: combinedData,
      verificationStatus: 'NOT VERIFIED'
    });

    await snapshot.save();
    return snapshot;
  }
}
`,
  'ScenarioBuilder.js': `
import { SimulationScenario } from '../../models/operations/SimulationScenario.js';
import { TopologySnapshotBuilder } from './TopologySnapshotBuilder.js';
import { TimetableSnapshotBuilder } from './TimetableSnapshotBuilder.js';

export class ScenarioBuilder {
  static async createDraft(name, randomSeed) {
    const scenario = new SimulationScenario({
      scenarioId: \`SCN-\${Date.now()}\`,
      name,
      randomSeed,
      simulationClockTime: new Date(),
      status: 'DRAFT',
      sourceType: 'SIMULATED'
    });
    await scenario.save();
    return scenario;
  }

  static async assignSnapshots(scenarioId, topologySnapshotId, timetableSnapshotId) {
    const scenario = await SimulationScenario.findById(scenarioId);
    if (!scenario) throw new Error('Scenario not found');
    if (scenario.status !== 'DRAFT') throw new Error('Scenario must be in DRAFT state');
    
    scenario.topologySnapshotId = topologySnapshotId;
    scenario.timetableSnapshotId = timetableSnapshotId;
    await scenario.save();
    return scenario;
  }
}
`,
  'ScenarioValidator.js': `
import { SimulationScenario } from '../../models/operations/SimulationScenario.js';
import { TopologySnapshot } from '../../models/operations/TopologySnapshot.js';
import { TimetableSnapshot } from '../../models/operations/TimetableSnapshot.js';

export class ScenarioValidator {
  static async validate(scenarioId) {
    const scenario = await SimulationScenario.findById(scenarioId);
    if (!scenario) throw new Error('Scenario not found');
    if (scenario.status !== 'DRAFT') throw new Error('Can only validate DRAFT scenarios');

    scenario.status = 'VALIDATING';
    await scenario.save();

    try {
      const topo = await TopologySnapshot.findById(scenario.topologySnapshotId);
      if (!topo) throw new Error('Topology snapshot not found');

      const time = await TimetableSnapshot.findById(scenario.timetableSnapshotId);
      if (!time) throw new Error('Timetable snapshot not found');

      // 1. Asset verification: basic check
      if (!topo.stations.length || !topo.sections.length) throw new Error('Topology is empty');
      if (!time.schedules.length) throw new Error('Timetable is empty');

      // 2. Timetable consistency (Arrival < Departure)
      for (const sched of time.schedules) {
        for (const stop of sched.stops) {
          if (stop.arrivalTime && stop.departureTime) {
            const arr = this.parseTime(stop.arrivalTime, stop.arrivalDayOffset);
            const dep = this.parseTime(stop.departureTime, stop.departureDayOffset);
            if (arr > dep) throw new Error(\`Inconsistent timetable for schedule \${sched._id}\`);
          }
        }
      }

      // If all checks pass
      scenario.status = 'READY';
    } catch (error) {
      scenario.status = 'FAILED';
      console.error(\`Validation failed for scenario \${scenarioId}: \${error.message}\`);
    }

    await scenario.save();
    return scenario;
  }

  static parseTime(timeStr, dayOffset = 0) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (dayOffset * 24 * 60) + (h * 60) + m;
  }
}
`,
  'ReplayEngine.js': `
import { SimulationScenario } from '../../models/operations/SimulationScenario.js';
import { ControlEvent } from '../../models/operations/ControlEvent.js';
import { getIO } from '../../config/socket.js';

export class ReplayEngine {
  constructor(scenarioId) {
    this.scenarioId = scenarioId;
    this.scenario = null;
    this.events = [];
    this.currentIndex = 0;
    this.intervalId = null;
  }

  async init() {
    this.scenario = await SimulationScenario.findById(this.scenarioId);
    if (!this.scenario) throw new Error('Scenario not found');
    if (this.scenario.status !== 'COMPLETED') throw new Error('Can only replay COMPLETED scenarios');

    this.events = await ControlEvent.find({ scenarioId: this.scenario._id }).sort('timestamp').lean();
  }

  async play() {
    if (!this.scenario) await this.init();
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      if (this.currentIndex >= this.events.length) {
        this.stop();
        return;
      }
      
      const event = this.events[this.currentIndex];
      const io = getIO();
      if (io) {
        io.emit('replay.event', event);
      }
      this.currentIndex++;
    }, 500); // Replay tick
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  seek(index) {
    if (index >= 0 && index < this.events.length) {
      this.currentIndex = index;
    }
  }
}
`
};

for (const [filename, content] of Object.entries(services)) {
  fs.writeFileSync(path.join(servicesPath, filename), content.trim());
}

console.log('Phase 4 services generated.');
