# Canonical Train Timetable Specification

## 1. Schema Definition

The canonical timetable representation acts as the single intermediate data contract across all parsers (Text, JSON, PDF, OCR).

```javascript
/**
 * @typedef {Object} CanonicalStop
 * @property {number} sequence - 1-based order index
 * @property {string} originalStationCode - Raw extracted station code
 * @property {string} [originalStationName] - Raw extracted station name
 * @property {string} normalizedStationCode - Reconciled uppercase SR station code
 * @property {string} [normalizedStationName] - Official station name from master database
 * @property {string|null} [matchedStationId] - ID of matched database record
 * @property {'MATCHED'|'REVIEW_REQUIRED'|'CONFLICT'|'NEW_UNKNOWN'} matchStatus - Topology reconciliation state
 * @property {string|null} arrival - "HH:mm" in 24-hour format
 * @property {string|null} departure - "HH:mm" in 24-hour format
 * @property {number} dayOffset - Cumulative day offset (0 for start day, 1 for next day, etc.)
 * @property {number} [absoluteMinutesArrival] - (dayOffset * 1440) + arrival minutes
 * @property {number} [absoluteMinutesDeparture] - (dayOffset * 1440) + departure minutes
 * @property {number} [haltMinutes] - Dwell time in minutes at this stop
 * @property {number} [confidence] - OCR / extraction confidence (0.0 to 1.0)
 * @property {'HIGH_CONFIDENCE'|'MEDIUM_CONFIDENCE'|'LOW_CONFIDENCE'} confidenceClass
 * @property {Array<{ level: 'INFO'|'WARNING'|'ERROR', code: string, message: string }>} [issues]
 */

/**
 * @typedef {Object} CanonicalTrainTimetable
 * @property {string} trainNumber - Unique train number (e.g. "12601", "20643")
 * @property {string} trainName - Service description (e.g. "Chennai Central - Mangalore Mail")
 * @property {'DAILY'|'WEEKLY'|'SPECIFIC_DAYS'} serviceFrequency
 * @property {Array<'MON'|'TUE'|'WED'|'THU'|'FRI'|'SAT'|'SUN'>} serviceDays
 * @property {{ stationCode: string, stationName?: string }} origin
 * @property {{ stationCode: string, stationName?: string }} destination
 * @property {{ sourceType: string, sourceAuthority: string, authorityLevel: string, verificationStatus: string }} sourceProvenance
 * @property {Array<CanonicalStop>} stops
 */
```

---

## 2. Absolute Timeline Rules

1. **24-Hour Representation**: All arrival and departure times must match `/^([01]\d|2[0-3]):([0-5]\d)$/`.
2. **Absolute Minute Formula**:
   $$\text{Absolute Minutes} = (\text{dayOffset} \times 1440) + (\text{Hours} \times 60) + \text{Minutes}$$
3. **Midnight Crossing**: When the current stop's time-of-day is less than the previous stop's exit time-of-day (without explicit user day configuration), `dayOffset` automatically increments by 1.
4. **Duration Calculation**: The journey duration is strictly evaluated using absolute progression minutes:
   $$\text{Total Duration} = \text{Destination Arrival Absolute Minutes} - \text{Origin Departure Absolute Minutes}$$
