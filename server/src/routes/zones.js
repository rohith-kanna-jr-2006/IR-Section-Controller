import { Router } from 'express';
import { z } from 'zod';
import { Zone } from '../models/Zone.js';
import { rbac, ROLES } from '../middleware/rbac.js';
import { logAudit } from '../services/AuditLogger.js';

const router = Router();

const createSchema = z.object({
  organizationId: z.string().optional(),
  name: z.string().min(1),
  code: z.string().min(1),
  shortName: z.string().optional(),
  headquarters: z.string().optional(),
  status: z.enum(['ACTIVE', 'PROPOSED', 'REORGANIZED', 'HISTORICAL', 'CORPORATION']).optional()
});

const updateSchema = createSchema.partial();

// GET list
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 25, sort = '-createdAt', ...filters } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    
    // Clean filters (prevent NOSQL injection with $ operators if needed, but simplistic here)
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.code) query.code = new RegExp(filters.code, 'i');
    if (filters.name) query.name = new RegExp(filters.name, 'i');

    const data = await Zone.find(query).sort(sort).skip(skip).limit(parseInt(limit));
    const total = await Zone.countDocuments(query);

    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single
router.get('/:id', async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    res.json(zone);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create
router.post('/', rbac(ROLES.ADMIN, ROLES.DATA_OPERATOR), async (req, res) => {
  try {
    const validatedData = createSchema.parse(req.body);
    const newZone = new Zone(validatedData);
    await newZone.save();
    
    await logAudit(req, 'CREATE', 'Zone', newZone._id, validatedData, 'Initial creation');
    
    res.status(201).json(newZone);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Duplicate code' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PATCH update
router.patch('/:id', rbac(ROLES.ADMIN, ROLES.ZONE_ADMIN, ROLES.DATA_OPERATOR), async (req, res) => {
  try {
    const validatedData = updateSchema.parse(req.body);
    
    // Simple scope check since Zone has no parent to check against for ZONE_ADMIN
    if (req.user && req.user.role === ROLES.ZONE_ADMIN && req.user.zoneId?.toString() !== req.params.id) {
        return res.status(403).json({ error: 'Access denied to this zone' });
    }

    const zone = await Zone.findByIdAndUpdate(req.params.id, validatedData, { new: true });
    if (!zone) return res.status(404).json({ error: 'Zone not found' });

    await logAudit(req, 'UPDATE', 'Zone', zone._id, validatedData, 'Update operation');

    res.json(zone);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Duplicate code' });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
