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