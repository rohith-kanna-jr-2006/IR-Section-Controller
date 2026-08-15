import { Router } from 'express';
import { z } from 'zod';
import { TrainRun } from '../models/operations/TrainRun.js';
import { SectionOccupancy } from '../models/operations/SectionOccupancy.js';
import { Conflict } from '../models/operations/Conflict.js';
import { ControlEvent } from '../models/operations/ControlEvent.js';
import { ControllerActionExecutor } from '../services/operations/ControllerActionExecutor.js';
import { rbac, ROLES } from '../middleware/rbac.js';

const router = Router();

// GET all active trains
router.get('/trains', async (req, res) => {
  try {
    const { scenarioId } = req.query;
    const runs = await TrainRun.find({ scenarioId }).populate('trainId currentStationId nextStationId currentSectionId');
    res.json({ data: runs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET specific train run
router.get('/trains/:id', async (req, res) => {
  try {
    const run = await TrainRun.findById(req.params.id).populate('trainId scheduleId');
    if (!run) return res.status(404).json({ error: 'TrainRun not found' });
    res.json(run);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET active conflicts
router.get('/conflicts', async (req, res) => {
  try {
    const { scenarioId, status } = req.query;
    const query = { scenarioId };
    if (status) query.status = status;
    const conflicts = await Conflict.find(query).sort('-detectedAt');
    res.json({ data: conflicts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET active occupancies
router.get('/sections', async (req, res) => {
  try {
    const { scenarioId } = req.query;
    const occupancies = await SectionOccupancy.find({ scenarioId, occupancyStatus: { $in: ['OCCUPIED', 'RESERVED', 'BLOCKED'] } });
    res.json({ data: occupancies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET event log
router.get('/events', async (req, res) => {
  try {
    const { scenarioId } = req.query;
    const events = await ControlEvent.find({ scenarioId }).sort('-timestamp').limit(100);
    res.json({ data: events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST actions
router.post('/trains/:id/hold', rbac(ROLES.ADMIN, ROLES.ZONE_ADMIN, ROLES.CONTROLLER), async (req, res) => {
  try {
    const { sessionId, actionId } = req.body;
    const result = await ControllerActionExecutor.executeAction(sessionId, actionId, 'HOLD_TRAIN', { trainRunId: req.params.id });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/trains/:id/release', rbac(ROLES.ADMIN, ROLES.ZONE_ADMIN, ROLES.CONTROLLER), async (req, res) => {
  try {
    const { sessionId, actionId } = req.body;
    const result = await ControllerActionExecutor.executeAction(sessionId, actionId, 'RELEASE_TRAIN', { trainRunId: req.params.id });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/conflicts/:id/acknowledge', rbac(ROLES.ADMIN, ROLES.ZONE_ADMIN, ROLES.CONTROLLER), async (req, res) => {
  try {
    const { sessionId, actionId } = req.body;
    const result = await ControllerActionExecutor.executeAction(sessionId, actionId, 'ACKNOWLEDGE_CONFLICT', { conflictId: req.params.id });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/conflicts/:id/resolve', rbac(ROLES.ADMIN, ROLES.ZONE_ADMIN, ROLES.CONTROLLER), async (req, res) => {
  try {
    const { sessionId, actionId } = req.body;
    const result = await ControllerActionExecutor.executeAction(sessionId, actionId, 'RESOLVE_CONFLICT', { conflictId: req.params.id });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
