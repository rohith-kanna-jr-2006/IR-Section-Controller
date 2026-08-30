import { Router } from 'express';
import { z } from 'zod';
import { Station } from '../models/Station.js';
import { rbac, ROLES } from '../middleware/rbac.js';
import { logAudit } from '../services/AuditLogger.js';
import { HierarchyValidator } from '../services/validation/HierarchyValidator.js';
import { StationValidator } from '../services/validation/StationValidator.js';
import { getAllSRStations, SR_DIVISIONS_MAP } from '../config/srSectionsData.js';

const router = Router();

router.get('/sr-stations', (req, res) => {
  try {
    const { division, search } = req.query;
    let list = getAllSRStations();
    if (division) {
      list = list.filter(s => s.divisionCode.toUpperCase() === division.toUpperCase() || s.divisionName.toUpperCase() === division.toUpperCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.stationCode.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    res.json({
      success: true,
      total: list.length,
      data: list
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const createSchema = z.object({
  divisionId: z.string().min(1),
  zoneId: z.string().min(1),
  stationCode: z.string().min(1),
  name: z.string().min(1),
  officialName: z.string().optional(),
  shortName: z.string().optional(),
  location: z.object({
    type: z.literal('Point').default('Point'),
    coordinates: z.array(z.number()).length(2)
  }).optional(),
  stationType: z.string().optional(),
  status: z.enum(['ACTIVE', 'PROPOSED', 'REORGANIZED', 'HISTORICAL', 'CORPORATION']).optional(),
  effectiveFrom: z.string().optional().transform(str => str ? new Date(str) : undefined),
  effectiveTo: z.string().optional().transform(str => str ? new Date(str) : undefined),
  sourceId: z.string().optional(),
  dataVersionId: z.string().optional(),
  verificationStatus: z.enum(['VERIFIED', 'NOT VERIFIED', 'REVIEW_REQUIRED', 'CONFLICT']).optional(),
  authorityLevel: z.enum(['PRIMARY', 'SECONDARY', 'INFERRED']).optional()
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
    if (filters.stationType) query.stationType = filters.stationType;
    if (filters.stationCode) query.stationCode = new RegExp(`^${filters.stationCode}$`, 'i');
    if (filters.name) query.name = new RegExp(filters.name, 'i');

    const data = await Station.find(query).populate('zoneId divisionId', 'code name').sort(sort).skip(skip).limit(parseInt(limit));
    const total = await Station.countDocuments(query);

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
    const station = await Station.findById(req.params.id).populate('zoneId divisionId');
    if (!station) return res.status(404).json({ error: 'Station not found' });
    res.json(station);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', rbac(ROLES.ADMIN, ROLES.ZONE_ADMIN, ROLES.DIVISION_ADMIN, ROLES.DATA_OPERATOR), async (req, res) => {
  try {
    const validatedData = createSchema.parse(req.body);
    
    // Normalize code
    validatedData.stationCode = StationValidator.normalizeStationCode(validatedData.stationCode);
    
    // Hierarchy validation
    const hierarchyCheck = await HierarchyValidator.validateStationHierarchy(validatedData.divisionId, validatedData.zoneId);
    if (!hierarchyCheck.valid) {
      return res.status(400).json({ error: hierarchyCheck.message });
    }

    // Scope check
    if (req.user?.role === ROLES.ZONE_ADMIN && req.user.zoneId?.toString() !== validatedData.zoneId) {
      return res.status(403).json({ error: 'Out of zone scope' });
    }
    if (req.user?.role === ROLES.DIVISION_ADMIN && req.user.divisionId?.toString() !== validatedData.divisionId) {
      return res.status(403).json({ error: 'Out of division scope' });
    }

    // Temporal overlap validation
    if (validatedData.status === 'ACTIVE' || !validatedData.status) {
      const temporalCheck = await StationValidator.validateTemporalIdentity(
        validatedData.stationCode, 
        validatedData.effectiveFrom, 
        validatedData.effectiveTo
      );
      if (!temporalCheck.valid) {
        return res.status(409).json({ error: temporalCheck.message });
      }
    }

    const newStation = new Station(validatedData);
    await newStation.save();
    
    await logAudit(req, 'CREATE', 'Station', newStation._id, validatedData, 'Initial creation');
    res.status(201).json(newStation);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: error.errors });
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', rbac(ROLES.ADMIN, ROLES.ZONE_ADMIN, ROLES.DIVISION_ADMIN, ROLES.DATA_OPERATOR), async (req, res) => {
  try {
    const validatedData = updateSchema.parse(req.body);
    const station = await Station.findById(req.params.id);
    if (!station) return res.status(404).json({ error: 'Station not found' });

    // Normalize code if provided
    if (validatedData.stationCode) {
      validatedData.stationCode = StationValidator.normalizeStationCode(validatedData.stationCode);
    }

    // Scope checks against existing
    if (req.user?.role === ROLES.ZONE_ADMIN && req.user.zoneId?.toString() !== station.zoneId.toString()) {
      return res.status(403).json({ error: 'Out of zone scope' });
    }
    if (req.user?.role === ROLES.DIVISION_ADMIN && req.user.divisionId?.toString() !== station.divisionId.toString()) {
      return res.status(403).json({ error: 'Out of division scope' });
    }

    const newDivId = validatedData.divisionId || station.divisionId;
    const newZoneId = validatedData.zoneId || station.zoneId;

    if (validatedData.divisionId || validatedData.zoneId) {
      const hierarchyCheck = await HierarchyValidator.validateStationHierarchy(newDivId, newZoneId);
      if (!hierarchyCheck.valid) return res.status(400).json({ error: hierarchyCheck.message });
    }

    // Temporal overlap validation
    const finalCode = validatedData.stationCode || station.stationCode;
    const finalStatus = validatedData.status || station.status;
    const finalFrom = validatedData.effectiveFrom !== undefined ? validatedData.effectiveFrom : station.effectiveFrom;
    const finalTo = validatedData.effectiveTo !== undefined ? validatedData.effectiveTo : station.effectiveTo;

    if (finalStatus === 'ACTIVE') {
      const temporalCheck = await StationValidator.validateTemporalIdentity(
        finalCode, 
        finalFrom, 
        finalTo,
        station._id
      );
      if (!temporalCheck.valid) {
        return res.status(409).json({ error: temporalCheck.message });
      }
    }

    Object.assign(station, validatedData);
    await station.save();

    await logAudit(req, 'UPDATE', 'Station', station._id, validatedData, 'Update operation');
    res.json(station);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: error.errors });
    res.status(500).json({ error: error.message });
  }
});

export default router;
