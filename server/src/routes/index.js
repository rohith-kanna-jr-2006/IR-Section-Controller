import { Router } from 'express';
import healthRoutes from './health.js';
import zoneRoutes from './zones.js';
import divisionRoutes from './divisions.js';
import stationRoutes from './stations.js';
import sectionRoutes from './sections.js';
import trainRoutes from './trains.js';
import scheduleRoutes from './schedules.js';
import scenarioRoutes from './scenarios.js';
import operationRoutes from './operations.js';
import simulationRoutes from './simulation.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/zones', zoneRoutes);
router.use('/divisions', divisionRoutes);
router.use('/stations', stationRoutes);
router.use('/sections', sectionRoutes);
router.use('/trains', trainRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/scenarios', scenarioRoutes);
router.use('/operations', operationRoutes);
router.use('/simulation', simulationRoutes);

export default router;
