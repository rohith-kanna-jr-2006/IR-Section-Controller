import { Router } from 'express';
import { z } from 'zod';
import { Train } from '../models/Train.js';
import { rbac, ROLES } from '../middleware/rbac.js';
import { logAudit } from '../services/AuditLogger.js';

const router = Router();

const createSchema = z.object({
  trainNumber: z.string().min(1),
  trainNumberNormalized: z.string().optional(),
  name: z.string().min(1),
  trainType: z.string().optional(),
  serviceCategory: z.string().optional(),
  operator: z.string().optional(),
  zoneId: z.string().min(1),
  status: z.enum(['ACTIVE', 'PROPOSED', 'HISTORICAL']).optional()
});

const updateSchema = createSchema.partial();

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 25, sort = '-createdAt', ...filters } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.zoneId) query.zoneId = filters.zoneId;
    if (filters.trainNumber) query.trainNumber = new RegExp(`^${filters.trainNumber}`, 'i');
    if (filters.name) query.name = new RegExp(filters.name, 'i');

    const data = await Train.find(query).populate('zoneId', 'code name').sort(sort).skip(skip).limit(parseInt(limit));
    const total = await Train.countDocuments(query);

    res.json({
      data,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const train = await Train.findById(req.params.id).populate('zoneId');
    if (!train) return res.status(404).json({ error: 'Train not found' });
    res.json(train);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', rbac(ROLES.ADMIN, ROLES.ZONE_ADMIN, ROLES.DATA_OPERATOR), async (req, res) => {
  try {
    const validatedData = createSchema.parse(req.body);
    
    const newTrain = new Train(validatedData);
    await newTrain.save();
    
    await logAudit(req, 'CREATE', 'Train', newTrain._id, validatedData, 'Initial creation');
    res.status(201).json(newTrain);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: error.errors });
    if (error.code === 11000) return res.status(409).json({ error: 'Duplicate train number in ACTIVE state' });
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', rbac(ROLES.ADMIN, ROLES.ZONE_ADMIN, ROLES.DATA_OPERATOR), async (req, res) => {
  try {
    const validatedData = updateSchema.parse(req.body);
    const train = await Train.findById(req.params.id);
    if (!train) return res.status(404).json({ error: 'Train not found' });

    Object.assign(train, validatedData);
    await train.save();

    await logAudit(req, 'UPDATE', 'Train', train._id, validatedData, 'Update operation');
    res.json(train);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: error.errors });
    if (error.code === 11000) return res.status(409).json({ error: 'Duplicate train number in ACTIVE state' });
    res.status(500).json({ error: error.message });
  }
});

export default router;
