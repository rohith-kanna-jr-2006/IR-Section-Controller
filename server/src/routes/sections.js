import { Router } from 'express';
import { z } from 'zod';
import { Section } from '../models/Section.js';
import { rbac, ROLES } from '../middleware/rbac.js';
import { logAudit } from '../services/AuditLogger.js';
import { HierarchyValidator } from '../services/validation/HierarchyValidator.js';

const router = Router();

const createSchema = z.object({
  sectionCode: z.string().optional(),
  name: z.string().optional(),
  fromStationId: z.string().min(1),
  toStationId: z.string().min(1),
  divisionId: z.string().min(1),
  zoneId: z.string().optional(),
  distanceKm: z.number().optional(),
  direction: z.string().optional(),
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
    if (filters.divisionId) query.divisionId = filters.divisionId;
    if (filters.fromStationId) query.fromStationId = filters.fromStationId;
    if (filters.toStationId) query.toStationId = filters.toStationId;

    const data = await Section.find(query).populate('fromStationId toStationId', 'stationCode name').sort(sort).skip(skip).limit(parseInt(limit));
    const total = await Section.countDocuments(query);

    res.json({
      data,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', rbac(ROLES.ADMIN, ROLES.ZONE_ADMIN, ROLES.DIVISION_ADMIN, ROLES.DATA_OPERATOR), async (req, res) => {
  try {
    const validatedData = createSchema.parse(req.body);
    
    if (validatedData.zoneId) {
      const hierarchyCheck = await HierarchyValidator.validateSectionHierarchy(validatedData.divisionId, validatedData.zoneId, validatedData.fromStationId, validatedData.toStationId);
      if (!hierarchyCheck.valid) return res.status(400).json({ error: hierarchyCheck.message });
    }

    const newSection = new Section(validatedData);
    await newSection.save();
    
    await logAudit(req, 'CREATE', 'Section', newSection._id, validatedData, 'Initial creation');
    res.status(201).json(newSection);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: error.errors });
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', rbac(ROLES.ADMIN, ROLES.ZONE_ADMIN, ROLES.DIVISION_ADMIN, ROLES.DATA_OPERATOR), async (req, res) => {
  try {
    const validatedData = updateSchema.parse(req.body);
    const section = await Section.findById(req.params.id);
    if (!section) return res.status(404).json({ error: 'Section not found' });

    Object.assign(section, validatedData);
    await section.save();

    await logAudit(req, 'UPDATE', 'Section', section._id, validatedData, 'Update operation');
    res.json(section);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: error.errors });
    res.status(500).json({ error: error.message });
  }
});

export default router;
