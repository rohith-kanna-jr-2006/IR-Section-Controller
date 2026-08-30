import { Router } from 'express';
import multer from 'multer';
import { TimetableImportPipeline } from '../services/import/TimetableImportPipeline.js';
import { ImportJob } from '../models/ImportJob.js';
import { rbac, ROLES } from '../middleware/rbac.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB maximum
  }
});

const router = Router();

/**
 * POST /api/v1/imports/timetable
 * Ingests and processes raw timetable input (Multipart file or JSON/Text body)
 */
router.post('/timetable', upload.single('file'), rbac(ROLES.ADMIN, ROLES.CONTROLLER, ROLES.ZONE_ADMIN, ROLES.DATA_OPERATOR), async (req, res) => {
  try {
    let input = null;
    let filename = req.file ? req.file.originalname : (req.body.filename || 'pasted_timetable.txt');
    let mimeType = req.file ? req.file.mimetype : undefined;
    let format = req.body.format || 'AUTO';

    if (req.file) {
      input = req.file.buffer;
    } else if (req.body.rawInput) {
      input = req.body.rawInput;
    } else if (req.body.input) {
      input = req.body.input;
    } else if (req.body.trains) {
      input = JSON.stringify(req.body);
      format = 'JSON';
    }

    if (!input) {
      return res.status(400).json({ 
        error: 'No timetable payload provided. Please upload a file or provide text/JSON content.' 
      });
    }

    const {
      sourceType = 'USER_PROVIDED',
      sourceAuthority = 'CONTROLLER_INPUT',
      authorityLevel = 'SECONDARY',
      targetType = 'NEW_SCENARIO',
      targetScenarioId = null,
      targetScenarioName = 'Imported Simulation Schedule'
    } = req.body;

    const job = await TimetableImportPipeline.processImport({
      input,
      format,
      filename,
      mimeType,
      sourceType,
      sourceAuthority,
      authorityLevel,
      targetType,
      targetScenarioId,
      targetScenarioName,
      userId: req.user?.username || 'CONTROLLER'
    });

    res.status(201).json({
      success: true,
      data: job
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/v1/imports/history
 * Returns listing of past import operations
 */
router.get('/history', rbac(ROLES.ADMIN, ROLES.CONTROLLER, ROLES.ZONE_ADMIN, ROLES.DATA_OPERATOR), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const jobs = await ImportJob.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-rawInput -parsedData.stops.issues')
      .lean();

    res.json({
      success: true,
      data: jobs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/imports/:id/preview
 * Retrieves parsed train records, validation details, and preview rows
 */
router.get('/:id/preview', rbac(ROLES.ADMIN, ROLES.CONTROLLER, ROLES.ZONE_ADMIN, ROLES.DATA_OPERATOR), async (req, res) => {
  try {
    const job = await ImportJob.findOne({
      $or: [{ importId: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }]
    });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Import job not found' });
    }

    res.json({
      success: true,
      data: job
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/imports/:id/publish
 * Approves and publishes verified import data into target SimulationScenario / TimetableSnapshot
 */
router.post('/:id/publish', rbac(ROLES.ADMIN, ROLES.CONTROLLER), async (req, res) => {
  try {
    const { targetScenarioId, targetScenarioName } = req.body;
    const result = await TimetableImportPipeline.publishImport(req.params.id, {
      targetScenarioId,
      targetScenarioName,
      userId: req.user?.username || 'CONTROLLER'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/v1/imports/:id/export
 * Exports preview and validation report as JSON or CSV
 */
router.get('/:id/export', rbac(ROLES.ADMIN, ROLES.CONTROLLER, ROLES.ZONE_ADMIN), async (req, res) => {
  try {
    const job = await ImportJob.findOne({
      $or: [{ importId: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }]
    });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Import job not found' });
    }

    const format = (req.query.format || 'json').toLowerCase();

    if (format === 'csv') {
      const rows = ['TrainNumber,TrainName,Sequence,StationCode,StationName,MatchedCode,MatchedName,Arrival,Departure,DayOffset,Confidence,Status'];
      (job.parsedData || []).forEach(train => {
        (train.stops || []).forEach(st => {
          rows.push([
            `"${train.trainNumber}"`,
            `"${train.trainName || ''}"`,
            st.sequence,
            `"${st.originalStationCode || ''}"`,
            `"${st.originalStationName || ''}"`,
            `"${st.normalizedStationCode || ''}"`,
            `"${st.normalizedStationName || ''}"`,
            `"${st.arrival || ''}"`,
            `"${st.departure || ''}"`,
            st.dayOffset || 0,
            st.confidence || 1.0,
            `"${st.matchStatus || 'MATCHED'}"`
          ].join(','));
        });
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${job.importId}_report.csv"`);
      return res.send(rows.join('\n'));
    }

    // Default JSON export
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${job.importId}_report.json"`);
    res.json({
      importId: job.importId,
      format: job.format,
      sourceProvenance: job.sourceProvenance,
      counts: job.counts,
      warnings: job.warnings,
      errors: job.errors,
      trains: job.parsedData
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
