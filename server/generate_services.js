import fs from 'fs';
import path from 'path';

const servicesPath = path.resolve(process.cwd(), 'src/services/operations');

const services = {
  'SimulationEngine.js': `
import { SimulationScenario } from '../../models/operations/SimulationScenario.js';
import { TrainRun } from '../../models/operations/TrainRun.js';
import { TrainPosition } from '../../models/operations/TrainPosition.js';
import { SectionOccupancy } from '../../models/operations/SectionOccupancy.js';
import { ControlEvent } from '../../models/operations/ControlEvent.js';
import { getIO } from '../../config/socket.js';

export class SimulationEngine {
  constructor(scenarioId) {
    this.scenarioId = scenarioId;
    this.intervalId = null;
    this.scenario = null;
  }

  async init() {
    this.scenario = await SimulationScenario.findById(this.scenarioId);
    if (!this.scenario) throw new Error('Scenario not found');
  }

  async start() {
    if (!this.scenario) await this.init();
    if (this.scenario.status === 'RUNNING') return;
    
    this.scenario.status = 'RUNNING';
    await this.scenario.save();
    
    // The tick runs every 1 second real-time, representing 1 * multiplier in simulation time
    this.intervalId = setInterval(() => this.tick(), 1000);
    this.emitStatus();
  }

  async pause() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.scenario.status = 'PAUSED';
    await this.scenario.save();
    this.emitStatus();
  }

  async step() {
    if (!this.scenario) await this.init();
    if (this.scenario.status === 'RUNNING') return; // Cannot step while running
    await this.tick();
  }

  async tick() {
    // Independent Simulation Clock advance
    const timeDeltaMs = 1000 * this.scenario.multiplier;
    this.scenario.simulationClockTime = new Date(this.scenario.simulationClockTime.getTime() + timeDeltaMs);
    await this.scenario.save();
    
    // TODO: Train movement and traversal logic
    // - Query RUNNING TrainRuns
    // - Advance schematic positions
    // - Check Timetable / DayOffsets
    // - Create StationEvents
    // - Manage SectionOccupancies
    // - Log ControlEvents
    
    const io = getIO();
    if (io) {
      io.emit('simulation.clock', { 
        scenarioId: this.scenario._id, 
        time: this.scenario.simulationClockTime,
        multiplier: this.scenario.multiplier
      });
    }
  }

  emitStatus() {
    const io = getIO();
    if (io) {
      io.emit('simulation.status', { 
        scenarioId: this.scenario._id, 
        status: this.scenario.status 
      });
    }
  }
}
`,
  'ConflictEngine.js': `
import { Conflict } from '../../models/operations/Conflict.js';
import { SectionOccupancy } from '../../models/operations/SectionOccupancy.js';
import { getIO } from '../../config/socket.js';

export class ConflictEngine {
  /**
   * Run all conflict detection rules for a scenario.
   * Separated entirely from action execution.
   */
  static async evaluate(scenarioId) {
    await this.detectSameSectionOccupancy(scenarioId);
    await this.detectOpposingMovements(scenarioId);
  }

  static async detectSameSectionOccupancy(scenarioId) {
    // Group active occupancies by sectionId
    const occupancies = await SectionOccupancy.find({
      scenarioId,
      occupancyStatus: { $in: ['OCCUPIED', 'RESERVED'] }
    });
    
    const sectionMap = new Map();
    for (const occ of occupancies) {
      if (!sectionMap.has(occ.sectionId.toString())) sectionMap.set(occ.sectionId.toString(), []);
      sectionMap.get(occ.sectionId.toString()).push(occ);
    }
    
    for (const [sectionId, occs] of sectionMap.entries()) {
      if (occs.length > 1) {
        // Multiple trains in same section
        const trainRunIds = occs.map(o => o.trainRunId);
        await this.createOrUpdateConflict(scenarioId, 'SAME_SECTION_OCCUPANCY', 'CRITICAL', trainRunIds, sectionId, null, 'Multiple trains detected in the same section block.');
      }
    }
  }

  static async detectOpposingMovements(scenarioId) {
    // Check if trains in the same section have opposing directions
  }

  static async createOrUpdateConflict(scenarioId, type, severity, trainRunIds, sectionId, stationId, description) {
    // Generate deterministic hash for idempotency based on scenario, type, and target
    const targetKey = sectionId ? sectionId.toString() : stationId.toString();
    const conflictId = \`C-\${scenarioId}-\${type}-\${targetKey}\`;
    
    let conflict = await Conflict.findOne({ conflictId });
    if (!conflict) {
      conflict = new Conflict({
        conflictId,
        scenarioId,
        type,
        severity,
        trainRunIds,
        sectionId,
        stationId,
        description,
        detectedAt: new Date(), // Real time of detection
        status: 'DETECTED'
      });
      await conflict.save();
      
      const io = getIO();
      if (io) io.emit('conflict.created', conflict);
    } else if (conflict.status === 'RESOLVED' || conflict.status === 'DISMISSED') {
      // Re-open if it was incorrectly resolved
      conflict.status = 'OPEN';
      await conflict.save();
      const io = getIO();
      if (io) io.emit('conflict.updated', conflict);
    }
  }
}
`,
  'ControllerActionExecutor.js': `
import { ControllerSession } from '../../models/operations/ControllerSession.js';
import { ControlEvent } from '../../models/operations/ControlEvent.js';
import { TrainRun } from '../../models/operations/TrainRun.js';
import { Conflict } from '../../models/operations/Conflict.js';
import { getIO } from '../../config/socket.js';

export class ControllerActionExecutor {
  /**
   * Execute an idempotent action bound to a controller session
   */
  static async executeAction(sessionId, actionId, actionType, payload) {
    const session = await ControllerSession.findOne({ sessionId });
    if (!session) throw new Error('Session not found or invalid');
    if (session.status !== 'ACTIVE') throw new Error('Session is not active');
    
    // Idempotency check
    if (session.actionIds.includes(actionId)) {
      return { status: 'IGNORED', reason: 'Duplicate actionId' };
    }

    let result;
    switch (actionType) {
      case 'HOLD_TRAIN':
        result = await this.holdTrain(payload.trainRunId, session, actionId);
        break;
      case 'RELEASE_TRAIN':
        result = await this.releaseTrain(payload.trainRunId, session, actionId);
        break;
      case 'ACKNOWLEDGE_CONFLICT':
        result = await this.acknowledgeConflict(payload.conflictId, session, actionId);
        break;
      case 'RESOLVE_CONFLICT':
        result = await this.resolveConflict(payload.conflictId, session, actionId);
        break;
      default:
        throw new Error(\`Unknown action type: \${actionType}\`);
    }

    session.actionIds.push(actionId);
    await session.save();

    return result;
  }

  static async holdTrain(trainRunId, session, actionId) {
    const run = await TrainRun.findById(trainRunId);
    if (!run) throw new Error('TrainRun not found');
    
    const prevStatus = run.runStatus;
    run.runStatus = 'HELD';
    await run.save();

    await this.logEvent('TRAIN_HELD', { trainRunId, previousStatus: prevStatus }, session);
    return { success: true, runStatus: 'HELD' };
  }

  static async releaseTrain(trainRunId, session, actionId) {
    const run = await TrainRun.findById(trainRunId);
    if (!run) throw new Error('TrainRun not found');
    
    run.runStatus = 'RUNNING';
    await run.save();

    await this.logEvent('TRAIN_RELEASED', { trainRunId }, session);
    return { success: true, runStatus: 'RUNNING' };
  }

  static async acknowledgeConflict(conflictId, session, actionId) {
    const conflict = await Conflict.findById(conflictId);
    if (!conflict) throw new Error('Conflict not found');
    
    conflict.status = 'ACKNOWLEDGED';
    await conflict.save();

    await this.logEvent('CONFLICT_ACKNOWLEDGED', { conflictId }, session);
    
    const io = getIO();
    if (io) io.emit('conflict.updated', conflict);
    
    return { success: true };
  }

  static async resolveConflict(conflictId, session, actionId) {
    const conflict = await Conflict.findById(conflictId);
    if (!conflict) throw new Error('Conflict not found');
    
    conflict.status = 'RESOLVED';
    await conflict.save();

    await this.logEvent('CONFLICT_RESOLVED', { conflictId }, session);
    
    const io = getIO();
    if (io) io.emit('conflict.updated', conflict);
    
    return { success: true };
  }

  static async logEvent(eventType, payload, session) {
    const event = new ControlEvent({
      eventType,
      timestamp: new Date(),
      sessionId: session._id,
      scenarioId: session.scenarioId,
      trainRunId: payload.trainRunId,
      sourceType: 'SIMULATED',
      metadata: payload
    });
    await event.save();
    
    const io = getIO();
    if (io) io.emit('controller.action', event);
  }
}
`
};

for (const [filename, content] of Object.entries(services)) {
  fs.writeFileSync(path.join(servicesPath, filename), content.trim());
}

console.log('Operations services generated successfully.');
