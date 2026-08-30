/**
 * ChartCoordinateModel
 * 
 * Transforms TopologySnapshot and TimetableSnapshot into deterministic
 * SVG coordinates for the Interactive Indian Railways Master Control Chart.
 */

export const DISTANCE_MODE = {
  PHYSICAL: 'PHYSICAL_DISTANCE',
  SCHEMATIC: 'SCHEMATIC_TOPOLOGY'
};

export class ChartCoordinateModel {
  constructor({ topologySnapshot, timetableSnapshot, config = {} }) {
    this.topologySnapshot = topologySnapshot || { stations: [], sections: [] };
    this.timetableSnapshot = timetableSnapshot || { schedules: [] };
    this.config = {
      distanceMode: DISTANCE_MODE.SCHEMATIC,
      timeWindowStart: Date.now(), // base time (X=0)
      timeScale: 60000, // ms per pixel (e.g. 1 min per pixel)
      distanceScale: 10, // pixels per km in physical mode
      stationSpacing: 100, // pixels per station in schematic mode
      ...config
    };

    this.stationYMap = new Map();
    this.stationMap = new Map();
    this.stationOrder = [];
    this.cumulativeDistances = new Map();
    this.maxStationY = 0;

    this._initializeCoordinates();
  }

  _initializeCoordinates() {
    const { stations = [], sections = [] } = this.topologySnapshot;
    
    // Index stations
    stations.forEach(s => {
      const id = s._id ? s._id.toString() : (s.id || s.stationCode);
      this.stationMap.set(id, s);
      if (s.stationCode) {
        this.stationMap.set(s.stationCode, s);
        this.stationMap.set(s.stationCode.toUpperCase(), s);
      }
      if (s.code) {
        this.stationMap.set(s.code, s);
      }
    });

    // Build directed adjacency and calculate indegrees for topological order
    const inDegree = new Map();
    const adj = new Map();
    const distMap = new Map();
    
    stations.forEach(s => {
      const id = s._id ? s._id.toString() : (s.id || s.stationCode);
      inDegree.set(id, 0);
      adj.set(id, []);
    });

    sections.forEach(sec => {
      const from = sec.fromStationId?._id ? sec.fromStationId._id.toString() : (sec.fromStationId?.id || sec.fromStationId?.stationCode || sec.fromStationId);
      const to = sec.toStationId?._id ? sec.toStationId._id.toString() : (sec.toStationId?.id || sec.toStationId?.stationCode || sec.toStationId);
      if (from && to) {
        const fromStr = from.toString();
        const toStr = to.toString();
        if (!adj.has(fromStr)) adj.set(fromStr, []);
        if (!inDegree.has(toStr)) inDegree.set(toStr, 0);
        
        adj.get(fromStr).push(toStr);
        inDegree.set(toStr, (inDegree.get(toStr) || 0) + 1);
        
        const dist = sec.distanceKm || sec.lengthKm || 10;
        distMap.set(`${fromStr}-${toStr}`, dist);
      }
    });

    // If stations have explicit cumulativeKm, use them directly
    const hasExplicitKm = stations.length > 0 && stations.some(s => s.cumulativeKm !== undefined);
    if (hasExplicitKm) {
      const firstKm = stations[0].cumulativeKm || 0;
      stations.forEach((s, idx) => {
        const id = s._id ? s._id.toString() : (s.id || s.stationCode);
        const code = s.stationCode || s.code || id;
        const cumKm = s.cumulativeKm !== undefined ? s.cumulativeKm : (idx * 7.5);
        
        let yPos;
        if (this.config.distanceMode === DISTANCE_MODE.PHYSICAL) {
          yPos = Math.max(0, (cumKm - firstKm) * this.config.distanceScale);
        } else {
          yPos = idx * this.config.stationSpacing;
        }

        this.stationYMap.set(id, yPos);
        this.stationYMap.set(code, yPos);
        if (s._id) this.stationYMap.set(s._id.toString(), yPos);
        if (s.id) this.stationYMap.set(s.id.toString(), yPos);
        this.cumulativeDistances.set(id, cumKm);
        this.cumulativeDistances.set(code, cumKm);
        this.stationOrder.push(id);
        this.maxStationY = Math.max(this.maxStationY, yPos);
      });
      return;
    }

    // Otherwise traverse by topological section adjacency
    let startNodes = [];
    inDegree.forEach((deg, id) => {
      if (deg === 0) startNodes.push(id);
    });

    if (startNodes.length === 0 && stations.length > 0) {
      const first = stations[0]._id ? stations[0]._id.toString() : (stations[0].id || stations[0].stationCode);
      if (first) startNodes.push(first);
    }

    let currentY = 0;
    let cumulativeKm = 0;
    const visited = new Set();
    const queue = [];

    startNodes.forEach(sn => {
      queue.push({ id: sn, y: 0, km: 0 });
      visited.add(sn);
    });

    while (queue.length > 0) {
      const curr = queue.shift();
      this.stationYMap.set(curr.id, curr.y);
      this.cumulativeDistances.set(curr.id, curr.km);
      this.stationOrder.push(curr.id);
      this.maxStationY = Math.max(this.maxStationY, curr.y);
      
      const neighbors = adj.get(curr.id) || [];
      neighbors.forEach(nextId => {
        if (!visited.has(nextId)) {
          visited.add(nextId);
          
          const d = distMap.get(`${curr.id}-${nextId}`) || 10;
          const nextKm = curr.km + d;
          let nextY;
          if (this.config.distanceMode === DISTANCE_MODE.PHYSICAL) {
            nextY = curr.y + (d * this.config.distanceScale);
          } else {
            nextY = curr.y + this.config.stationSpacing;
          }
          
          queue.push({ id: nextId, y: nextY, km: nextKm });
        }
      });
    }

    // Add any unconnected stations at the end
    stations.forEach(s => {
      const id = s._id ? s._id.toString() : (s.id || s.stationCode);
      if (!this.stationYMap.has(id)) {
        currentY = this.stationOrder.length === 0 ? 0 : this.maxStationY + this.config.stationSpacing;
        cumulativeKm += 10;
        this.stationYMap.set(id, currentY);
        this.cumulativeDistances.set(id, cumulativeKm);
        this.stationOrder.push(id);
        this.maxStationY = currentY;
      }
    });
  }

  getStationY(stationId) {
    if (!stationId) return undefined;
    if (typeof stationId === 'object') {
      const candidates = [
        stationId._id?.toString(),
        stationId.id?.toString(),
        stationId.stationCode,
        stationId.code
      ].filter(Boolean);
      for (const c of candidates) {
        if (this.stationYMap.has(c)) return this.stationYMap.get(c);
      }
    }
    const key = stationId.toString();
    if (this.stationYMap.has(key)) return this.stationYMap.get(key);
    if (this.stationYMap.has(key.toUpperCase())) return this.stationYMap.get(key.toUpperCase());
    return undefined;
  }

  getStationKm(stationId) {
    if (!stationId) return 0;
    const key = stationId._id ? stationId._id.toString() : (stationId.id || stationId.stationCode || stationId).toString();
    return this.cumulativeDistances.get(key) || 0;
  }

  getTimeX(timeValue) {
    const timeMs = new Date(timeValue).getTime();
    const startMs = new Date(this.config.timeWindowStart).getTime();
    return (timeMs - startMs) / this.config.timeScale;
  }

  getServiceMinutesX(absoluteMinutes, dayOffset = 0, baseDateStr = null) {
    const baseDate = baseDateStr || new Date(this.config.timeWindowStart).toISOString().split('T')[0];
    const baseMs = new Date(`${baseDate}T00:00:00Z`).getTime();
    const totalMs = baseMs + ((dayOffset * 1440) + absoluteMinutes) * 60000;
    return this.getTimeX(totalMs);
  }
  
  getTrainTrajectory(trainRun, isWhatIf = false, whatIfHoldOffset = 0) {
    if (!trainRun) return [];
    
    // Find the schedule in the snapshot or attached to trainRun
    let stops = trainRun.stops || trainRun.trainStops || [];
    if (!stops.length && this.timetableSnapshot?.schedules) {
      const runSchedId = trainRun.scheduleId?._id ? trainRun.scheduleId._id.toString() : (trainRun.scheduleId?.id || trainRun.scheduleId)?.toString();
      const schedObj = this.timetableSnapshot.schedules.find(s => {
        const id = s._id ? s._id.toString() : (s.id || s.schedule?._id || s.schedule?.id)?.toString();
        return id === runSchedId;
      });
      stops = schedObj?.stops || schedObj?.trainStops || [];
    }

    if (!stops.length && !trainRun.actualTimeline?.length) return [];

    // If there is an explicit timeline (e.g. simulated/actual timeline events)
    if (trainRun.actualTimeline && trainRun.actualTimeline.length > 0 && !isWhatIf) {
      return trainRun.actualTimeline.map(event => {
        const stationId = event.stationId?._id || event.stationId;
        const arrivalMs = new Date(event.arrivalTime || event.departureTime).getTime();
        const departureMs = new Date(event.departureTime || event.arrivalTime).getTime();
        const y = this.getStationY(stationId);
        return {
          stationId,
          x: this.getTimeX(departureMs),
          xArrival: this.getTimeX(arrivalMs),
          xDeparture: this.getTimeX(departureMs),
          y,
          event
        };
      }).filter(pt => pt.y !== undefined && !Number.isNaN(pt.xArrival));
    }

    const baseDateStr = trainRun.serviceDate || new Date(this.config.timeWindowStart).toISOString().split('T')[0];
    const baseMs = new Date(`${baseDateStr}T00:00:00Z`).getTime();
    const delayMs = ((trainRun.delayMinutes || 0) + (isWhatIf ? whatIfHoldOffset : 0)) * 60000;

    const points = [];
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      let arrMs = baseMs;
      let depMs = baseMs;

      if (stop.absoluteMinutesArrival !== undefined) {
        const dayOffset = stop.dayOffset || 0;
        arrMs += ((dayOffset * 1440) + stop.absoluteMinutesArrival) * 60000;
        depMs += ((dayOffset * 1440) + (stop.absoluteMinutesDeparture !== undefined ? stop.absoluteMinutesDeparture : stop.absoluteMinutesArrival)) * 60000;
      } else if (stop.arrival && stop.departure) {
        const [aH, aM] = stop.arrival.split(':').map(Number);
        const [dH, dM] = stop.departure.split(':').map(Number);
        const dayOffset = stop.dayOffset || 0;
        arrMs += ((dayOffset * 1440) + (aH * 60 + aM)) * 60000;
        depMs += ((dayOffset * 1440) + (dH * 60 + dM)) * 60000;
      } else {
        continue;
      }

      arrMs += delayMs;
      depMs += delayMs;

      const stationId = stop.stationId?._id ? stop.stationId._id.toString() : (stop.stationId?.id || stop.stationId?.stationCode || stop.stationId || stop.stationCode);
      const y = this.getStationY(stationId);

      if (y !== undefined) {
        points.push({
          x: this.getTimeX(depMs),
          xArrival: this.getTimeX(arrMs),
          xDeparture: this.getTimeX(depMs),
          y,
          stationId,
          stationCode: stop.stationCode || stop.stationId?.stationCode || stationId,
          sequence: stop.sequence || (i + 1),
          haltMinutes: stop.haltMinutes || (depMs - arrMs) / 60000,
          delayMinutes: (trainRun.delayMinutes || 0) + (isWhatIf ? whatIfHoldOffset : 0),
          stop
        });
      }
    }

    return points;
  }

  getSectionOccupancyRect(occupancy) {
    if (!occupancy || !occupancy.sectionId) return null;

    const secKey = occupancy.sectionId?._id ? occupancy.sectionId._id.toString() : (occupancy.sectionId?.id || occupancy.sectionId).toString();
    const section = this.topologySnapshot.sections?.find(s => {
      const id = s._id ? s._id.toString() : (s.id || s.sectionCode);
      return id === secKey;
    });

    const fromId = section?.fromStationId || occupancy.sectionId?.fromStationId;
    const toId = section?.toStationId || occupancy.sectionId?.toStationId;

    const y1 = this.getStationY(fromId);
    const y2 = this.getStationY(toId);

    if (y1 === undefined || y2 === undefined) return null;

    const startX = this.getTimeX(occupancy.entryTime || occupancy.createdAt || this.config.timeWindowStart);
    const endX = this.getTimeX(occupancy.actualExitTime || occupancy.expectedExitTime || new Date(new Date(this.config.timeWindowStart).getTime() + 3600000));

    return {
      x: startX,
      width: Math.max(endX - startX, 4), // visible block
      yTop: Math.min(y1, y2),
      yBottom: Math.max(y1, y2),
      height: Math.max(Math.abs(y1 - y2), 16),
      occupancy
    };
  }

  getConflictCoordinates(conflict) {
    if (!conflict) return null;

    let y = null;
    if (conflict.locationType === 'STATION' && conflict.stationId) {
      y = this.getStationY(conflict.stationId);
    } else if (conflict.locationType === 'SECTION' && conflict.sectionId) {
      const secKey = conflict.sectionId?._id ? conflict.sectionId._id.toString() : (conflict.sectionId?.id || conflict.sectionId).toString();
      const section = this.topologySnapshot.sections?.find(s => {
        const id = s._id ? s._id.toString() : (s.id || s.sectionCode);
        return id === secKey;
      });
      if (section) {
        const y1 = this.getStationY(section.fromStationId);
        const y2 = this.getStationY(section.toStationId);
        if (y1 !== undefined && y2 !== undefined) y = (y1 + y2) / 2;
      }
    } else if (conflict.stationId) {
      y = this.getStationY(conflict.stationId);
    } else if (conflict.sectionId) {
      const y1 = this.getStationY(conflict.sectionId.fromStationId || conflict.sectionId);
      if (y1 !== undefined) y = y1;
    }

    if (y === undefined || y === null) {
      y = 100; // fallback visible position
    }

    const x = this.getTimeX(conflict.estimatedTime || conflict.detectedAt || Date.now());
    return { x, y, conflict };
  }

  getRecommendationCoordinates(rec) {
    if (!rec) return null;
    const x = this.getTimeX(rec.targetTime || rec.createdAt || rec.generatedAt || Date.now());
    let y = 60;
    if (rec.affectedSectionIds && rec.affectedSectionIds.length > 0) {
      const secKey = rec.affectedSectionIds[0];
      const section = this.topologySnapshot.sections?.find(s => (s._id || s.id || s.sectionCode) === secKey);
      if (section) {
        const y1 = this.getStationY(section.fromStationId);
        const y2 = this.getStationY(section.toStationId);
        if (y1 !== undefined && y2 !== undefined) y = (y1 + y2) / 2;
      }
    }
    return { x, y, recommendation: rec };
  }
}


