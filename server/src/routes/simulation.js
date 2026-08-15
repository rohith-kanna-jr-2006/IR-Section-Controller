import { Router } from 'express';
import { SimulationScenario } from '../models/operations/SimulationScenario.js';
import { SimulationEngine } from '../services/operations/SimulationEngine.js';
import { rbac, ROLES } from '../middleware/rbac.js';

const router = Router();
const engines = new Map(); // Store engine instances per scenario in memory

const getEngine = (scenarioId) => {
  if (!engines.has(scenarioId)) {
    engines.set(scenarioId, new SimulationEngine(scenarioId));
  }
  return engines.get(scenarioId);
};

// GET all scenarios
router.get('/scenarios', async (req, res) => {
  try {
    const scenarios = await SimulationScenario.find().sort('-createdAt');
    res.json({ data: scenarios });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Create new scenario
router.post('/scenarios', rbac(ROLES.ADMIN), async (req, res) => {
  try {
    const { scenarioId, name, randomSeed, topologySnapshotId } = req.body;
    const scenario = new SimulationScenario({
      scenarioId,
      name,
      randomSeed,
      simulationClockTime: new Date(),
      topologySnapshotId,
      sourceType: 'SIMULATED'
    });
    await scenario.save();
    res.status(201).json(scenario);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Simulation Controls
router.post('/start', rbac(ROLES.ADMIN, ROLES.CONTROLLER), async (req, res) => {
  try {
    const { scenarioId } = req.body;
    const engine = getEngine(scenarioId);
    await engine.start();
    res.json({ success: true, status: 'RUNNING' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/pause', rbac(ROLES.ADMIN, ROLES.CONTROLLER), async (req, res) => {
  try {
    const { scenarioId } = req.body;
    const engine = getEngine(scenarioId);
    await engine.pause();
    res.json({ success: true, status: 'PAUSED' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/step', rbac(ROLES.ADMIN, ROLES.CONTROLLER), async (req, res) => {
  try {
    const { scenarioId } = req.body;
    const engine = getEngine(scenarioId);
    await engine.step();
    res.json({ success: true, status: 'STEP_COMPLETE' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/speed', rbac(ROLES.ADMIN, ROLES.CONTROLLER), async (req, res) => {
  try {
    const { scenarioId, multiplier } = req.body;
    const scenario = await SimulationScenario.findById(scenarioId);
    if (!scenario) return res.status(404).json({ error: 'Scenario not found' });
    scenario.multiplier = multiplier;
    await scenario.save();
    res.json({ success: true, multiplier });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
