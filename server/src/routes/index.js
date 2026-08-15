import { Router } from 'express';
import healthRoutes from './health.js';
import zoneRoutes from './zones.js';
import divisionRoutes from './divisions.js';
import stationRoutes from './stations.js';
import sectionRoutes from './sections.js';
import trainRoutes from './trains.js';
import scheduleRoutes from './schedules.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/zones', zoneRoutes);
router.use('/divisions', divisionRoutes);
router.use('/stations', stationRoutes);
router.use('/sections', sectionRoutes);
router.use('/trains', trainRoutes);
router.use('/schedules', scheduleRoutes);

export default router;
