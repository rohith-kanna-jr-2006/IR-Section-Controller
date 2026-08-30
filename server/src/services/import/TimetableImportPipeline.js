import mongoose from 'mongoose';
import { TextTimetableParser } from './parsers/TextTimetableParser.js';
import { JsonTimetableParser } from './parsers/JsonTimetableParser.js';
import { PdfTimetableParser } from './parsers/PdfTimetableParser.js';
import { ImageOcrTimetableParser } from './parsers/ImageOcrTimetableParser.js';
import { StationMatcher } from './StationMatcher.js';
import { TimetableValidator } from '../validation/TimetableValidator.js';
import { ImportJob } from '../../models/ImportJob.js';
import { SimulationScenario } from '../../models/operations/SimulationScenario.js';
import { TimetableSnapshot } from '../../models/operations/TimetableSnapshot.js';
import { logAudit, AuditLogger } from '../AuditLogger.js';

export class TimetableImportPipeline {
  /**
   * Auto-detects input format from raw content, filename, or mimeType
   */
  static detectFormat(input, filename = '', mimeType = '') {
    if (filename.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf') {
      return 'PDF';
    }
    if (filename.match(/\.(png|jpg|jpeg|webp)$/i) || (mimeType && mimeType.startsWith('image/'))) {
      return 'IMAGE';
    }
    if (filename.toLowerCase().endsWith('.json') || mimeType === 'application/json') {
      return 'JSON';
    }

    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          JSON.parse(trimmed);
          return 'JSON';
        } catch {
          // not valid json, treat as text
        }
      }
      if (trimmed.startsWith('data:application/pdf')) return 'PDF';
      if (trimmed.startsWith('data:image/')) return 'IMAGE';
      return 'TEXT';
    }

    if (Buffer.isBuffer(input)) {
      const magic5 = input.slice(0, 5).toString('ascii');
      if (magic5.startsWith('%PDF')) return 'PDF';
      if (input[0] === 0x89 && input[1] === 0x50) return 'IMAGE';
      if (input[0] === 0xFF && input[1] === 0xD8) return 'IMAGE';
    }

    return 'TEXT';
  }

  /**
   * Runs the complete parsing, station matching, and validation pipeline on raw input
   */
  static async processImport({
    input,
    format = 'AUTO',
    filename = 'timetable_upload',
    sourceType = 'USER_PROVIDED',
    sourceAuthority = 'CONTROLLER_INPUT',
    authorityLevel = 'SECONDARY',
    targetType = 'NEW_SCENARIO',
    targetScenarioId = null,
    targetScenarioName = 'Imported Timetable Scenario',
    userId = 'CONTROLLER'
  }) {
    // 1. Format Detection
    let resolvedFormat = format;
    if (!resolvedFormat || resolvedFormat === 'AUTO') {
      resolvedFormat = this.detectFormat(input, filename);
    }

    const importId = `IMP_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create Initial ImportJob Record
    const job = new ImportJob({
      importId,
      format: resolvedFormat,
      filename,
      status: 'PARSING',
      sourceProvenance: {
        sourceType,
        sourceAuthority,
        authorityLevel,
        verificationStatus: 'NOT VERIFIED'
      },
      targetType,
      targetScenarioId,
      targetScenarioName,
      rawInput: typeof input === 'string' && input.length < 50000 ? input : `[Binary ${resolvedFormat} Data]`,
      createdBy: userId
    });

    try {
      // 2. Parse Phase
      let rawTrains = [];
      let parserWarnings = [];

      if (resolvedFormat === 'JSON') {
        const jsonResult = JsonTimetableParser.parse(input);
        rawTrains = jsonResult.trains || [];
        if (jsonResult.errors && jsonResult.errors.length > 0) {
          parserWarnings.push(...jsonResult.errors);
        }
      } else if (resolvedFormat === 'PDF') {
        const pdfResult = await PdfTimetableParser.parse(input, { sourceType });
        rawTrains = pdfResult.trains || [];
        if (pdfResult.warnings) parserWarnings.push(...pdfResult.warnings);
        if (pdfResult.sourceType) job.sourceProvenance.sourceType = pdfResult.sourceType;
        if (pdfResult.verificationStatus) job.sourceProvenance.verificationStatus = pdfResult.verificationStatus;
      } else if (resolvedFormat === 'IMAGE') {
        const imgResult = await ImageOcrTimetableParser.parse(input, { sourceType });
        rawTrains = imgResult.trains || [];
        if (imgResult.warnings) parserWarnings.push(...imgResult.warnings);
        job.sourceProvenance.sourceType = 'OCR_EXTRACTED';
        job.sourceProvenance.verificationStatus = 'REVIEW_REQUIRED';
      } else {
        // TEXT or CSV
        const textResult = TextTimetableParser.parse(typeof input === 'string' ? input : input.toString('utf8'));
        rawTrains = textResult.trains || [];
        if (textResult.warnings) parserWarnings.push(...textResult.warnings);
      }

      if (!rawTrains || rawTrains.length === 0) {
        throw new Error(`Failed to parse any train timetable records from the provided ${resolvedFormat} input.`);
      }

      // 3. Normalization & Station Matching Phase
      job.status = 'MATCHING';
      const stationMatcher = new StationMatcher();
      await stationMatcher.init();

      const normalizedTrains = [];
      const distinctStationCodes = new Set();
      let totalStopsCount = 0;
      let validStopsCount = 0;
      let reviewRequiredCount = 0;
      const allErrors = [];
      const allWarnings = [...parserWarnings];

      for (const rawTrain of rawTrains) {
        const processedStops = [];

        for (let sIdx = 0; sIdx < (rawTrain.stops || []).length; sIdx++) {
          totalStopsCount++;
          const rawStop = rawTrain.stops[sIdx];
          const seq = rawStop.sequence !== undefined ? rawStop.sequence : sIdx + 1;
          const matchResult = stationMatcher.match(
            rawStop.originalStationCode || rawStop.stationCode || rawStop.normalizedStationCode,
            rawStop.originalStationName || rawStop.stationName || rawStop.normalizedStationName
          );

          if (matchResult.issues) {
            matchResult.issues.forEach(iss => {
              const msg = `[Train ${rawTrain.trainNumber} - Stop ${seq}] ${iss.message}`;
              if (iss.level === 'ERROR') allErrors.push(msg);
              else if (iss.level === 'WARNING') allWarnings.push(msg);
            });
          }

          if (matchResult.matchStatus === 'REVIEW_REQUIRED' || matchResult.matchStatus === 'CONFLICT') {
            reviewRequiredCount++;
          }

          distinctStationCodes.add(matchResult.normalizedStationCode);

          const processedStop = {
            sequence: seq,
            originalStationCode: matchResult.originalStationCode,
            originalStationName: matchResult.originalStationName,
            normalizedStationCode: matchResult.normalizedStationCode,
            normalizedStationName: matchResult.normalizedStationName,
            matchedStationId: matchResult.matchedStationId,
            matchStatus: matchResult.matchStatus,
            isSameStationCode: matchResult.isSameStationCode,
            stationCodeCheck: matchResult.stationCodeCheck,
            arrival: rawStop.arrival || null,
            departure: rawStop.departure || null,
            dayOffset: rawStop.dayOffset !== undefined ? rawStop.dayOffset : 0,
            confidence: rawStop.confidence !== undefined ? rawStop.confidence : 1.0,
            confidenceClass: rawStop.confidenceClass || 'HIGH_CONFIDENCE',
            platform: rawStop.platform || undefined,
            haltMinutes: rawStop.haltMinutes || undefined,
            issues: matchResult.issues || []
          };

          // Calculate absolute minutes
          processedStop.absoluteMinutesArrival = TimetableValidator.getAbsoluteMinutes(processedStop.arrival, processedStop.dayOffset);
          processedStop.absoluteMinutesDeparture = TimetableValidator.getAbsoluteMinutes(processedStop.departure, processedStop.dayOffset);

          processedStops.push(processedStop);
        }

        const canonicalTrain = {
          trainNumber: String(rawTrain.trainNumber).toUpperCase().trim(),
          trainName: rawTrain.trainName || 'Express Service',
          serviceFrequency: rawTrain.serviceFrequency || 'DAILY',
          serviceDays: rawTrain.serviceDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          origin: rawTrain.origin || {
            stationCode: processedStops[0]?.normalizedStationCode || 'UNKNOWN',
            stationName: processedStops[0]?.normalizedStationName || 'Unknown Origin'
          },
          destination: rawTrain.destination || {
            stationCode: processedStops[processedStops.length - 1]?.normalizedStationCode || 'UNKNOWN',
            stationName: processedStops[processedStops.length - 1]?.normalizedStationName || 'Unknown Destination'
          },
          sourceProvenance: {
            sourceType: job.sourceProvenance.sourceType,
            sourceAuthority: job.sourceProvenance.sourceAuthority,
            authorityLevel: job.sourceProvenance.authorityLevel,
            verificationStatus: job.sourceProvenance.verificationStatus
          },
          stops: processedStops
        };

        // 4. Timetable Validation Phase
        job.status = 'VALIDATING';
        const trainValResult = TimetableValidator.validateTrain(canonicalTrain);
        if (!trainValResult.valid) {
          allErrors.push(...trainValResult.errors.map(e => `[Train ${canonicalTrain.trainNumber}] ${e}`));
        } else {
          validStopsCount += processedStops.length;
        }

        if (trainValResult.warnings) {
          allWarnings.push(...trainValResult.warnings.map(w => `[Train ${canonicalTrain.trainNumber}] ${w}`));
        }

        if (trainValResult.reviewRequired) {
          reviewRequiredCount++;
        }

        normalizedTrains.push(canonicalTrain);
      }

      // 5. Final Classification & State Assignment
      const hasErrors = allErrors.length > 0;
      const isOcr = job.sourceProvenance.sourceType === 'OCR_EXTRACTED';
      const needsReview = hasErrors || reviewRequiredCount > 0 || isOcr || allWarnings.length > 0;

      job.status = hasErrors ? 'FAILED' : (needsReview ? 'REVIEW_REQUIRED' : 'APPROVED');
      job.parsedData = normalizedTrains;
      job.counts = {
        trains: normalizedTrains.length,
        stations: distinctStationCodes.size,
        stops: totalStopsCount,
        validStops: validStopsCount,
        warnings: allWarnings.length,
        errors: allErrors.length,
        reviewRequired: reviewRequiredCount
      };
      job.warnings = allWarnings;
      job.errors = allErrors;

      try {
        if (mongoose.connection && mongoose.connection.readyState === 1) {
          await job.save();

          // Log Audit Event
          await logAudit(
            { user: { _id: userId } },
            'TIMETABLE_IMPORT_PROCESSED',
            'ImportJob',
            job._id,
            {
              importId,
              format: resolvedFormat,
              sourceType: job.sourceProvenance.sourceType,
              trainCount: normalizedTrains.length,
              errorsCount: allErrors.length,
              warningsCount: allWarnings.length
            },
            hasErrors ? 'FAILURE' : 'SUCCESS'
          );
        }
      } catch (dbErr) {
        // In offline / unit-test environments without active Mongo connection
        // continue returning the populated in-memory job object
      }

      return job;
    } catch (err) {
      job.status = 'FAILED';
      job.errors = [err.message];
      try {
        if (mongoose.connection && mongoose.connection.readyState === 1) {
          await job.save();
        }
      } catch (dbErr) {
        // In offline environments
      }
      throw err;
    }
  }

  /**
   * Publishes an approved import job exclusively into a SimulationScenario / TimetableSnapshot.
   * GUARANTEE: Does NOT mutate authoritative Station, Section, Train, TrainSchedule, or TrainStop tables.
   */
  static async publishImport(importId, { targetScenarioId, targetScenarioName, userId = 'CONTROLLER' }) {
    const job = await ImportJob.findOne({ importId });
    if (!job) {
      throw new Error(`Import job "${importId}" not found`);
    }

    if (job.errors && job.errors.length > 0) {
      throw new Error(`Cannot publish import job with ${job.errors.length} unresolved errors. Publish blocked.`);
    }

    if (!job.parsedData || job.parsedData.length === 0) {
      throw new Error('No parsed train data available in this import job');
    }

    const snapshotId = `TTS_IMP_${Date.now()}`;
    const scheduleHash = `HASH_${importId}_${Date.now()}`;

    // 1. Create TimetableSnapshot (Isolated snapshot container)
    const snapshot = new TimetableSnapshot({
      timetableSnapshotId: snapshotId,
      sourceType: job.sourceProvenance.sourceType || 'USER_PROVIDED',
      sourceId: importId,
      dataVersionId: `DV_IMP_${Date.now()}`,
      scheduleHash,
      schedules: job.parsedData.map(train => ({
        trainNumber: train.trainNumber,
        trainName: train.trainName,
        serviceFrequency: train.serviceFrequency,
        serviceDays: train.serviceDays,
        originStationCode: train.origin?.stationCode,
        destinationStationCode: train.destination?.stationCode,
        stops: train.stops
      })),
      trains: job.parsedData,
      metadata: {
        importId: job.importId,
        format: job.format,
        importedAt: new Date(),
        importedBy: userId,
        counts: job.counts
      },
      verificationStatus: job.sourceProvenance.verificationStatus || 'VERIFIED'
    });
    await snapshot.save();

    // 2. Resolve Target SimulationScenario (or create isolated new scenario)
    let scenario = null;
    if (targetScenarioId && targetScenarioId !== 'NEW_SCENARIO') {
      scenario = await SimulationScenario.findOne({
        $or: [{ scenarioId: targetScenarioId }, { _id: targetScenarioId.match(/^[0-9a-fA-F]{24}$/) ? targetScenarioId : null }]
      });
    }

    if (!scenario) {
      const scenarioId = `SCN_IMP_${Date.now()}`;
      scenario = new SimulationScenario({
        scenarioId,
        name: targetScenarioName || `Imported Corridor Schedule (${job.format})`,
        randomSeed: Math.floor(Math.random() * 1000000),
        simulationClockTime: new Date('2026-08-30T06:00:00.000Z'),
        status: 'READY',
        sourceType: 'SIMULATED',
        timetableSnapshotId: snapshot._id
      });
      await scenario.save();
    } else {
      scenario.timetableSnapshotId = snapshot._id;
      scenario.status = 'READY';
      await scenario.save();
    }

    // 3. Mark ImportJob as PUBLISHED
    job.status = 'PUBLISHED';
    job.publishedSnapshotId = snapshot.timetableSnapshotId;
    job.publishedAt = new Date();
    job.targetScenarioId = scenario.scenarioId;
    job.targetScenarioName = scenario.name;
    await job.save();

    // 4. Record Audit Log
    await AuditLogger.log({
      action: 'TIMETABLE_IMPORT_PUBLISHED',
      entityType: 'SimulationScenario',
      entityId: scenario._id,
      user: userId,
      status: 'SUCCESS',
      metadata: {
        importId: job.importId,
        targetScenarioId: scenario.scenarioId,
        snapshotId: snapshot.timetableSnapshotId,
        trainCount: job.counts.trains,
        authoritativeMasterModified: false
      }
    });

    return {
      success: true,
      importId: job.importId,
      status: 'PUBLISHED',
      targetScenarioId: scenario.scenarioId,
      targetScenarioName: scenario.name,
      publishedSnapshotId: snapshot.timetableSnapshotId,
      trainsCount: job.counts.trains,
      authoritativeWrites: 0
    };
  }
}
