/**
 * Parser for Text and Tabular Timetable inputs
 * Supports standard railway notations, CSV, Tab-separated lines, and plain text.
 */
export class TextTimetableParser {
  /**
   * Main entry point: auto-determines if input is CSV/TSV or free text
   */
  static parse(rawText = '') {
    if (!rawText || typeof rawText !== 'string') return { success: false, trains: [], errors: ['Empty input'] };
    
    const trimmed = rawText.trim();
    if (!trimmed) return { success: false, trains: [], errors: ['Empty input'] };

    const firstLine = trimmed.split('\n')[0] || '';
    const trains = (firstLine.includes(',') || (firstLine.includes('\t') && (firstLine.toLowerCase().includes('train') || firstLine.toLowerCase().includes('station'))))
      ? this.parseCsvText(trimmed)
      : this.parseStructuredText(trimmed);

    return {
      success: trains.length > 0,
      trains,
      warnings: []
    };
  }

  /**
   * Parses structured free-text format e.g.:
   * 12601 CHENNAI MAIL
   * MAS 21:00
   * KPD 22:15 22:20
   * JTJ 23:35 23:40
   * SA 01:40 01:45
   * CBE 05:10
   */
  static parseStructuredText(rawText = '') {
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const trains = [];
    let currentTrain = null;
    let currentDayOffset = 0;
    let lastMinutes = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Discard metadata summary / duration / advisory lines
      // e.g. "4H 35m halts Departs Daily", "4h 35m 21 halts", "Travel Time: 4h 35m", "Avg Speed: 45 km/h"
      if (/^(?:[0-9]+[hH]\s*[0-9]+[mM]|[0-9]+\s*halts|Departs\s+Daily|Travel\s+Time|Avg\s+Speed|Zone:|\bhalts\b|\bdeparts\s+daily\b)/i.test(line)) {
        continue;
      }

      // Match train header e.g. "12601 CHENNAI MAIL" or "TRAIN: 12601 - CHENNAI MAIL" or "11014 / Coimbatore - Mumbai LTT Express"
      const trainHeaderMatch = line.match(/^(?:TRAIN[:\s]+)?([0-9]{4,5}|[A-Z0-9_-]{3,10})(?:\s*[/|:-]\s*|\s+)([A-Za-z0-9\s().\-_]+)?$/i);
      
      // Check if line has HH:MM time patterns or arrival/departure placeholders
      const stopTokens = line.split(/\s+/).filter(Boolean);
      const validTimeTokens = stopTokens.filter(tok => /^([01]\d|2[0-3]):([0-5]\d)$/.test(tok));
      const hasTimePattern = validTimeTokens.length > 0 || stopTokens.some(tok => tok === '--:--');

      if (trainHeaderMatch && !hasTimePattern && !line.match(/^[0-9]{1,3}\s+[A-Z]{2,10}\s+/i)) {
        if (currentTrain && currentTrain.stops.length > 0) {
          this.finalizeTrainStops(currentTrain);
          trains.push(currentTrain);
        }
        currentTrain = {
          trainNumber: trainHeaderMatch[1].trim().toUpperCase(),
          trainName: (trainHeaderMatch[2] || 'Express Service').trim(),
          serviceFrequency: 'DAILY',
          serviceDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          stops: []
        };
        currentDayOffset = 0;
        lastMinutes = -1;
        continue;
      }

      // If no train started yet, create default container
      if (!currentTrain) {
        currentTrain = {
          trainNumber: '56105',
          trainName: 'Passenger Service',
          serviceFrequency: 'DAILY',
          serviceDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          stops: []
        };
      }

      // Parse stop row: [SEQ] CODE [NAME] [ARR] [DEP] [DAY]
      const times = [];
      const nonTimeTokens = [];
      let explicitDay = null;

      // Filter out leading numeric sequence indicator e.g. "1", "01", "1."
      let tokensToProcess = [...stopTokens];
      if (tokensToProcess.length > 2 && /^[0-9]{1,3}\.?$/.test(tokensToProcess[0])) {
        tokensToProcess.shift(); // remove sequence index token
      }

      for (let j = 0; j < tokensToProcess.length; j++) {
        const tok = tokensToProcess[j];
        if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(tok)) {
          times.push(tok);
        } else if (tok === '--:--' || tok === '-' || tok.toLowerCase() === 'starts' || tok.toLowerCase() === 'ends') {
          times.push(null);
        } else if (/^(?:DAY|D|\+)([0-9])$/i.test(tok)) {
          const dMatch = tok.match(/[0-9]/);
          if (dMatch) explicitDay = parseInt(dMatch[0], 10);
        } else if (tok.toUpperCase() === 'DAY' && j + 1 < tokensToProcess.length && /^[0-9]$/.test(tokensToProcess[j + 1])) {
          explicitDay = parseInt(tokensToProcess[j + 1], 10);
          j++; // skip next
        } else if (!/^[0-9]+(?:\.[0-9]+)?(?:km|kms|hr|hrs)?$/i.test(tok) && tok.toLowerCase() !== 'km' && tok.toLowerCase() !== 'kms') {
          // Filter out halt duration tokens (e.g. 1m, 2m, 5m)
          if (!/^[0-9]{1,3}m$/i.test(tok)) {
            nonTimeTokens.push(tok);
          }
        }
      }

      // If there are no real time tokens and both are null/missing, skip as artifact line
      const hasRealTimes = times.some(t => t !== null);
      if (!hasRealTimes && times.length <= 1) {
        continue;
      }

      if (nonTimeTokens.length > 0 && times.length > 0) {
        let rawCode = nonTimeTokens[0].toUpperCase();
        let rawName = nonTimeTokens.slice(1).join(' ') || rawCode;

        // Clean trailing noise like "1m SR", "2m SR", "SR", "SWR" from name
        rawName = rawName
          .replace(/\b\d+\s*m(?:in)?\b/gi, '')
          .replace(/\b(sr|swr|cr|wr|nr|scr|ser|ecr|secr|nwr|nfr|ner|ncr|ecor|wcr|kr)\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim() || rawCode;

        let arrival = null;
        let departure = null;

        if (times.length === 1 && times[0] !== null) {
          if (currentTrain.stops.length === 0) {
            // First stop: single time is Departure
            departure = times[0];
          } else {
            // Intermediate or destination stop
            arrival = times[0];
            departure = times[0]; // assume pass/short halt unless final
          }
        } else if (times.length >= 2) {
          arrival = times[0];
          departure = times[1];
        }

        // Calculate minutes for midnight rollover detection
        const activeTime = arrival || departure;
        if (activeTime) {
          const [h, m] = activeTime.split(':').map(Number);
          const currentMinsInDay = h * 60 + m;

          if (explicitDay !== null) {
            currentDayOffset = explicitDay;
          } else if (lastMinutes !== -1 && currentMinsInDay < (lastMinutes % 1440)) {
            // Midnight crossing! Increments day offset
            currentDayOffset += 1;
          }
          lastMinutes = (currentDayOffset * 1440) + currentMinsInDay;
        }

        const seq = currentTrain.stops.length + 1;
        currentTrain.stops.push({
          sequence: seq,
          stationCode: rawCode,
          stationName: rawName,
          originalStationCode: rawCode,
          originalStationName: rawName,
          normalizedStationCode: rawCode,
          normalizedStationName: rawName,
          arrival,
          departure,
          dayOffset: currentDayOffset,
          confidence: 1.0,
          confidenceClass: 'HIGH_CONFIDENCE'
        });
      }
    }

    if (currentTrain && currentTrain.stops.length > 0) {
      this.finalizeTrainStops(currentTrain);
      trains.push(currentTrain);
    }

    return trains;
  }

  /**
   * Finalizes train stops: ensures origin has departure and destination has arrival,
   * re-numbers sequences 1..N.
   */
  static finalizeTrainStops(train) {
    if (!train || !train.stops || train.stops.length === 0) return;

    // 1. Origin stop adjustment: must have departure time
    const firstStop = train.stops[0];
    if (firstStop.departure === null && firstStop.arrival !== null) {
      firstStop.departure = firstStop.arrival;
      firstStop.arrival = null;
    }

    // 2. Destination stop adjustment: must have arrival time
    if (train.stops.length > 1) {
      const lastStop = train.stops[train.stops.length - 1];
      if (lastStop.arrival === null && lastStop.departure !== null) {
        lastStop.arrival = lastStop.departure;
        lastStop.departure = null;
      }
    }

    // 3. Re-index sequence cleanly
    train.stops.forEach((stop, idx) => {
      stop.sequence = idx + 1;
    });
  }

  /**
   * Parses CSV or Delimited text
   * Header: TrainNo,TrainName,StationCode,StationName,Arrival,Departure,DayOffset
   */
  static parseCsvText(rawText = '') {
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    let headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    let startIdx = 1;

    // Check if first line is a header
    const hasHeader = headers.some(h => h.includes('train') || h.includes('station') || h.includes('arr') || h.includes('dep'));
    if (!hasHeader) {
      // Default standard header mapping
      headers = ['trainno', 'trainname', 'stationcode', 'stationname', 'arrival', 'departure', 'dayoffset'];
      startIdx = 0;
    }

    const trainMap = new Map();

    for (let i = startIdx; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length < 3) continue;

      const row = {};
      headers.forEach((h, idx) => {
        row[h] = cols[idx] !== undefined ? cols[idx] : '';
      });

      const trainNumber = (row.trainno || row.trainnumber || row.train || 'UNKNOWN').toUpperCase();
      const trainName = row.trainname || row.name || 'Express';
      const stationCode = (row.stationcode || row.code || row.stn || cols[2] || '').toUpperCase();
      const stationName = row.stationname || row.stnname || stationCode;
      const arrival = row.arrival || row.arr || row.arrtime || null;
      const departure = row.departure || row.dep || row.deptime || null;
      const dayOffset = parseInt(row.dayoffset || row.day || '0', 10) || 0;

      if (!trainMap.has(trainNumber)) {
        trainMap.set(trainNumber, {
          trainNumber,
          trainName,
          serviceFrequency: 'DAILY',
          serviceDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          stops: []
        });
      }

      const train = trainMap.get(trainNumber);
      train.stops.push({
        sequence: train.stops.length + 1,
        stationCode,
        stationName,
        originalStationCode: stationCode,
        originalStationName: stationName,
        normalizedStationCode: stationCode,
        normalizedStationName: stationName,
        arrival: arrival && arrival !== '-' ? arrival : null,
        departure: departure && departure !== '-' ? departure : null,
        dayOffset,
        confidence: 1.0,
        confidenceClass: 'HIGH_CONFIDENCE'
      });
    }

    const allTrains = Array.from(trainMap.values());
    allTrains.forEach(t => this.finalizeTrainStops(t));
    return allTrains;
  }
}
