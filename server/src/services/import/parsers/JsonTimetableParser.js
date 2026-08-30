import { z } from 'zod';

const StopSchema = z.object({
  sequence: z.number().int().positive().optional(),
  stationCode: z.string().min(1, 'Station code is required'),
  stationName: z.string().optional(),
  arrival: z.string().nullable().optional(),
  departure: z.string().nullable().optional(),
  dayOffset: z.number().int().nonnegative().optional().default(0),
  platform: z.string().optional(),
  haltMinutes: z.number().optional()
});

const TrainSchema = z.object({
  trainNumber: z.string().min(1, 'Train number is required'),
  trainName: z.string().optional().default('Express Service'),
  serviceFrequency: z.enum(['DAILY', 'WEEKLY', 'BI_WEEKLY', 'TRI_WEEKLY', 'SPECIAL', 'CUSTOM']).optional().default('DAILY'),
  serviceDays: z.array(z.string()).optional().default(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
  origin: z.object({
    stationCode: z.string().optional(),
    stationName: z.string().optional()
  }).optional(),
  destination: z.object({
    stationCode: z.string().optional(),
    stationName: z.string().optional()
  }).optional(),
  stops: z.array(StopSchema).min(2, 'Train must contain at least 2 stops')
});

const CanonicalPayloadSchema = z.union([
  z.object({
    trains: z.array(TrainSchema).min(1, 'At least one train must be provided in trains array')
  }),
  z.array(TrainSchema).min(1, 'At least one train must be provided in root array'),
  TrainSchema // Single train object
]);

export class JsonTimetableParser {
  /**
   * Parses and validates raw JSON string or JS object into canonical train timetable structure
   */
  static parse(rawInput) {
    let parsedJson = rawInput;
    if (typeof rawInput === 'string') {
      try {
        parsedJson = JSON.parse(rawInput);
      } catch (err) {
        return {
          success: false,
          trains: [],
          errors: [`JSON Syntax Error: ${err.message}`],
          warnings: []
        };
      }
    }

    const validationResult = CanonicalPayloadSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      const errorDetails = validationResult.error.errors.map(e => `${e.path.join('.') || 'root'}: ${e.message}`);
      return {
        success: false,
        trains: [],
        errors: errorDetails,
        warnings: []
      };
    }

    const validData = validationResult.data;
    let trainList;

    if (Array.isArray(validData)) {
      trainList = validData;
    } else if (validData.trains && Array.isArray(validData.trains)) {
      trainList = validData.trains;
    } else {
      trainList = [validData]; // Single train
    }

    const trains = trainList.map(train => {
      const stops = train.stops.map((st, idx) => ({
        sequence: st.sequence !== undefined ? st.sequence : idx + 1,
        stationCode: (st.stationCode || '').toUpperCase().trim(),
        stationName: st.stationName || st.stationCode,
        originalStationCode: (st.stationCode || '').toUpperCase().trim(),
        originalStationName: st.stationName || st.stationCode,
        normalizedStationCode: (st.stationCode || '').toUpperCase().trim(),
        normalizedStationName: st.stationName || st.stationCode,
        arrival: st.arrival || null,
        departure: st.departure || null,
        dayOffset: st.dayOffset !== undefined ? st.dayOffset : 0,
        platform: st.platform || undefined,
        haltMinutes: st.haltMinutes || undefined,
        confidence: 1.0,
        confidenceClass: 'HIGH_CONFIDENCE'
      }));

      const origin = train.origin || {
        stationCode: stops[0].normalizedStationCode,
        stationName: stops[0].normalizedStationName
      };

      const destination = train.destination || {
        stationCode: stops[stops.length - 1].normalizedStationCode,
        stationName: stops[stops.length - 1].normalizedStationName
      };

      return {
        trainNumber: String(train.trainNumber).toUpperCase().trim(),
        trainName: train.trainName || 'Express Service',
        serviceFrequency: train.serviceFrequency || 'DAILY',
        serviceDays: train.serviceDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        origin,
        destination,
        stops
      };
    });

    return {
      success: true,
      trains,
      warnings: [],
      errors: []
    };
  }
}
