export class TimetableValidator {
  /**
   * Converts HH:mm time string and dayOffset (0, 1, 2...) into total absolute minutes.
   * Day 0: 00:00 -> 0, 23:59 -> 1439
   * Day 1: 00:00 -> 1440, 05:00 -> 1740
   */
  static getAbsoluteMinutes(timeStr, dayOffset = 0) {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const parts = timeStr.trim().split(':');
    if (parts.length !== 2) return null;
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }
    const safeOffset = isNaN(Number(dayOffset)) ? 0 : Number(dayOffset);
    return (safeOffset * 1440) + (hours * 60) + minutes;
  }

  /**
   * Validates a time string format (HH:mm in 24-hour clock)
   */
  static isValidTimeFormat(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return false;
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(timeStr.trim());
  }

  /**
   * Validates arrival and departure times for a single stop
   */
  static validateStopTimes(arrival, departure, dayOffset = 0, isOrigin = false, isDestination = false) {
    const issues = [];
    
    // Check format
    if (arrival && !this.isValidTimeFormat(arrival)) {
      issues.push({ 
        level: 'ERROR', 
        code: 'INVALID_ARRIVAL_FORMAT', 
        message: `Invalid arrival time format "${arrival}". Expected HH:mm in 24-hour time.` 
      });
    }

    if (departure && !this.isValidTimeFormat(departure)) {
      issues.push({ 
        level: 'ERROR', 
        code: 'INVALID_DEPARTURE_FORMAT', 
        message: `Invalid departure time format "${departure}". Expected HH:mm in 24-hour time.` 
      });
    }

    const arrMin = this.getAbsoluteMinutes(arrival, dayOffset);
    const depMin = this.getAbsoluteMinutes(departure, dayOffset);

    if (isOrigin && !departure) {
      issues.push({ 
        level: 'ERROR', 
        code: 'MISSING_ORIGIN_DEPARTURE', 
        message: 'Origin stop must specify a departure time' 
      });
    }

    if (isDestination && !arrival) {
      issues.push({ 
        level: 'ERROR', 
        code: 'MISSING_DESTINATION_ARRIVAL', 
        message: 'Destination stop must specify an arrival time' 
      });
    }

    if (!isOrigin && !isDestination && !arrival && !departure) {
      issues.push({ 
        level: 'ERROR', 
        code: 'MISSING_TIMES', 
        message: 'Stop must specify at least an arrival or departure time' 
      });
    }

    // Departure precedes arrival check
    if (arrMin !== null && depMin !== null) {
      if (depMin < arrMin) {
        issues.push({ 
          level: 'ERROR', 
          code: 'DEPARTURE_PRECEDES_ARRIVAL', 
          message: `Departure (${departure}) cannot be earlier than Arrival (${arrival}) on day offset ${dayOffset}` 
        });
      }

      const halt = depMin - arrMin;
      if (halt > 180) {
        issues.push({ 
          level: 'WARNING', 
          code: 'LONG_HALT', 
          message: `Unusually long halt duration of ${halt} minutes (${Math.floor(halt/60)}h ${halt%60}m)` 
        });
      }
    }

    return issues;
  }

  /**
   * Validates chronological absolute progression across stops
   */
  static validateProgression(stops = []) {
    const issues = [];
    let previousPointMinutes = -1;

    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      const seq = stop.sequence;

      if (i > 0) {
        const prevStop = stops[i - 1];
        if (seq <= prevStop.sequence) {
          issues.push({
            level: 'ERROR',
            code: 'INVALID_SEQUENCE',
            message: `Duplicate or non-increasing sequence number at stop sequence ${seq} (follows sequence ${prevStop.sequence})`
          });
        }
      }

      const arrMin = this.getAbsoluteMinutes(stop.arrival, stop.dayOffset);
      const depMin = this.getAbsoluteMinutes(stop.departure, stop.dayOffset);
      const entryTime = arrMin !== null ? arrMin : depMin;
      const exitTime = depMin !== null ? depMin : arrMin;

      if (entryTime !== null) {
        if (entryTime < previousPointMinutes) {
          issues.push({
            level: 'ERROR',
            code: 'CHRONOLOGICAL_REGRESSION',
            message: `Impossible chronological progression at stop ${stop.normalizedStationCode || stop.stationCode || seq}: ` +
                     `Time (${stop.arrival || stop.departure}, Day ${stop.dayOffset}) is earlier than previous station exit (${previousPointMinutes} abs min).`
          });
        }
        previousPointMinutes = exitTime !== null ? exitTime : entryTime;
      }
    }

    return issues;
  }

  /**
   * Validates an entire canonical train timetable structure
   */
  static validateTrain(train) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      infos: [],
      reviewRequired: false
    };

    if (!train.trainNumber || !String(train.trainNumber).trim()) {
      result.valid = false;
      result.errors.push('Train number is missing or empty');
    }

    if (!train.stops || !Array.isArray(train.stops) || train.stops.length < 2) {
      result.valid = false;
      result.errors.push('Train must have at least 2 stops (origin and destination)');
      return result;
    }

    // Sort stops by sequence
    const sortedStops = [...train.stops].map(s => ({ ...s })).sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

    // Auto-resolve dayOffsets and absolute minutes first
    let runningMinutes = -1;
    let runningDayOffset = 0;

    sortedStops.forEach((stop) => {
      const activeTime = stop.arrival || stop.departure;
      if (activeTime) {
        const [h, m] = activeTime.split(':').map(Number);
        const minsInDay = h * 60 + m;

        if (stop.dayOffset !== undefined && stop.dayOffset !== null && stop.dayOffset !== 0) {
          runningDayOffset = Number(stop.dayOffset);
        } else if (runningMinutes !== -1 && minsInDay < (runningMinutes % 1440)) {
          runningDayOffset += 1;
        }
        stop.dayOffset = runningDayOffset;

        if (stop.arrival) {
          const [ah, am] = stop.arrival.split(':').map(Number);
          stop.absoluteMinutesArrival = (stop.dayOffset * 1440) + (ah * 60) + am;
        }
        if (stop.departure) {
          const [dh, dm] = stop.departure.split(':').map(Number);
          stop.absoluteMinutesDeparture = (stop.dayOffset * 1440) + (dh * 60) + dm;
        }
        if (stop.absoluteMinutesArrival !== undefined && stop.absoluteMinutesDeparture !== undefined) {
          stop.haltMinutes = stop.absoluteMinutesDeparture - stop.absoluteMinutesArrival;
        }

        runningMinutes = stop.absoluteMinutesDeparture || stop.absoluteMinutesArrival || (runningDayOffset * 1440 + minsInDay);
      }
    });

    // Check progression
    const progIssues = this.validateProgression(sortedStops);
    progIssues.forEach(iss => {
      if (iss.level === 'ERROR') {
        result.valid = false;
        result.errors.push(iss.message);
      } else if (iss.level === 'WARNING') {
        result.warnings.push(iss.message);
      }
    });

    // Validate individual stops
    const totalStops = sortedStops.length;
    sortedStops.forEach((stop, idx) => {
      const isOrigin = idx === 0;
      const isDestination = idx === totalStops - 1;

      const stopIssues = this.validateStopTimes(
        stop.arrival, 
        stop.departure, 
        stop.dayOffset || 0,
        isOrigin,
        isDestination
      );

      stopIssues.forEach(iss => {
        const prefix = `[Stop ${stop.sequence || idx + 1}: ${stop.normalizedStationCode || stop.stationCode || 'UNKNOWN'}] `;
        if (iss.level === 'ERROR') {
          result.valid = false;
          result.errors.push(prefix + iss.message);
        } else if (iss.level === 'WARNING') {
          result.warnings.push(prefix + iss.message);
        }
      });

      // Check match status
      if (stop.matchStatus === 'NEW_UNKNOWN') {
        result.valid = false;
        result.errors.push(`[Stop ${stop.sequence}] Unknown station code "${stop.originalStationCode || stop.stationCode}"`);
      } else if (stop.matchStatus === 'REVIEW_REQUIRED' || stop.matchStatus === 'CONFLICT') {
        result.reviewRequired = true;
        result.warnings.push(`[Stop ${stop.sequence}] Station "${stop.originalStationCode}" requires human verification (${stop.matchStatus})`);
      }

      // Check OCR confidence if present
      if (stop.confidence !== undefined && stop.confidence < 0.80) {
        result.reviewRequired = true;
        result.warnings.push(`[Stop ${stop.sequence}] Low OCR confidence (${Math.round(stop.confidence * 100)}%) on station ${stop.normalizedStationCode || stop.originalStationCode}`);
      }
    });

    const enrichedTrain = {
      ...train,
      stops: sortedStops
    };

    result.train = enrichedTrain;
    result.report = result;

    return result;
  }
}
