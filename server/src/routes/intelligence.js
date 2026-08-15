import { Router } from 'express';
import { rbac, ROLES } from '../middleware/rbac.js';
import { ControllerRecommendation } from '../models/operations/ControllerRecommendation.js';

const router = Router();

router.get('/recommendations', rbac(ROLES.ADMIN, ROLES.CONTROLLER), async (req, res) => {
  const recs = await ControllerRecommendation.find({ scenarioId: req.query.scenarioId }).lean();
  res.json({ data: recs });
});

router.post('/recommendations/:id/approve', rbac(ROLES.CONTROLLER), async (req, res) => {
  // Verifies controller authorization
  const rec = await ControllerRecommendation.findById(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Not found' });
  
  if (['EXPIRED', 'SUPERSEDED', 'INVALID', 'UNSAFE'].includes(rec.status)) {
    return res.status(400).json({ error: 'Cannot approve unsafe or invalid recommendation' });
  }

  // ONLY changes recommendation status and creates audit log. 
  // Execution to simulation happens explicitly downstream inside simulation boundary.
  rec.status = 'APPROVED';
  await rec.save();
  
  // Create audit log here (mocked for phase 5)
  
  res.json({ data: rec, message: 'Approved. Simulation execution pending.' });
});

router.post('/recommendations/:id/reject', rbac(ROLES.CONTROLLER), async (req, res) => {
  const rec = await ControllerRecommendation.findById(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Not found' });
  rec.status = 'REJECTED';
  await rec.save();
  res.json({ data: rec });
});

router.post('/recommendations/:id/what-if', rbac(ROLES.CONTROLLER), async (req, res) => {
  const rec = await ControllerRecommendation.findById(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Not found' });
  rec.status = 'WHAT_IF_EVALUATED';
  await rec.save();
  res.json({ data: { projectedKpi: { throughputDelta: 5, delayDelta: -10 } } });
});

export default router;