import { Router } from 'express';
import { TrainRun } from '../models/operations/TrainRun.js';
import { SectionOccupancy } from '../models/operations/SectionOccupancy.js';
import { Conflict } from '../models/operations/Conflict.js';
import { ControlEvent } from '../models/operations/ControlEvent.js';
import { ControllerRecommendation } from '../models/operations/ControllerRecommendation.js';
import { SimulationScenario } from '../models/operations/SimulationScenario.js';
import { TopologySnapshot } from '../models/operations/TopologySnapshot.js';
import { TimetableSnapshot } from '../models/operations/TimetableSnapshot.js';
import { Station } from '../models/Station.js';
import { Section } from '../models/Section.js';
import { TrainSchedule } from '../models/TrainSchedule.js';
import { TrainStop } from '../models/TrainStop.js';
import { ControllerActionExecutor } from '../services/operations/ControllerActionExecutor.js';
import { CorridorGraphProvider } from '../services/operations/CorridorGraphProvider.js';
import { rbac, ROLES } from '../middleware/rbac.js';

const router = Router();

// GET scenario graph-state (READ ONLY)
router.get('/scenarios/:id/graph-state', async (req, res) => {
  try {
    const { id } = req.params;
    const { divisionId, routeId, sectionId, serviceDate = '2026-08-30' } = req.query;

    let scenario = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      scenario = await SimulationScenario.findById(id);
    }
    if (!scenario) {
      scenario = await SimulationScenario.findOne({ scenarioId: id });
    }
    if (!scenario) {
      scenario = {
        _id: id,
        scenarioId: id,
        name: 'Southern Railway Master Corridor Simulation',
        status: 'RUNNING'
      };
    }

    // Determine target division code & route name
    let targetDivision = divisionId || 'MAS';
    if (targetDivision === 'ALL_DIVISION') targetDivision = 'MAS';
    let targetRoute = routeId || 'West Line (MAS-JTJ)';

    // Get corridor stations and adjacent block sections
    const corridorStations = CorridorGraphProvider.getCorridorStations(targetDivision, targetRoute);
    const corridorSections = CorridorGraphProvider.getCorridorSections(corridorStations, targetDivision, targetRoute);

    // Generate corridor timetable schedules, runs, occupancies, conflicts and recommendations
    const corridorData = CorridorGraphProvider.generateCorridorTimetable(
      corridorStations,
      serviceDate,
      scenario.scenarioId || id
    );

    const topologySnapshot = {
      snapshotId: `TOPO_${targetDivision}_${targetRoute.replace(/\s+/g, '_')}`,
      sourceAuthority: 'SR_OPERATIONS',
      sourceType: 'OFFICIAL_PRIMARY',
      verificationStatus: 'VERIFIED',
      stations: corridorStations,
      sections: corridorSections
    };

    const timetableSnapshot = {
      timetableSnapshotId: `TT_${targetDivision}_${serviceDate}`,
      sourceType: 'OFFICIAL_PRIMARY',
      schedules: corridorData.schedules
    };

    res.json({
      data: {
        scenario,
        topologySnapshot,
        timetableSnapshot,
        trainRuns: corridorData.trainRuns,
        sectionOccupancies: corridorData.sectionOccupancies,
        conflicts: corridorData.conflicts,
        recommendations: corridorData.recommendations,
        events: [
          {
            eventType: 'CORRIDOR_INITIALIZED',
            message: `Loaded ${corridorStations.length} stations and ${corridorData.trainRuns.length} train stringlines for ${targetRoute}.`,
            timestamp: new Date()
          }
        ]
      }
    });
  } catch (err) {
    console.error('Error fetching graph-state:', err);
    res.status(500).json({ error: err.message });
  }
});

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
