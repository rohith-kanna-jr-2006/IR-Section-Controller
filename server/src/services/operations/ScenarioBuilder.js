import { SimulationScenario } from '../../models/operations/SimulationScenario.js';
import { TopologySnapshotBuilder } from './TopologySnapshotBuilder.js';
import { TimetableSnapshotBuilder } from './TimetableSnapshotBuilder.js';

export class ScenarioBuilder {
  static async createDraft(name, randomSeed) {
    const scenario = new SimulationScenario({
      scenarioId: `SCN-${Date.now()}`,
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