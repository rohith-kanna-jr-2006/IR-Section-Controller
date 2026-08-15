import { Router } from 'express';
import { z } from 'zod';
import { TrainSchedule } from '../models/TrainSchedule.js';
import { TrainStop } from '../models/TrainStop.js';
import { Station } from '../models/Station.js';
import { rbac, ROLES } from '../middleware/rbac.js';
import { logAudit } from '../services/AuditLogger.js';
import { TimetableValidator } from '../services/timetable/TimetableValidator.js';

const router = Router();

const scheduleSchema = z.object({
  trainId: z.string().min(1),
  scheduleCode: z.string().optional(),
  version: z.number().optional(),
  scheduleType: z.string().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BI_WEEKLY', 'SPECIAL', 'SEASONAL', 'EXCEPT_DAYS', 'CUSTOM']),
  operatingDays: z.array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])).optional(),
  validFrom: z.string().optional(), // Date strings
  validTo: z.string().optional(),
  status: z.enum(['ACTIVE', 'PROPOSED', 'HISTORICAL']).optional()
});

const stopSchema = z.object({
  scheduleId: z.string().min(1),
  sequence: z.number(),
  stationId: z.string().min(1),
  stationCode: z.string().min(1),
  arrival: z.string().optional(),
  departure: z.string().optional(),
  dayOffset: z.number().default(0),
  haltMinutes: z.number().optional(),
  platform: z.string().optional(),
  stopType: z.string().optional(),
  remarks: z.string().optional()
});

// GET Schedules for a Train
router.get('/', async (req, res) => {
  try {
    const { trainId, status } = req.query;
    const query = {};
    if (trainId) query.trainId = trainId;
    if (status) query.status = status;
    
    const schedules = await TrainSchedule.find(query).sort('-version');
    res.json({ data: schedules });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new schedule version
router.post('/', rbac(ROLES.ADMIN, ROLES.ZONE_ADMIN, ROLES.DATA_OPERATOR), async (req, res) => {
  try {
    const validatedData = scheduleSchema.parse(req.body);
    const newSchedule = new TrainSchedule(validatedData);
    await newSchedule.save();
    
    await logAudit(req, 'CREATE', 'TrainSchedule', newSchedule._id, validatedData, 'New schedule version');
    res.status(201).json(newSchedule);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: error.errors });
    res.status(500).json({ error: error.message });
  }
});

// GET Stops for a Schedule
router.get('/:scheduleId/stops', async (req, res) => {
  try {
    const stops = await TrainStop.find({ scheduleId: req.params.scheduleId }).sort('sequence').populate('stationId', 'name stationCode');
    res.json({ data: stops });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST multiple stops (batch)
router.post('/:scheduleId/stops', rbac(ROLES.ADMIN, ROLES.ZONE_ADMIN, ROLES.DATA_OPERATOR), async (req, res) => {
  try {
    const scheduleId = req.params.scheduleId;
    const schedule = await TrainSchedule.findById(scheduleId);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

    // Validate Array
    if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Expected an array of stops' });
    const validatedStops = req.body.map(stop => stopSchema.parse({ ...stop, scheduleId }));

    // Run Engine Validation
    const stationIds = validatedStops.map(s => s.stationId);
    const stations = await Station.find({ _id: { $in: stationIds } });
    const stationMap = new Map(stations.map(s => [s._id.toString(), s]));

    const validationResult = TimetableValidator.validateSchedule(schedule, validatedStops, stationMap);
    
    if (!validationResult.valid) {
      return res.status(400).json({ 
        error: 'Timetable validation failed', 
        details: validationResult.errors,
        warnings: validationResult.warnings
      });
    }

    // Insert
    // Delete existing stops for this schedule if we are replacing (Assuming replacement for simplicity)
    await TrainStop.deleteMany({ scheduleId });
    const inserted = await TrainStop.insertMany(validatedStops);
    
    await logAudit(req, 'CREATE', 'TrainStopBatch', schedule._id, { count: inserted.length }, 'Batch inserted stops');

    res.status(201).json({
      data: inserted,
      warnings: validationResult.warnings,
      infos: validationResult.infos
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: error.errors });
    if (error.code === 11000) return res.status(409).json({ error: 'Duplicate sequence' });
    res.status(500).json({ error: error.message });
  }
});

export default router;
