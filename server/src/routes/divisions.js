import { Router } from 'express';
import { z } from 'zod';
import { Division } from '../models/Division.js';
import { rbac, ROLES, requireScope } from '../middleware/rbac.js';
import { logAudit } from '../services/AuditLogger.js';

const router = Router();

const createSchema = z.object({
  zoneId: z.string().min(1),
  name: z.string().min(1),
  code: z.string().min(1),
  shortName: z.string().optional(),
  headquarters: z.string().optional(),
  status: z.enum(['ACTIVE', 'PROPOSED', 'REORGANIZED', 'HISTORICAL', 'CORPORATION']).optional()
});

const updateSchema = createSchema.partial();

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 25, sort = '-createdAt', ...filters } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.zoneId) query.zoneId = filters.zoneId;
    if (filters.code) query.code = new RegExp(filters.code, 'i');
    if (filters.name) query.name = new RegExp(filters.name, 'i');

    const data = await Division.find(query).populate('zoneId', 'code name').sort(sort).skip(skip).limit(parseInt(limit));
    const total = await Division.countDocuments(query);

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
    const division = await Division.findById(req.params.id).populate('zoneId');
    if (!division) return res.status(404).json({ error: 'Division not found' });
    res.json(division);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', rbac(ROLES.ADMIN, ROLES.ZONE_ADMIN, ROLES.DATA_OPERATOR), requireScope('zoneId'), async (req, res) => {
  try {
    const validatedData = createSchema.parse(req.body);
    const newDiv = new Division(validatedData);
    await newDiv.save();
    
    await logAudit(req, 'CREATE', 'Division', newDiv._id, validatedData, 'Initial creation');
    
    res.status(201).json(newDiv);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: error.errors });
    if (error.code === 11000) return res.status(409).json({ error: 'Duplicate code' });
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', rbac(ROLES.ADMIN, ROLES.ZONE_ADMIN, ROLES.DIVISION_ADMIN, ROLES.DATA_OPERATOR), async (req, res) => {
  try {
    const validatedData = updateSchema.parse(req.body);
    
    const div = await Division.findById(req.params.id);
    if (!div) return res.status(404).json({ error: 'Division not found' });

    // Scope checks
    if (req.user?.role === ROLES.ZONE_ADMIN && req.user.zoneId?.toString() !== div.zoneId.toString()) {
      return res.status(403).json({ error: 'Out of zone scope' });
    }
    if (req.user?.role === ROLES.DIVISION_ADMIN && req.user.divisionId?.toString() !== div._id.toString()) {
      return res.status(403).json({ error: 'Out of division scope' });
    }

    Object.assign(div, validatedData);
    await div.save();

    await logAudit(req, 'UPDATE', 'Division', div._id, validatedData, 'Update operation');

    res.json(div);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: error.errors });
    if (error.code === 11000) return res.status(409).json({ error: 'Duplicate code' });
    res.status(500).json({ error: error.message });
  }
});

export default router;
