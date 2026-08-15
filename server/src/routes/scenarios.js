import { Router } from 'express';
import { ScenarioBuilder } from '../services/operations/ScenarioBuilder.js';
import { ScenarioValidator } from '../services/operations/ScenarioValidator.js';
import { SimulationScenario } from '../models/operations/SimulationScenario.js';
import { ScenarioKPI } from '../models/operations/ScenarioKPI.js';
import { rbac, ROLES } from '../middleware/rbac.js';
import { ReplayEngine } from '../services/operations/ReplayEngine.js';

const replays = new Map();

const router = Router();

// POST Create DRAFT scenario
router.post('/', rbac(ROLES.ADMIN, ROLES.CONTROLLER), async (req, res) => {
  try {
    const { name, randomSeed } = req.body;
    const scenario = await ScenarioBuilder.createDraft(name, randomSeed || Date.now());
    res.status(201).json({ data: scenario });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST Set Snapshots
router.post('/:id/snapshots', rbac(ROLES.ADMIN, ROLES.CONTROLLER), async (req, res) => {
  try {
    const { topologySnapshotId, timetableSnapshotId } = req.body;
    const scenario = await ScenarioBuilder.assignSnapshots(req.params.id, topologySnapshotId, timetableSnapshotId);
    res.json({ data: scenario });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST Validate Scenario -> transitions to READY or FAILED
router.post('/:id/validate', rbac(ROLES.ADMIN, ROLES.CONTROLLER), async (req, res) => {
  try {
    const scenario = await ScenarioValidator.validate(req.params.id);
    res.json({ data: scenario });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET KPIs for completed scenario
router.get('/:id/kpis', rbac(ROLES.ADMIN, ROLES.CONTROLLER, ROLES.ZONE_ADMIN), async (req, res) => {
  try {
    const kpi = await ScenarioKPI.findOne({ scenarioId: req.params.id }).populate('topologySnapshotId timetableSnapshotId');
    if (!kpi) return res.status(404).json({ error: 'KPIs not found or scenario not completed' });
    res.json({ data: kpi });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Replay play
router.post('/:id/replay/play', rbac(ROLES.ADMIN, ROLES.CONTROLLER), async (req, res) => {
  try {
    let engine = replays.get(req.params.id);
    if (!engine) {
      engine = new ReplayEngine(req.params.id);
      await engine.init();
      replays.set(req.params.id, engine);
    }
    await engine.play();
    res.json({ status: 'playing' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST Replay stop
router.post('/:id/replay/stop', rbac(ROLES.ADMIN, ROLES.CONTROLLER), (req, res) => {
  const engine = replays.get(req.params.id);
  if (engine) engine.stop();
  res.json({ status: 'stopped' });
});

// POST Replay seek
router.post('/:id/replay/seek', rbac(ROLES.ADMIN, ROLES.CONTROLLER), (req, res) => {
  const engine = replays.get(req.params.id);
  if (engine) engine.seek(req.body.index || 0);
  res.json({ status: 'seeked' });
});

export default router;
