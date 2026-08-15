/**
 * Validates a train schedule and its stops.
 */
export class TimetableValidator {
  
  /**
   * Parse time string HH:mm into absolute minutes from midnight of day 0.
   */
  static normalizeTime(timeStr, dayOffset = 0) {
    if (!timeStr) return null;
    const match = timeStr.match(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/);
    if (!match) return null;
    
    const hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    
    return (dayOffset * 1440) + (hour * 60) + minute;
  }

  static validateSchedule(schedule, stops, existingStations = new Map()) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      infos: []
    };

    const addError = (msg) => { result.errors.push({ code: 'ERROR', message: msg }); result.valid = false; };
    const addWarning = (msg) => { result.warnings.push({ code: 'WARNING', message: msg }); };
    const addInfo = (msg) => { result.infos.push({ code: 'INFO', message: msg }); };

    if (!schedule.trainId) addError('Schedule must reference a train.');
    if (!schedule.frequency) addError('Schedule must have a frequency.');
    
    if (schedule.validFrom && schedule.validTo) {
      if (new Date(schedule.validFrom) > new Date(schedule.validTo)) {
        addError('validFrom cannot be after validTo.');
      }
    }

    if (!stops || stops.length < 2) {
      addError('A schedule must have at least two stops.');
      return result; // Cannot validate route progression
    }

    let previousAbsoluteDeparture = -1;
    let previousSequence = -1;
    const seenSequences = new Set();
    const seenStations = new Set();

    stops.forEach((stop, index) => {
      // 1. Sequence checks
      if (typeof stop.sequence !== 'number') {
        addError(`Stop at index ${index} has missing or invalid sequence.`);
      } else {
        if (seenSequences.has(stop.sequence)) {
          addError(`Duplicate sequence ${stop.sequence} detected.`);
        }
        seenSequences.add(stop.sequence);
        if (stop.sequence <= previousSequence) {
          addError(`Sequence must be strictly increasing. Found ${stop.sequence} after ${previousSequence}.`);
        }
        previousSequence = stop.sequence;
      }

      // 2. Station checks
      if (!stop.stationId) {
        addError(`Stop at sequence ${stop.sequence} is missing stationId.`);
      } else {
        const station = existingStations.get(stop.stationId.toString());
        if (!station) {
          // If we pass in a Map of existing stations, we validate against it.
          // In a full DB context, this would be validated before calling or the caller fetches them.
          addWarning(`Station with ID ${stop.stationId} not verified in provided map.`);
        } else if (station.stationCode !== stop.stationCode) {
          addError(`Station code mismatch at sequence ${stop.sequence}: Expected ${station.stationCode}, got ${stop.stationCode}.`);
        }
      }

      if (seenStations.has(stop.stationId?.toString())) {
        addWarning(`Train visits station ${stop.stationCode || stop.stationId} multiple times.`);
      }
      seenStations.add(stop.stationId?.toString());

      // 3. Time checks
      const isSource = index === 0;
      const isDestination = index === stops.length - 1;

      if (!isSource && !stop.arrival) addError(`Stop at sequence ${stop.sequence} missing arrival time.`);
      if (!isDestination && !stop.departure) addError(`Stop at sequence ${stop.sequence} missing departure time.`);

      let absoluteArrival = null;
      let absoluteDeparture = null;

      if (stop.arrival) {
        absoluteArrival = this.normalizeTime(stop.arrival, stop.dayOffset);
        if (absoluteArrival === null) {
          addError(`Invalid arrival time format '${stop.arrival}' at sequence ${stop.sequence}. Use HH:mm.`);
        }
      }

      if (stop.departure) {
        // Assume departure happens on the same dayOffset unless logic dictates otherwise, 
        // but typically dayOffset is per stop. If a stop crosses midnight during its halt, 
        // the timetable usually provides departure > arrival, which might mean departure dayOffset should be +1 if arrival was 23:50 and dep is 00:10.
        // For simplicity, we use the stop's dayOffset for both, unless it forces a backwards jump, which is an error.
        let depDayOffset = stop.dayOffset;
        let tempDep = this.normalizeTime(stop.departure, depDayOffset);
        
        // If departure < arrival, it means the halt crossed midnight
        if (absoluteArrival !== null && tempDep !== null && tempDep < absoluteArrival) {
          depDayOffset += 1;
          tempDep = this.normalizeTime(stop.departure, depDayOffset);
          addInfo(`Halt at sequence ${stop.sequence} crosses midnight. Adjusted departure day offset to ${depDayOffset}.`);
        }
        
        absoluteDeparture = tempDep;
        if (absoluteDeparture === null) {
          addError(`Invalid departure time format '${stop.departure}' at sequence ${stop.sequence}. Use HH:mm.`);
        }
      }

      // 4. Route progression
      if (absoluteArrival !== null && absoluteDeparture !== null) {
        if (absoluteDeparture < absoluteArrival) {
          addError(`Departure (${stop.departure}) cannot be before arrival (${stop.arrival}) at sequence ${stop.sequence}.`);
        }
      }

      if (previousAbsoluteDeparture !== -1 && absoluteArrival !== null) {
        if (absoluteArrival < previousAbsoluteDeparture) {
          addError(`Arrival at sequence ${stop.sequence} (${stop.arrival}, day ${stop.dayOffset}) is before previous station's departure.`);
        }
      }

      if (absoluteDeparture !== null) {
        previousAbsoluteDeparture = absoluteDeparture;
      } else if (absoluteArrival !== null) {
        previousAbsoluteDeparture = absoluteArrival;
      }
    });

    return result;
  }
}
