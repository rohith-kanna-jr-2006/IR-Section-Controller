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
            if (arr > dep) throw new Error(`Inconsistent timetable for schedule ${sched._id}`);
          }
        }
      }

      // If all checks pass
      scenario.status = 'READY';
    } catch (error) {
      scenario.status = 'FAILED';
      console.error(`Validation failed for scenario ${scenarioId}: ${error.message}`);
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