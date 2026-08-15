/**
 * ChartCoordinateModel
 * 
 * Transforms TopologySnapshot and TimetableSnapshot into deterministic
 * SVG coordinates for the Interactive Control Chart.
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

    this._initializeCoordinates();
  }

  _initializeCoordinates() {
    const { stations, sections } = this.topologySnapshot;
    
    // Index stations
    stations.forEach(s => {
      const id = s._id || s.id;
      this.stationMap.set(id, s);
    });

    // Find indegrees to find a start station
    const inDegree = new Map();
    const adj = new Map();
    const distMap = new Map(); // section distance
    
    stations.forEach(s => {
      const id = s._id || s.id;
      inDegree.set(id, 0);
      adj.set(id, []);
    });

    sections.forEach(sec => {
      const from = sec.fromStationId;
      const to = sec.toStationId;
      if (!adj.has(from)) adj.set(from, []);
      if (!inDegree.has(to)) inDegree.set(to, 0);
      
      adj.get(from).push(to);
      inDegree.set(to, inDegree.get(to) + 1);
      
      // key by from->to
      distMap.set(`${from}-${to}`, sec.distanceKm || 10);
    });

    // Find start nodes
    let startNodes = [];
    inDegree.forEach((deg, id) => {
      if (deg === 0) startNodes.push(id);
    });

    if (startNodes.length === 0 && stations.length > 0) {
      // Cycle or single isolated, pick first
      const first = stations[0]._id || stations[0].id;
      if (first) startNodes.push(first);
    }

    // BFS to assign Y coordinates
    let currentY = 0;
    const visited = new Set();
    const queue = [];

    // Add all start nodes
    startNodes.forEach(sn => {
      queue.push({ id: sn, y: currentY });
      visited.add(sn);
    });

    while (queue.length > 0) {
      const curr = queue.shift();
      this.stationYMap.set(curr.id, curr.y);
      
      const neighbors = adj.get(curr.id) || [];
      neighbors.forEach(nextId => {
        if (!visited.has(nextId)) {
          visited.add(nextId);
          
          let nextY;
          if (this.config.distanceMode === DISTANCE_MODE.PHYSICAL) {
            const d = distMap.get(`${curr.id}-${nextId}`) || 10;
            nextY = curr.y + (d * this.config.distanceScale);
          } else {
            nextY = curr.y + this.config.stationSpacing;
          }
          
          queue.push({ id: nextId, y: nextY });
        }
      });
    }
  }

  getStationY(stationId) {
    return this.stationYMap.get(stationId);
  }

  getTimeX(timeValue) {
    const timeMs = new Date(timeValue).getTime();
    const startMs = new Date(this.config.timeWindowStart).getTime();
    return (timeMs - startMs) / this.config.timeScale;
  }
  
  getTrainTrajectory(trainRun) {
    // Generate a set of X, Y points for a given train run
    if (!trainRun) return [];
    
    // Find the schedule in the snapshot
    const scheduleData = this.timetableSnapshot?.schedules?.find(s => {
      // Handle both flat schedule objects or nested ones
      const id = s.schedule?._id || s.schedule?.id || s._id || s.id;
      const runScheduleId = trainRun.scheduleId?._id || trainRun.scheduleId;
      return id === runScheduleId;
    });

    const stops = scheduleData?.stops || scheduleData?.trainStops || [];
    if (!stops.length && !trainRun.actualTimeline) return [];

    // If there is an explicit timeline (e.g., from some advanced simulation state), use it
    if (trainRun.actualTimeline && trainRun.actualTimeline.length > 0) {
      return trainRun.actualTimeline.map(event => {
        const stationId = event.stationId;
        const arrivalMs = new Date(event.arrivalTime || event.departureTime).getTime();
        const departureMs = new Date(event.departureTime || event.arrivalTime).getTime();
        return {
          stationId,
          xArrival: this.getTimeX(arrivalMs),
          xDeparture: this.getTimeX(departureMs),
          y: this.getStationY(stationId),
          event
        };
      }).filter(pt => pt.y !== undefined && !Number.isNaN(pt.xArrival));
    }

    // Otherwise compute from schedule + delay
    // Assuming trainRun.serviceDate exists (YYYY-MM-DD)
    const baseDateStr = trainRun.serviceDate || new Date(this.config.timeWindowStart).toISOString().split('T')[0];
    const baseMs = new Date(`${baseDateStr}T00:00:00Z`).getTime();
    const delayMs = (trainRun.delayMinutes || 0) * 60000;

    return stops.map(stop => {
      // Use absoluteMinutesArrival / absoluteMinutesDeparture if available
      let arrivalMs = baseMs;
      let departureMs = baseMs;

      if (stop.absoluteMinutesArrival !== undefined) {
        arrivalMs += stop.absoluteMinutesArrival * 60000;
        departureMs += (stop.absoluteMinutesDeparture || stop.absoluteMinutesArrival) * 60000;
      } else {
        // fallback parsing HH:mm if needed, assuming absoluteMinutes are set per schema
        return null;
      }

      // Add the real-time delay
      arrivalMs += delayMs;
      departureMs += delayMs;

      // Extract station ID
      const stationId = stop.stationId?._id || stop.stationId;
      const y = this.getStationY(stationId);

      if (y === undefined) return null;

      // We plot the departure from each stop, and arrival at the end.
      // For a line string, we can just use departureTime for most nodes, 
      // or plot both arrival and departure if halting.
      
      return {
        x: this.getTimeX(departureMs), // using departure for simplicity in standard stringline
        xArrival: this.getTimeX(arrivalMs),
        y,
        stationId,
        delayMinutes: trainRun.delayMinutes || 0,
        stop
      };
    }).filter(Boolean);
  }

  getSectionOccupancyRect(occupancy) {
    if (!occupancy || !occupancy.sectionId) return null;

    // Find the section in topology
    const section = this.topologySnapshot.sections?.find(s => 
      (s._id || s.id) === (occupancy.sectionId._id || occupancy.sectionId)
    );
    if (!section) return null;

    const y1 = this.getStationY(section.fromStationId?._id || section.fromStationId);
    const y2 = this.getStationY(section.toStationId?._id || section.toStationId);

    if (y1 === undefined || y2 === undefined) return null;

    const startX = this.getTimeX(occupancy.entryTime || occupancy.createdAt || this.config.timeWindowStart);
    const endX = this.getTimeX(occupancy.actualExitTime || occupancy.expectedExitTime || new Date(this.config.timeWindowStart + 3600000));

    return {
      x: startX,
      width: Math.max(endX - startX, 2), // minimum 2px width
      yTop: Math.min(y1, y2),
      yBottom: Math.max(y1, y2),
      height: Math.abs(y1 - y2),
      occupancy
    };
  }

  getConflictCoordinates(conflict) {
    if (!conflict) return null;

    let y = null;
    if (conflict.locationType === 'STATION' && conflict.stationId) {
      y = this.getStationY(conflict.stationId._id || conflict.stationId);
    } else if (conflict.locationType === 'SECTION' && conflict.sectionId) {
      // Find midpoint of section
      const section = this.topologySnapshot.sections?.find(s => 
        (s._id || s.id) === (conflict.sectionId._id || conflict.sectionId)
      );
      if (section) {
        const y1 = this.getStationY(section.fromStationId?._id || section.fromStationId);
        const y2 = this.getStationY(section.toStationId?._id || section.toStationId);
        if (y1 !== undefined && y2 !== undefined) y = (y1 + y2) / 2;
      }
    }

    if (y === undefined || y === null) return null;

    const x = this.getTimeX(conflict.estimatedTime || conflict.detectedAt);
    return { x, y, conflict };
  }
}

