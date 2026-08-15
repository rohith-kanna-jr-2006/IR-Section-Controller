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