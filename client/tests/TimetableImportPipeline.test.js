// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { TextTimetableParser } from '../../server/src/services/import/parsers/TextTimetableParser.js';
import { JsonTimetableParser } from '../../server/src/services/import/parsers/JsonTimetableParser.js';
import { PdfTimetableParser } from '../../server/src/services/import/parsers/PdfTimetableParser.js';
import { ImageOcrTimetableParser } from '../../server/src/services/import/parsers/ImageOcrTimetableParser.js';
import { StationMatcher } from '../../server/src/services/import/StationMatcher.js';
import { TimetableValidator } from '../../server/src/services/validation/TimetableValidator.js';
import { TimetableImportPipeline } from '../../server/src/services/import/TimetableImportPipeline.js';
import ImportModal from '../src/components/control-chart/ImportModal.js';
import importApi from '../src/services/importApi.js';

vi.mock('../src/services/importApi.js');

describe('Phase 7A: Real Timetable Import Engine & Pipeline', () => {

  describe('1. TextTimetableParser', () => {
    it('parses structured multiline timetable text accurately', async () => {
      const text = `
12601 CHENNAI CENTRAL - COIMBATORE MAIL
MAS 21:00
KPD 22:15 22:20
JTJ 23:35 23:40
SA 01:40 01:45
ED 03:20 03:25
CBE 05:10
      `;

      const result = await TextTimetableParser.parse(text);
      expect(result.success).toBe(true);
      expect(result.trains.length).toBe(1);

      const train = result.trains[0];
      expect(train.trainNumber).toBe('12601');
      expect(train.trainName).toContain('CHENNAI CENTRAL');
      expect(train.stops.length).toBe(6);

      expect(train.stops[0].stationCode).toBe('MAS');
      expect(train.stops[0].departure).toBe('21:00');
      expect(train.stops[0].dayOffset).toBe(0);

      // Midnight crossing check
      expect(train.stops[3].stationCode).toBe('SA');
      expect(train.stops[3].arrival).toBe('01:40');
      expect(train.stops[3].departure).toBe('01:45');
      expect(train.stops[3].dayOffset).toBe(1);
    });

    it('parses CSV format with headers accurately', async () => {
      const csv = `train_number,train_name,station_code,arr,dep,day_offset
12675,KOVAI SF EXP,MAS,,06:10,0
12675,KOVAI SF EXP,AJJ,07:08,07:10,0
12675,KOVAI SF EXP,KPD,07:53,07:55,0
12675,KOVAI SF EXP,CBE,14:05,,0`;

      const result = await TextTimetableParser.parse(csv);
      expect(result.success).toBe(true);
      expect(result.trains.length).toBe(1);
      expect(result.trains[0].trainNumber).toBe('12675');
      expect(result.trains[0].stops.length).toBe(4);
      expect(result.trains[0].stops[0].stationCode).toBe('MAS');
      expect(result.trains[0].stops[3].stationCode).toBe('CBE');
      expect(result.trains[0].stops[3].arrival).toBe('14:05');
    });
  });

  describe('2. JsonTimetableParser', () => {
    it('validates and parses canonical JSON timetable structure', async () => {
      const json = JSON.stringify({
        trains: [
          {
            trainNumber: "20643",
            trainName: "Vande Bharat Express",
            serviceFrequency: "DAILY",
            stops: [
              { sequence: 1, stationCode: "MAS", departure: "06:00", dayOffset: 0 },
              { sequence: 2, stationCode: "KPD", arrival: "07:13", departure: "07:15", dayOffset: 0 },
              { sequence: 3, stationCode: "CBE", arrival: "11:50", dayOffset: 0 }
            ]
          }
        ]
      });

      const result = await JsonTimetableParser.parse(json);
      expect(result.success).toBe(true);
      expect(result.trains.length).toBe(1);
      expect(result.trains[0].trainNumber).toBe('20643');
      expect(result.trains[0].stops.length).toBe(3);
    });

    it('rejects invalid JSON payloads with informative validation errors', async () => {
      const invalidJson = JSON.stringify({
        trains: [
          {
            trainNumber: "", // Empty train number
            stops: [] // Empty stops
          }
        ]
      });

      const result = await JsonTimetableParser.parse(invalidJson);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('3. PdfTimetableParser & ImageOcrTimetableParser', () => {
    it('extracts tabular timetable patterns from text stream', async () => {
      const pdfTextContent = `
SOUTHERN RAILWAY - CHENNAI DIVISION
TIMETABLE EXTRACT - WEST LINE
22625 CHENNAI CENTRAL - BENGALURU SBC DOUBLE DECKER
MAS 07:25
AJJ 08:23 08:25
KPD 09:10 09:12
JTJ 10:28 10:30
SBC 13:10
`;
      const result = await PdfTimetableParser.parse(pdfTextContent);
      expect(result.success).toBe(true);
      expect(result.trains.length).toBe(1);
      expect(result.trains[0].trainNumber).toBe('22625');
      expect(result.trains[0].stops.length).toBe(5);
    });

    it('preprocesses OCR recognized text lines into structured timetable data', () => {
      const ocrRawText = `
12602 MAIL
MAQ 13:55
ED 22:15 22:20
SA 23:15 23:20
JTJ 01:20 01:25
MAS 05:45
`;
      const parsed = ImageOcrTimetableParser.preprocessAndParseText(ocrRawText, {
        ocrConfidence: 94.5
      });

      expect(parsed.success).toBe(true);
      expect(parsed.trains.length).toBe(1);
      expect(parsed.trains[0].trainNumber).toBe('12602');
      expect(parsed.trains[0].stops.length).toBe(5);
      expect(parsed.extractionMetadata.ocrConfidence).toBe(94.5);
    });
  });

  describe('4. StationMatcher & Topology Reconciliation', () => {
    it('reconciles known station codes and resolves aliases', async () => {
      const match1 = await StationMatcher.matchStation('MAS', 'MGR Chennai Central');
      expect(match1.matchStatus).toBe('MATCHED');
      expect(match1.normalizedStationCode).toBe('MAS');
      expect(match1.confidenceClass).toBe('HIGH_CONFIDENCE');

      const match2 = await StationMatcher.matchStation('KPD', 'Katpadi Junction');
      expect(match2.matchStatus).toBe('MATCHED');
      expect(match2.normalizedStationCode).toBe('KPD');
      expect(match2.confidence).toBeGreaterThanOrEqual(0.95);
    });

    it('flags un-indexed novel stations as NEW_UNKNOWN with non-authoritative tagging', async () => {
      const match = await StationMatcher.matchStation('ZZZZ_CUSTOM', 'Custom Testing Halt');
      expect(match.matchStatus).toBe('NEW_UNKNOWN');
      expect(match.isAuthoritative).toBe(false);
      expect(match.confidenceClass).toBe('LOW_CONFIDENCE');
    });
  });

  describe('5. TimetableValidator & Absolute Progression Calculation', () => {
    it('computes absolute minute progression and validates midnight crossings', () => {
      const rawTrain = {
        trainNumber: '12601',
        trainName: 'Mangalore Mail',
        stops: [
          { sequence: 1, stationCode: 'MAS', departure: '21:00', dayOffset: 0 },
          { sequence: 2, stationCode: 'KPD', arrival: '22:15', departure: '22:20', dayOffset: 0 },
          { sequence: 3, stationCode: 'JTJ', arrival: '23:35', departure: '23:40', dayOffset: 0 },
          { sequence: 4, stationCode: 'SA', arrival: '01:40', departure: '01:45', dayOffset: 0 }, // Unassigned offset -> validator will auto-increment to 1
          { sequence: 5, stationCode: 'CBE', arrival: '05:10', dayOffset: 0 }
        ]
      };

      const { train, report } = TimetableValidator.validateTrain(rawTrain);
      expect(report.valid).toBe(true);
      expect(report.errors.length).toBe(0);

      // Station SA (Salem) at 01:40 must have dayOffset = 1 and absoluteMinutes = 1440 + 100 = 1540
      const salemStop = train.stops.find(s => s.stationCode === 'SA');
      expect(salemStop.dayOffset).toBe(1);
      expect(salemStop.absoluteMinutesArrival).toBe(1440 + 100);
      expect(salemStop.absoluteMinutesDeparture).toBe(1440 + 105);
      expect(salemStop.haltMinutes).toBe(5);
    });

    it('detects chronological errors (arrival after departure at same station)', () => {
      const invalidTrain = {
        trainNumber: '99999',
        trainName: 'Broken Chronology Train',
        stops: [
          { sequence: 1, stationCode: 'MAS', departure: '10:00', dayOffset: 0 },
          { sequence: 2, stationCode: 'KPD', arrival: '11:30', departure: '11:00', dayOffset: 0 } // Dep before Arr
        ]
      };

      const { report } = TimetableValidator.validateTrain(invalidTrain);
      expect(report.valid).toBe(false);
      expect(report.errors.some(e => e.includes('Departure (11:00) cannot be earlier than Arrival (11:30)'))).toBe(true);
    });
  });

  describe('6. TimetableImportPipeline & Isolation Guarantee', () => {
    it('executes full pipeline ingestion and verifies non-authoritative snapshot generation', async () => {
      const rawText = `
20643 MAS-CBE VANDE BHARAT
MAS 06:00
KPD 07:13 07:15
SA 09:18 09:20
ED 10:08 10:10
CBE 11:50
`;

      const result = await TimetableImportPipeline.processImport({
        input: rawText,
        format: 'TEXT',
        sourceType: 'USER_PROVIDED',
        sourceAuthority: 'CONTROLLER_TEST',
        authorityLevel: 'SECONDARY',
        targetType: 'NEW_SCENARIO'
      });

      expect(result.counts.trains).toBe(1);
      expect(result.counts.stops).toBe(5);
      expect(result.errors.length).toBe(0);
      expect(['APPROVED', 'REVIEW_REQUIRED', 'VERIFIED']).toContain(result.status);

      // Canonical structure check
      const train = result.parsedData[0];
      expect(train.trainNumber).toBe('20643');
      expect(train.stops[0].normalizedStationCode).toBe('MAS');
      expect(train.stops[4].normalizedStationCode).toBe('CBE');
    });
  });

  describe('7. ImportModal UI Component', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      cleanup();
    });

    it('renders format tabs [TEXT] [JSON] [PDF] [IMAGE] and input interface', () => {
      render(
        React.createElement(ImportModal, {
          isOpen: true,
          onClose: vi.fn(),
          onPublishToScenario: vi.fn()
        })
      );

      expect(screen.getByText(/TIMETABLE.*RECONCILIATION ENGINE/i)).toBeInTheDocument();
      expect(screen.getByText('TEXT')).toBeInTheDocument();
      expect(screen.getByText('JSON')).toBeInTheDocument();
      expect(screen.getByText('PDF')).toBeInTheDocument();
      expect(screen.getByText('IMAGE')).toBeInTheDocument();
      expect(screen.getByText('Load Valid Southern Railway Corridor Sample')).toBeInTheDocument();
      expect(screen.getByText('▶ PARSE & VALIDATE TIMETABLE')).toBeInTheDocument();
    });

    it('allows tab switching and updates prompt label accordingly', () => {
      render(
        React.createElement(ImportModal, {
          isOpen: true,
          onClose: vi.fn(),
          onPublishToScenario: vi.fn()
        })
      );

      fireEvent.click(screen.getByText('JSON'));
      expect(screen.getByText('Paste JSON Timetable Payload:')).toBeInTheDocument();

      fireEvent.click(screen.getByText('PDF'));
      expect(screen.getByText(/Upload Timetable PDF Document/i)).toBeInTheDocument();
    });

    it('populates sample data on button click', () => {
      render(
        React.createElement(ImportModal, {
          isOpen: true,
          onClose: vi.fn(),
          onPublishToScenario: vi.fn()
        })
      );

      fireEvent.click(screen.getByText('Load Valid Southern Railway Corridor Sample'));
      const textarea = screen.getByPlaceholderText(/Example:/i);
      expect(textarea.value).toContain('12601 CHENNAI CENTRAL');
    });

    it('handles ingestion API integration and displays validation preview report', async () => {
      const mockJobData = {
        importId: 'IMP_TEST_12345',
        status: 'VERIFIED',
        counts: { trains: 1, stations: 3, stops: 3, warnings: 0, errors: 0 },
        warnings: [],
        errors: [],
        parsedData: [
          {
            trainNumber: '12601',
            trainName: 'Mangalore Mail',
            serviceFrequency: 'DAILY',
            stops: [
              {
                sequence: 1,
                originalStationCode: 'MAS',
                normalizedStationCode: 'MAS',
                normalizedStationName: 'MGR Chennai Central',
                departure: '21:00',
                dayOffset: 0,
                absoluteMinutesDeparture: 1260,
                confidence: 1.0,
                confidenceClass: 'HIGH_CONFIDENCE',
                matchStatus: 'MATCHED'
              },
              {
                sequence: 2,
                originalStationCode: 'KPD',
                normalizedStationCode: 'KPD',
                normalizedStationName: 'Katpadi Junction',
                arrival: '22:15',
                departure: '22:20',
                dayOffset: 0,
                absoluteMinutesArrival: 1335,
                absoluteMinutesDeparture: 1340,
                confidence: 1.0,
                confidenceClass: 'HIGH_CONFIDENCE',
                matchStatus: 'MATCHED'
              },
              {
                sequence: 3,
                originalStationCode: 'CBE',
                normalizedStationCode: 'CBE',
                normalizedStationName: 'Coimbatore Junction',
                arrival: '05:10',
                departure: null,
                dayOffset: 1,
                absoluteMinutesArrival: 1750,
                confidence: 1.0,
                confidenceClass: 'HIGH_CONFIDENCE',
                matchStatus: 'MATCHED'
              }
            ]
          }
        ]
      };

      importApi.uploadTimetable.mockResolvedValue({ data: mockJobData });

      render(
        React.createElement(ImportModal, {
          isOpen: true,
          onClose: vi.fn(),
          onPublishToScenario: vi.fn()
        })
      );

      const textarea = screen.getByPlaceholderText(/Example:/i);
      fireEvent.change(textarea, { target: { value: '12601 MAS 21:00\nCBE 05:10' } });
      fireEvent.click(screen.getByText('▶ PARSE & VALIDATE TIMETABLE'));

      await waitFor(() => {
        expect(screen.getByText('IMPORT PREVIEW:')).toBeInTheDocument();
        expect(screen.getByText('ID: IMP_TEST_12345')).toBeInTheDocument();
        expect(screen.getByText('MGR Chennai Central')).toBeInTheDocument();
        expect(screen.getByText(/This import will not modify authoritative railway master data/i)).toBeInTheDocument();
      });

      // Test copy options are visible and functioning
      expect(screen.getByText('📋 Copy Table (TSV)')).toBeInTheDocument();
      expect(screen.getByText('📋 Copy Text')).toBeInTheDocument();
      expect(screen.getByText('📋 Copy JSON')).toBeInTheDocument();
      expect(screen.getByText('📋 Copy Full Report')).toBeInTheDocument();
      expect(screen.getByText('📋 Copy All JSON')).toBeInTheDocument();

      // Mock navigator.clipboard
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock }
      });

      fireEvent.click(screen.getByText('📋 Copy Table (TSV)'));
      expect(writeTextMock).toHaveBeenCalled();
      expect(writeTextMock.mock.calls[0][0]).toContain('MAS\tMGR Chennai Central');

      fireEvent.click(screen.getByText('📋 Copy Text'));
      expect(writeTextMock).toHaveBeenCalledTimes(2);
      expect(writeTextMock.mock.calls[1][0]).toContain('12601 Mangalore Mail');

      fireEvent.click(screen.getByText('📋 Copy Full Report'));
      expect(writeTextMock).toHaveBeenCalledTimes(3);
      expect(writeTextMock.mock.calls[2][0]).toContain('INDIAN RAILWAYS TIMETABLE IMPORT PREVIEW REPORT');
    });
  });
});
