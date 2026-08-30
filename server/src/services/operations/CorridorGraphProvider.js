import { SR_DIVISIONS_MAP, parseSectionStations } from '../../config/srSectionsData.js';

// Station coordinate and junction metadata
const JUNCTION_CODES = new Set([
  'MAS', 'AJJ', 'KPD', 'JTJ', 'SA', 'ED', 'CBE', 'TPJ', 'VM', 'GDR',
  'MS', 'CGL', 'DG', 'MDU', 'TEN', 'QLN', 'SRR', 'PGT', 'TVC', 'ERS',
  'ERN', 'TCR', 'AWY', 'KYJ', 'NCJ', 'CAPE', 'VRI', 'MV', 'TJ', 'TVR',
  'KKDI', 'MNM', 'VPT', 'MEJ', 'TSI', 'SCT', 'POY', 'CUPJ', 'WJR'
]);

const TERMINAL_CODES = new Set([
  'MAS', 'MS', 'MSB', 'VLCY', 'CBE', 'TVC', 'CAPE', 'MAQ', 'RMM', 'TCN', 'GDR', 'SBC', 'NDLS', 'HWH', 'CSMT'
]);

/**
 * CorridorGraphProvider
 * 
 * Provides deterministic topology, block sections, timetable schedules,
 * train stringlines, section occupancies, and operational conflicts for any
 * selected Indian Railways corridor.
 */
export class CorridorGraphProvider {
  /**
   * Resolves the station sequence for the requested corridor/route/division
   */
  static getCorridorStations(divisionCode = 'MAS', routeName = 'West Line (MAS-JTJ)') {
    let divData = SR_DIVISIONS_MAP[divisionCode] || SR_DIVISIONS_MAP['MAS'];
    let rawText = divData?.sections?.[routeName];

    if (!rawText) {
      // Find route across all divisions
      for (const [dCode, dData] of Object.entries(SR_DIVISIONS_MAP)) {
        if (dData.sections[routeName]) {
          rawText = dData.sections[routeName];
          divisionCode = dCode;
          break;
        }
      }
    }

    // Default fallback to West Line
    if (!rawText) {
      divData = SR_DIVISIONS_MAP['MAS'];
      routeName = 'West Line (MAS-JTJ)';
      rawText = divData.sections[routeName];
      divisionCode = 'MAS';
    }

    const parsed = parseSectionStations(rawText);
    let cumulativeKm = 0;

    return parsed.map((st, idx) => {
      const isJct = JUNCTION_CODES.has(st.stationCode);
      const isTerm = TERMINAL_CODES.has(st.stationCode);
      const distFromPrev = st.distanceKm !== null ? (st.distanceKm - (idx > 0 && parsed[idx - 1].distanceKm !== null ? parsed[idx - 1].distanceKm : 0)) : (idx === 0 ? 0 : 7.5);
      cumulativeKm += Math.max(0, distFromPrev);

      return {
        _id: `stn_${st.stationCode}`,
        id: `stn_${st.stationCode}`,
        stationCode: st.stationCode,
        code: st.stationCode,
        name: st.name,
        officialName: st.officialName || st.name,
        stationName: st.name,
        sequence: idx + 1,
        cumulativeKm: st.distanceKm !== null ? st.distanceKm : Math.round(cumulativeKm * 10) / 10,
        division: divisionCode,
        divisionCode,
        isJunction: isJct,
        isTerminal: isTerm,
        stationType: isTerm ? 'TERMINAL' : isJct ? 'JUNCTION' : 'STATION',
        platforms: isJct || isTerm ? ['1', '2', '3', '4', '5', '6'] : ['1', '2']
      };
    });
  }

  /**
   * Generates adjacent block sections connecting consecutive corridor stations
   */
  static getCorridorSections(stations = [], divisionCode = 'MAS', routeName = '') {
    const sections = [];
    for (let i = 0; i < stations.length - 1; i++) {
      const fromStn = stations[i];
      const toStn = stations[i + 1];
      const dist = Math.max(4, Math.round(Math.abs((toStn.cumulativeKm || 0) - (fromStn.cumulativeKm || 0)) * 10) / 10) || 8.0;
      const secCode = `${fromStn.stationCode}-${toStn.stationCode}`;

      sections.push({
        _id: `sec_${secCode}`,
        id: `sec_${secCode}`,
        sectionCode: secCode,
        name: `${fromStn.stationCode} to ${toStn.stationCode} Block`,
        routeName: routeName || `${fromStn.stationCode}-${toStn.stationCode}`,
        fromStationId: fromStn._id,
        toStationId: toStn._id,
        fromStationCode: fromStn.stationCode,
        toStationCode: toStn.stationCode,
        divisionCode,
        distanceKm: dist,
        maxSpeedKmph: fromStn.isJunction || toStn.isJunction ? 110 : 130,
        trackType: 'DOUBLE_TRACK',
        signalingType: 'AUTOMATIC_BLOCK',
        status: 'ACTIVE',
        isCandidate: false
      });
    }
    return sections;
  }

  /**
   * Generates a realistic set of 25-45 train schedules and runs spanning the 24-hour service day
   */
  static generateCorridorTimetable(stations = [], serviceDate = '2026-08-30', scenarioId = 'SCEN_PEAK_001') {
    if (!stations.length) return { schedules: [], trainRuns: [], occupancies: [], conflicts: [], recommendations: [] };

    const totalStations = stations.length;
    const firstStn = stations[0];
    const lastStn = stations[totalStations - 1];

    // Authentic Indian Railways train definitions for Southern Railway corridors
    const trainTemplates = [
      // Morning Peak
      { num: '20607', name: 'Vande Bharat Express', type: 'VANDE_BHARAT', dir: 'DOWN', startMin: 350, speedKmH: 95, skipsMinor: true, priority: 'HIGH', delay: 0 },
      { num: '12007', name: 'Shatabdi Express', type: 'SHATABDI', dir: 'DOWN', startMin: 365, speedKmH: 88, skipsMinor: true, priority: 'HIGH', delay: 4 },
      { num: '12675', name: 'Kovai Superfast Express', type: 'SUPERFAST', dir: 'DOWN', startMin: 375, speedKmH: 78, skipsMinor: true, priority: 'NORMAL', delay: 8 },
      { num: '56001', name: 'Arakkonam Fast Passenger', type: 'PASSENGER', dir: 'DOWN', startMin: 390, speedKmH: 45, skipsMinor: false, priority: 'LOW', delay: 12 },
      { num: '12601', name: 'Mangalore Superfast Mail', type: 'SUPERFAST', dir: 'DOWN', startMin: 420, speedKmH: 75, skipsMinor: true, priority: 'NORMAL', delay: 0 },
      { num: '66019', name: 'Chennai Suburban Local', type: 'PASSENGER', dir: 'DOWN', startMin: 440, speedKmH: 42, skipsMinor: false, priority: 'LOW', delay: 5 },
      { num: 'BOXN_COAL_01', name: 'Goods Container (Ennore Coal)', type: 'FREIGHT', dir: 'DOWN', startMin: 460, speedKmH: 50, skipsMinor: true, priority: 'LOW', delay: 18 },
      { num: '16127', name: 'Guruvayur Express', type: 'EXPRESS', dir: 'DOWN', startMin: 510, speedKmH: 68, skipsMinor: true, priority: 'NORMAL', delay: 2 },
      { num: '22639', name: 'Alleppey Superfast Express', type: 'SUPERFAST', dir: 'DOWN', startMin: 560, speedKmH: 76, skipsMinor: true, priority: 'NORMAL', delay: 14 },
      { num: '12673', name: 'Cheran Superfast Express', type: 'SUPERFAST', dir: 'DOWN', startMin: 620, speedKmH: 80, skipsMinor: true, priority: 'NORMAL', delay: 0 },
      // Afternoon / Evening
      { num: '20643', name: 'Coimbatore Vande Bharat', type: 'VANDE_BHARAT', dir: 'DOWN', startMin: 800, speedKmH: 95, skipsMinor: true, priority: 'HIGH', delay: 0 },
      { num: '12695', name: 'Trivandrum Superfast Express', type: 'SUPERFAST', dir: 'DOWN', startMin: 910, speedKmH: 78, skipsMinor: true, priority: 'NORMAL', delay: 6 },
      { num: '16669', name: 'Yercaud Express', type: 'EXPRESS', dir: 'DOWN', startMin: 1040, speedKmH: 65, skipsMinor: true, priority: 'NORMAL', delay: 15 },
      { num: 'BTPN_FUEL_02', name: 'Petroleum Tanker Special', type: 'FREIGHT', dir: 'DOWN', startMin: 1100, speedKmH: 52, skipsMinor: true, priority: 'LOW', delay: 22 },
      { num: '12623', name: 'Chennai Mail Express', type: 'SUPERFAST', dir: 'DOWN', startMin: 1180, speedKmH: 75, skipsMinor: true, priority: 'NORMAL', delay: 0 },
      { num: '56003', name: 'Night Passenger Service', type: 'PASSENGER', dir: 'DOWN', startMin: 1260, speedKmH: 44, skipsMinor: false, priority: 'LOW', delay: 8 },

      // UP Direction Trains (Reverse corridor traversal)
      { num: '20608', name: 'Vande Bharat Express (Up)', type: 'VANDE_BHARAT', dir: 'UP', startMin: 380, speedKmH: 95, skipsMinor: true, priority: 'HIGH', delay: 0 },
      { num: '12676', name: 'Kovai Superfast Express (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 400, speedKmH: 78, skipsMinor: true, priority: 'NORMAL', delay: 5 },
      { num: '12008', name: 'Shatabdi Express (Up)', type: 'SHATABDI', dir: 'UP', startMin: 440, speedKmH: 88, skipsMinor: true, priority: 'HIGH', delay: 2 },
      { num: '56002', name: 'Arakkonam Passenger (Up)', type: 'PASSENGER', dir: 'UP', startMin: 470, speedKmH: 45, skipsMinor: false, priority: 'LOW', delay: 10 },
      { num: '12602', name: 'Mangalore Mail (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 520, speedKmH: 75, skipsMinor: true, priority: 'NORMAL', delay: 16 },
      { num: 'CONTAINER_03', name: 'CONCOR Freight (Up)', type: 'FREIGHT', dir: 'UP', startMin: 570, speedKmH: 52, skipsMinor: true, priority: 'LOW', delay: 25 },
      { num: '16128', name: 'Guruvayur Express (Up)', type: 'EXPRESS', dir: 'UP', startMin: 640, speedKmH: 68, skipsMinor: true, priority: 'NORMAL', delay: 0 },
      { num: '20644', name: 'Coimbatore Vande Bharat (Up)', type: 'VANDE_BHARAT', dir: 'UP', startMin: 820, speedKmH: 95, skipsMinor: true, priority: 'HIGH', delay: 3 },
      { num: '12674', name: 'Cheran Superfast (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 960, speedKmH: 80, skipsMinor: true, priority: 'NORMAL', delay: 0 },
      { num: '22640', name: 'Alleppey Express (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 1060, speedKmH: 76, skipsMinor: true, priority: 'NORMAL', delay: 12 },
      { num: '16670', name: 'Yercaud Express (Up)', type: 'EXPRESS', dir: 'UP', startMin: 1140, speedKmH: 65, skipsMinor: true, priority: 'NORMAL', delay: 7 },
      { num: 'AUTO_RAKE_04', name: 'Automobile Logistics Express', type: 'FREIGHT', dir: 'UP', startMin: 1220, speedKmH: 55, skipsMinor: true, priority: 'LOW', delay: 0 }
    ];

    const schedules = [];
    const trainRuns = [];
    const occupancies = [];
    const conflicts = [];
    const recommendations = [];

    trainTemplates.forEach((tmpl, tIdx) => {
      const isDown = tmpl.dir === 'DOWN';
      const orderedStations = isDown ? [...stations] : [...stations].reverse();
      const stops = [];

      let currentMinute = tmpl.startMin;
      let prevKm = orderedStations[0].cumulativeKm || 0;

      orderedStations.forEach((stn, sIdx) => {
        const curKm = stn.cumulativeKm || 0;
        const deltaKm = Math.max(2, Math.abs(curKm - prevKm));
        prevKm = curKm;

        // Travel time in minutes based on train speed
        const travelMinutes = Math.max(2, Math.round((deltaKm / tmpl.speedKmH) * 60));
        currentMinute += (sIdx === 0 ? 0 : travelMinutes);

        // Dwell time: Junctions get 4-8m dwell, minor stations 1-2m, or 0m if non-stop
        let haltMins = 0;
        const isStopStation = !tmpl.skipsMinor || stn.isJunction || stn.isTerminal || sIdx === 0 || sIdx === orderedStations.length - 1;

        if (isStopStation) {
          if (sIdx === 0 || sIdx === orderedStations.length - 1) {
            haltMins = 0;
          } else if (stn.isJunction) {
            haltMins = tmpl.type === 'VANDE_BHARAT' ? 3 : tmpl.type === 'FREIGHT' ? 8 : 5;
          } else {
            haltMins = tmpl.type === 'PASSENGER' ? 2 : 1;
          }
        }

        const arrMin = currentMinute;
        const depMin = currentMinute + haltMins;
        currentMinute = depMin;

        const arrH = Math.floor((arrMin % 1440) / 60).toString().padStart(2, '0');
        const arrM = (arrMin % 60).toString().padStart(2, '0');
        const depH = Math.floor((depMin % 1440) / 60).toString().padStart(2, '0');
        const depM = (depMin % 60).toString().padStart(2, '0');

        stops.push({
          sequence: sIdx + 1,
          stationId: stn._id,
          stationCode: stn.stationCode,
          stationName: stn.name,
          arrival: `${arrH}:${arrM}`,
          departure: `${depH}:${depM}`,
          absoluteMinutesArrival: arrMin,
          absoluteMinutesDeparture: depMin,
          haltMinutes: haltMins,
          dayOffset: Math.floor(arrMin / 1440),
          isJunction: stn.isJunction,
          isHalt: haltMins > 0
        });
      });

      const schedId = `sched_${tmpl.num}`;
      const runId = `TR_${serviceDate}_${tmpl.num}`;

      schedules.push({
        _id: schedId,
        id: schedId,
        trainNumber: tmpl.num,
        trainName: tmpl.name,
        trainType: tmpl.type,
        direction: tmpl.dir,
        frequency: 'DAILY',
        stops
      });

      const trainRun = {
        _id: runId,
        id: runId,
        trainRunId: runId,
        trainNumber: tmpl.num,
        trainName: tmpl.name,
        trainType: tmpl.type,
        direction: tmpl.dir,
        priorityClass: tmpl.priority,
        serviceDate,
        scheduleId: schedId,
        runStatus: tmpl.delay > 15 ? 'DELAYED' : 'RUNNING',
        delayMinutes: tmpl.delay,
        stops,
        trainStops: stops
      };

      trainRuns.push(trainRun);
    });

    // Generate realistic conflicts between crossing/overtaking trains
    if (trainRuns.length >= 4) {
      const midStation = stations[Math.floor(totalStations / 2)] || stations[0];
      const jctStation = stations.find(s => s.isJunction && s.stationCode !== firstStn.stationCode) || midStation;

      // Conflict 1: Crossing Precedence Conflict at Junction
      conflicts.push({
        _id: `CONF_${scenarioId}_001`,
        id: `CONF_${scenarioId}_001`,
        conflictId: `CONF_${scenarioId}_001`,
        scenarioId,
        type: 'CROSSING_PRECEDENCE_CONFLICT',
        severity: 'HIGH',
        trainRunIds: [trainRuns[0].trainNumber, trainRuns[16].trainNumber],
        trainNumber: `${trainRuns[0].trainNumber} × ${trainRuns[16].trainNumber}`,
        stationId: jctStation._id,
        stationCode: jctStation.stationCode,
        detectedAt: new Date(new Date(serviceDate).setHours(6, 30, 0, 0)),
        estimatedTime: new Date(new Date(serviceDate).setHours(6, 30, 0, 0)),
        description: `Crossing precedence conflict at ${jctStation.name} (${jctStation.stationCode}) between DOWN ${trainRuns[0].trainNumber} (${trainRuns[0].trainName}) and UP ${trainRuns[16].trainNumber} (${trainRuns[16].trainName}).`,
        status: 'DETECTED'
      });

      // Conflict 2: Overtake on Loop line (Freight held for Vande Bharat)
      const freightRun = trainRuns.find(r => r.trainType === 'FREIGHT') || trainRuns[6];
      const vbRun = trainRuns.find(r => r.trainType === 'VANDE_BHARAT') || trainRuns[0];

      conflicts.push({
        _id: `CONF_${scenarioId}_002`,
        id: `CONF_${scenarioId}_002`,
        conflictId: `CONF_${scenarioId}_002`,
        scenarioId,
        type: 'LOOP_OVERTAKE_PRECEDENCE',
        severity: 'MEDIUM',
        trainRunIds: [vbRun.trainNumber, freightRun.trainNumber],
        trainNumber: `${vbRun.trainNumber} × ${freightRun.trainNumber}`,
        stationId: jctStation._id,
        stationCode: jctStation.stationCode,
        detectedAt: new Date(new Date(serviceDate).setHours(8, 15, 0, 0)),
        estimatedTime: new Date(new Date(serviceDate).setHours(8, 15, 0, 0)),
        description: `Overtake slot conflict: Freight ${freightRun.trainNumber} requires loop line dwell to clear high-speed path for ${vbRun.trainNumber}.`,
        status: 'DETECTED'
      });

      // Recommendation 1
      recommendations.push({
        _id: `REC_${scenarioId}_001`,
        id: `REC_${scenarioId}_001`,
        recommendationId: `REC_${scenarioId}_001`,
        scenarioId,
        type: 'HOLD_AND_PRECEDE',
        engineVersion: 'v2.0-ai-controller',
        status: 'PROPOSED',
        predictionConfidence: 96,
        recommendationScore: 92,
        actionPayload: {
          actionType: 'HOLD_AT_LOOP',
          holdTrainRunId: freightRun.trainNumber,
          priorityTrainRunId: vbRun.trainNumber,
          holdingStation: `${jctStation.name} (${jctStation.stationCode})`,
          holdMinutes: 8,
          expectedDelayRecoveryMin: 14,
          reason: `Hold Freight ${freightRun.trainNumber} on loop platform at ${jctStation.stationCode} for 8 mins to prioritize ${vbRun.trainNumber} (${vbRun.trainName}) line speed.`
        },
        evidence: {
          triggeringConflicts: [`CONF_${scenarioId}_002`],
          predictedDelay: 0,
          affectedTrains: [vbRun.trainNumber, freightRun.trainNumber],
          calculationTimestamp: new Date()
        }
      });
    }

    return {
      schedules,
      trainRuns,
      sectionOccupancies: occupancies,
      conflicts,
      recommendations
    };
  }
}
