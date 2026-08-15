export class TimetableValidator {
  /**
   * Converts HH:mm and dayOffset to absolute minutes.
   */
  static getAbsoluteMinutes(timeStr, dayOffset = 0) {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null; // Invalid time
    }
    return (dayOffset * 1440) + (hours * 60) + minutes;
  }

  /**
   * Validates a single stop's arrival and departure for consistency.
   */
  static validateStopTimes(arrival, departure, dayOffset) {
    const arrMin = this.getAbsoluteMinutes(arrival, dayOffset);
    const depMin = this.getAbsoluteMinutes(departure, dayOffset);

    const issues = [];
    if (arrival && arrMin === null) issues.push({ level: 'ERROR', message: 'Invalid arrival time format' });
    if (departure && depMin === null) issues.push({ level: 'ERROR', message: 'Invalid departure time format' });
    
    if (arrMin !== null && depMin !== null) {
      if (depMin < arrMin) {
        issues.push({ level: 'ERROR', message: 'Departure cannot be before arrival' });
      }
      if (depMin - arrMin > 180) { // arbitrary warning for long halt > 3 hours
        issues.push({ level: 'WARNING', message: 'Unusually long halt time' });
      }
    }
    
    if (!arrival && !departure) {
      issues.push({ level: 'ERROR', message: 'Stop must have either arrival or departure' });
    }

    return issues;
  }

  /**
   * Validates chronological progression across multiple stops.
   * Expected: stops array sorted by sequence.
   */
  static validateProgression(stops) {
    const issues = [];
    let lastMin = -1;

    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      const arrMin = this.getAbsoluteMinutes(stop.arrival, stop.dayOffset);
      const depMin = this.getAbsoluteMinutes(stop.departure, stop.dayOffset);

      if (i > 0) {
        const prevStop = stops[i - 1];
        if (stop.sequence <= prevStop.sequence) {
          issues.push({ level: 'ERROR', message: `Duplicate or reversed sequence at stop ${stop.sequence}` });
        }
      }

      const activeMin = arrMin !== null ? arrMin : depMin;
      if (activeMin !== null) {
        if (activeMin < lastMin) {
          issues.push({ level: 'ERROR', message: `Impossible chronological progression at stop ${stop.sequence}` });
        }
        lastMin = depMin !== null ? depMin : activeMin;
      }
    }
    
    return issues;
  }

  /**
   * Validates an entire schedule and its stops
   */
  static validateSchedule(schedule, stops, stationMap) {
    const result = { valid: true, errors: [], warnings: [], infos: [] };
    
    // Sort stops by sequence
    stops.sort((a, b) => a.sequence - b.sequence);

    // Validate progression
    const progIssues = this.validateProgression(stops);
    progIssues.forEach(i => {
      if (i.level === 'ERROR') { result.valid = false; result.errors.push(i.message); }
      if (i.level === 'WARNING') result.warnings.push(i.message);
      if (i.level === 'INFO') result.infos.push(i.message);
    });

    // Validate individual stops
    stops.forEach(stop => {
      if (!stationMap.has(stop.stationId.toString())) {
        result.valid = false;
        result.errors.push(`Station ${stop.stationId} does not exist`);
      }
      
      const stopIssues = this.validateStopTimes(stop.arrival, stop.departure, stop.dayOffset);
      stopIssues.forEach(i => {
        const msg = `[Seq ${stop.sequence}] ${i.message}`;
        if (i.level === 'ERROR') { result.valid = false; result.errors.push(msg); }
        if (i.level === 'WARNING') result.warnings.push(msg);
        if (i.level === 'INFO') result.infos.push(msg);
      });
      
      // Calculate and set absolute minutes
      stop.absoluteMinutesArrival = this.getAbsoluteMinutes(stop.arrival, stop.dayOffset);
      stop.absoluteMinutesDeparture = this.getAbsoluteMinutes(stop.departure, stop.dayOffset);
    });

    // Check authority
    if (schedule.authorityLevel === 'SECONDARY_REFERENCE') {
      result.warnings.push('Secondary source timetable should not be published as authoritative');
    }

    return result;
  }
}
