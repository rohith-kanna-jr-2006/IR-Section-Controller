import { Router } from 'express';
import healthRoutes from './health.js';

const router = Router();

router.use('/', healthRoutes);
// Prepare other routes for Phase 2
// router.use('/auth', authRoutes);
// router.use('/zones', zoneRoutes);
// router.use('/divisions', divisionRoutes);
// router.use('/stations', stationRoutes);
// router.use('/sections', sectionRoutes);
// router.use('/trains', trainRoutes);

export default router;
