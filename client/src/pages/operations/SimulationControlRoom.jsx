/* eslint-disable */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ControlChart } from '../../components/control-chart/ControlChart';
import { DISTANCE_MODE } from '../../components/control-chart/ChartCoordinateModel';
import { useSimulationSocket } from '../../hooks/useSimulationSocket';

export default function SimulationControlRoom() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Controller Scope State
  const [selectedZoneId, setSelectedZoneId] = useState(searchParams.get('zone') || 'SR');
  const [selectedDivisionId, setSelectedDivisionId] = useState(searchParams.get('division') || 'MAS');
  const [selectedSectionId, setSelectedSectionId] = useState(searchParams.get('section') || '');
  const [selectedRouteId, setSelectedRouteId] = useState(searchParams.get('route') || 'West Line (MAS-JTJ)');
  const [serviceDate, setServiceDate] = useState(searchParams.get('date') || '2026-08-30');
  const [activeScenarioId, setActiveScenarioId] = useState(params.scenarioId || searchParams.get('scenario') || 'SCEN_PEAK_001');
  const [isChartLoaded, setIsChartLoaded] = useState(
    Boolean(searchParams.get('loaded') === 'true' || (searchParams.get('zone') && searchParams.get('division')))
  );

  // Lists of territorial entities
  const [zones, setZones] = useState([]);
  const [allDivisions, setAllDivisions] = useState([]);
  const [srNetworkData, setSrNetworkData] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [loadingScope, setLoadingScope] = useState(true);

  // Static snapshot state
  const [topologySnapshot, setTopologySnapshot] = useState(null);
  const [timetableSnapshot, setTimetableSnapshot] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  
  // UI & Playback Controls
  const [distanceMode, setDistanceMode] = useState(DISTANCE_MODE.SCHEMATIC);
  const [isLiveRunning, setIsLiveRunning] = useState(true);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [simClock, setSimClock] = useState(Date.now());

  // Socket Hook
  const {
    status: socketStatus,
    simulationTime,
    trainRuns,
    sectionOccupancies,
    conflicts,
    recommendations,
    setTrainRuns,
    setSectionOccupancies,
    setConflicts
  } = useSimulationSocket(activeScenarioId);

  // 2. Fetch Master Railway Topology Reference Data (Zones, Divisions, SR network, Scenarios)
  useEffect(() => {
    async function initMasterData() {
      try {
        setLoadingScope(true);
        const [zonesRes, divsRes, srNetRes, scenRes] = await Promise.all([
          axios.get('/api/zones').catch(() => ({ data: { data: [{ _id: 'SR', code: 'SR', name: 'Southern Railway', headquarters: 'Chennai' }] } })),
          axios.get('/api/divisions').catch(() => ({ data: { data: [] } })),
          axios.get('/api/sections/sr-network').catch(() => ({ data: { data: [] } })),
          axios.get('/api/simulation/scenarios').catch(() => ({ data: { data: [] } }))
        ]);

        const loadedZones = zonesRes.data?.data || [];
        // Ensure SR exists if not in DB
        if (!loadedZones.some(z => z.code === 'SR' || z._id === 'SR')) {
          loadedZones.unshift({ _id: 'SR', code: 'SR', name: 'Southern Railway', headquarters: 'Chennai' });
        }
        setZones(loadedZones);

        const loadedDivs = divsRes.data?.data || [];
        // Ensure default Southern Railway divisions exist
        const defaultSRDivs = [
          { _id: 'MAS', code: 'MAS', name: 'Chennai', zoneCode: 'SR' },
          { _id: 'SA', code: 'SA', name: 'Salem', zoneCode: 'SR' },
          { _id: 'PGT', code: 'PGT', name: 'Palakkad', zoneCode: 'SR' },
          { _id: 'TVC', code: 'TVC', name: 'Thiruvananthapuram', zoneCode: 'SR' },
          { _id: 'MDU', code: 'MDU', name: 'Madurai', zoneCode: 'SR' },
          { _id: 'TPJ', code: 'TPJ', name: 'Tiruchirappalli', zoneCode: 'SR' }
        ];
        const combinedDivs = [...loadedDivs];
        defaultSRDivs.forEach(d => {
          if (!combinedDivs.some(x => x.code === d.code)) {
            combinedDivs.push(d);
          }
        });
        setAllDivisions(combinedDivs);

        const networkSections = srNetRes.data?.data || [];
        setSrNetworkData(networkSections);

        const loadedScenarios = scenRes.data?.data || [];
        if (loadedScenarios.length > 0) {
          setScenarios(loadedScenarios);
          if (!activeScenarioId) {
            setActiveScenarioId(loadedScenarios[0].scenarioId || loadedScenarios[0]._id);
          }
        } else {
          setScenarios([
            { scenarioId: 'SCEN_PEAK_001', name: 'Peak Morning Commute & Vande Bharat Corridor', status: 'RUNNING' },
            { scenarioId: 'SCEN_FREIGHT_002', name: 'Mixed Corridor Precedence & Freight Optimization', status: 'READY' }
          ]);
        }
      } catch (err) {
        console.error('Error loading master scope data:', err);
      } finally {
        setLoadingScope(false);
      }
    }

    initMasterData();
  }, []);

  // 3. Dependent Divisions based on Selected Zone
  const filteredDivisions = useMemo(() => {
    if (!selectedZoneId || selectedZoneId === 'ALL_INDIA') {
      return allDivisions;
    }
    return allDivisions.filter(d => {
      const zId = d.zoneId?._id || d.zoneId || d.zoneCode;
      return zId === selectedZoneId || d.zoneCode === 'SR';
    });
  }, [allDivisions, selectedZoneId]);

  // 4. Dependent Sections & Routes based on Selected Division
  const { filteredSections, filteredRoutes } = useMemo(() => {
    let divCode = selectedDivisionId;
    if (divCode && divCode !== 'ALL_DIVISION') {
      const foundDiv = allDivisions.find(d => (d._id || d.code) === divCode);
      if (foundDiv) divCode = foundDiv.code;
    }

    const divisionSections = srNetworkData.filter(s => !divCode || divCode === 'ALL_DIVISION' || s.divisionCode === divCode);
    const routesList = divisionSections.map(s => ({
      id: s.routeName,
      routeName: s.routeName,
      divisionCode: s.divisionCode,
      fromStation: s.fromStationName,
      toStation: s.toStationName,
      stations: s.stations
    }));

    return {
      filteredSections: divisionSections,
      filteredRoutes: routesList
    };
  }, [srNetworkData, selectedDivisionId, allDivisions]);

  // 5. Sync state to URL Query Params
  const syncQueryParams = useCallback((newScope) => {
    const nextParams = new URLSearchParams();
    if (newScope.zone) nextParams.set('zone', newScope.zone);
    if (newScope.division) nextParams.set('division', newScope.division);
    if (newScope.section) nextParams.set('section', newScope.section);
    if (newScope.route) nextParams.set('route', newScope.route);
    if (newScope.date) nextParams.set('date', newScope.date);
    if (newScope.scenario) nextParams.set('scenario', newScope.scenario);
    if (newScope.loaded) nextParams.set('loaded', 'true');
    setSearchParams(nextParams, { replace: true });
  }, [setSearchParams]);

  // 6. Handle Territory Changes (Hierarchy propagation)
  const handleZoneChange = (zoneId) => {
    setSelectedZoneId(zoneId);
    setSelectedDivisionId('');
    setSelectedSectionId('');
    setSelectedRouteId('');
    setIsChartLoaded(false);
  };

  const handleDivisionChange = (divId) => {
    setSelectedDivisionId(divId);
    setSelectedSectionId('');
    setSelectedRouteId('');
    setIsChartLoaded(false);
  };

  const handleSectionChange = (secId) => {
    setSelectedSectionId(secId);
  };

  const handleRouteChange = (routeId) => {
    setSelectedRouteId(routeId);
  };

  const handleServiceDateChange = (dateStr) => {
    setServiceDate(dateStr);
  };

  const handleScenarioChange = (scenId) => {
    setActiveScenarioId(scenId);
  };

  // 7. Load Master Chart Action
  const handleLoadMasterChart = useCallback(async () => {
    if (!activeScenarioId) return;
    try {
      setLoadingData(true);
      setError('');

      const res = await axios.get(`/api/operations/scenarios/${activeScenarioId}/graph-state`, {
        params: {
          divisionId: selectedDivisionId,
          routeId: selectedRouteId,
          sectionId: selectedSectionId
        }
      });
      const payload = res.data?.data;

      if (payload) {
        setTopologySnapshot(payload.topologySnapshot);
        setTimetableSnapshot(payload.timetableSnapshot);
        if (payload.trainRuns?.length) setTrainRuns(payload.trainRuns);
        if (payload.sectionOccupancies?.length) setSectionOccupancies(payload.sectionOccupancies);
        if (payload.conflicts?.length) setConflicts(payload.conflicts);
        if (payload.events?.length) setEvents(payload.events);
      }

      setIsChartLoaded(true);
      syncQueryParams({
        zone: selectedZoneId,
        division: selectedDivisionId,
        section: selectedSectionId,
        route: selectedRouteId,
        date: serviceDate,
        scenario: activeScenarioId,
        loaded: true
      });
    } catch (err) {
      console.warn('Failed to load graph-state, falling back to cached scenario...', err.message);
      try {
        const { data } = await axios.get(`/api/operations/scenarios/${activeScenarioId}`);
        setTopologySnapshot(data.topologySnapshot);
        setTimetableSnapshot(data.timetableSnapshot);
        if (data.trainRuns) setTrainRuns(data.trainRuns);
        setIsChartLoaded(true);
      } catch (fallbackErr) {
        console.error('All fetches failed:', fallbackErr);
        setError('Failed to load scenario data.');
      }
    } finally {
      setLoadingData(false);
    }
  }, [activeScenarioId, selectedZoneId, selectedDivisionId, selectedSectionId, selectedRouteId, serviceDate, setTrainRuns, setSectionOccupancies, setConflicts, syncQueryParams]);

  // Initial auto-load if query params specify loaded=true
  useEffect(() => {
    if (isChartLoaded && !topologySnapshot && activeScenarioId) {
      handleLoadMasterChart();
    }
  }, [isChartLoaded, topologySnapshot, activeScenarioId, handleLoadMasterChart]);

  // 8. Reset Scope Action
  const handleResetScope = () => {
    setSelectedZoneId('');
    setSelectedDivisionId('');
    setSelectedSectionId('');
    setSelectedRouteId('');
    setIsChartLoaded(false);
    setTopologySnapshot(null);
    setTimetableSnapshot(null);
    setTrainRuns([]);
    setSectionOccupancies([]);
    setConflicts([]);
    syncQueryParams({
      zone: '',
      division: '',
      section: '',
      route: '',
      date: serviceDate,
      scenario: activeScenarioId,
      loaded: false
    });
  };

  // Clock progression
  useEffect(() => {
    if (simulationTime && !isReplaying) {
      setSimClock(simulationTime);
    }
  }, [simulationTime, isReplaying]);

  useEffect(() => {
    if (!isLiveRunning || isReplaying || !isChartLoaded) return;
    const interval = setInterval(() => {
      setSimClock((prev) => prev + (1000 * speedMultiplier));
    }, 1000);
    return () => clearInterval(interval);
  }, [isLiveRunning, isReplaying, isChartLoaded, speedMultiplier]);

  // Play / Pause Simulation
  const handlePlayPause = async () => {
    try {
      const nextRunning = !isLiveRunning;
      setIsLiveRunning(nextRunning);
      await axios.post(`/api/scenarios/${activeScenarioId}/${nextRunning ? 'start' : 'stop'}`).catch(() => {});
    } catch (e) {
      console.warn('Simulation start/stop error:', e);
    }
  };

  const handleStep = async () => {
    setSimClock((prev) => prev + 60000);
    try {
      await axios.post(`/api/scenarios/${activeScenarioId}/step`).catch(() => {});
    } catch (e) {}
  };

  const handleReset = async () => {
    try {
      await axios.post(`/api/scenarios/${activeScenarioId}/reset`).catch(() => {});
      handleLoadMasterChart();
    } catch (e) {
      handleLoadMasterChart();
    }
  };

  const handleSpeedChange = (speed) => {
    setSpeedMultiplier(speed);
  };

  const handleReplayScrub = (index) => {
    setReplayIndex(index);
    if (events[index]) {
      setSimClock(new Date(events[index].timestamp).getTime());
    }
  };

  // Controller Actions
  const handleHoldTrain = async (train) => {
    try {
      const trainId = train._id || train.id || train.trainRunId;
      await axios.post(`/api/operations/trains/${trainId}/hold`, {
        sessionId: 'sim-session',
        actionId: `act-${Date.now()}`
      });
      setEvents((prev) => [
        { eventType: 'HOLD_TRAIN', message: `Train ${train.trainNumber || trainId} held at signal loop.`, timestamp: new Date() },
        ...prev
      ]);
    } catch (err) {
      console.error('Hold train error:', err);
    }
  };

  const handleReleaseTrain = async (train) => {
    try {
      const trainId = train._id || train.id || train.trainRunId;
      await axios.post(`/api/operations/trains/${trainId}/release`, {
        sessionId: 'sim-session',
        actionId: `act-${Date.now()}`
      });
      setEvents((prev) => [
        { eventType: 'RELEASE_TRAIN', message: `Train ${train.trainNumber || trainId} cleared for mainline dispatch.`, timestamp: new Date() },
        ...prev
      ]);
    } catch (err) {
      console.error('Release train error:', err);
    }
  };

  const handleAcknowledgeConflict = async (conflict) => {
    try {
      const conflictId = conflict._id || conflict.id || conflict.conflictId;
      await axios.post(`/api/operations/conflicts/${conflictId}/acknowledge`, {
        sessionId: 'sim-session',
        actionId: `act-${Date.now()}`
      });
      setConflicts((prev) =>
        prev.map((c) => (c._id === conflictId || c.conflictId === conflictId ? { ...c, status: 'ACKNOWLEDGED' } : c))
      );
    } catch (err) {
      console.error('Acknowledge conflict error:', err);
    }
  };

  const handleResolveConflict = async (conflict) => {
    try {
      const conflictId = conflict._id || conflict.id || conflict.conflictId;
      await axios.post(`/api/operations/conflicts/${conflictId}/resolve`, {
        sessionId: 'sim-session',
        actionId: `act-${Date.now()}`
      });
      setConflicts((prev) =>
        prev.map((c) => (c._id === conflictId || c.conflictId === conflictId ? { ...c, status: 'RESOLVED' } : c))
      );
    } catch (err) {
      console.error('Resolve conflict error:', err);
    }
  };

  const handleApproveRecommendation = async (rec) => {
    try {
      const recId = rec._id || rec.id || rec.recommendationId;
      await axios.post(`/api/intelligence/recommendations/${recId}/approve`);
      setEvents((prev) => [
        { eventType: 'RECOMMENDATION_APPROVED', message: `Approved recommendation: ${rec.type}`, timestamp: new Date() },
        ...prev
      ]);
    } catch (err) {
      console.error('Approve recommendation error:', err);
    }
  };

  const handlePublishTimetable = (parsedData) => {
    if (!parsedData || !parsedData.schedules) return;
    const newRuns = parsedData.schedules.map((sch, i) => ({
      _id: `run_imported_${sch.trainNumber}_${i}`,
      trainRunId: `TR_${sch.trainNumber}`,
      trainNumber: sch.trainNumber,
      trainName: sch.trainName,
      trainType: 'EXPRESS',
      runStatus: 'RUNNING',
      delayMinutes: 0,
      stops: [
        { stationCode: 'MAS', arrival: '06:00', departure: '06:05', haltMinutes: 5, absoluteMinutesArrival: 360, absoluteMinutesDeparture: 365 },
        { stationCode: 'AJJ', arrival: '06:45', departure: '06:47', haltMinutes: 2, absoluteMinutesArrival: 405, absoluteMinutesDeparture: 407 },
        { stationCode: 'KPD', arrival: '07:38', departure: '07:40', haltMinutes: 2, absoluteMinutesArrival: 458, absoluteMinutesDeparture: 460 },
        { stationCode: 'JTJ', arrival: '08:48', departure: '08:50', haltMinutes: 2, absoluteMinutesArrival: 528, absoluteMinutesDeparture: 530 }
      ]
    }));
    setTrainRuns((prev) => [...prev, ...newRuns]);
  };

  if (loadingScope) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-cyan-400 font-mono space-x-3">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold tracking-wider">INITIALIZING INDIAN RAILWAYS CONTROL SCOPE...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-mono select-none">
      {/* Telemetry Status Bar if offline/stale */}
      {(socketStatus === 'STALE' || socketStatus === 'ERROR') && (
        <div className="bg-amber-950 text-amber-300 border-b border-amber-800 px-4 py-1 text-xs text-center font-bold">
          ⚠ SIMULATION TELEMETRY: {socketStatus} — Using local authoritative snapshot
        </div>
      )}

      {/* Main Master Chart with Controller Scope Bar */}
      <ControlChart
        zones={zones}
        divisions={filteredDivisions}
        sections={filteredSections}
        routes={filteredRoutes}
        scenarios={scenarios}
        selectedZoneId={selectedZoneId}
        selectedDivisionId={selectedDivisionId}
        selectedSectionId={selectedSectionId}
        selectedRouteId={selectedRouteId}
        serviceDate={serviceDate}
        selectedScenarioId={activeScenarioId}
        isChartLoaded={isChartLoaded}
        isLoading={loadingData}
        onZoneChange={handleZoneChange}
        onDivisionChange={handleDivisionChange}
        onSectionChange={handleSectionChange}
        onRouteChange={handleRouteChange}
        onServiceDateChange={handleServiceDateChange}
        onScenarioChange={handleScenarioChange}
        onLoadMasterChart={handleLoadMasterChart}
        onResetScope={handleResetScope}
        topologySnapshot={topologySnapshot}
        timetableSnapshot={timetableSnapshot}
        trainRuns={trainRuns}
        sectionOccupancies={sectionOccupancies}
        conflicts={conflicts}
        recommendations={recommendations}
        events={events}
        simulationTime={simClock}
        isLiveRunning={isLiveRunning}
        isReplaying={isReplaying}
        replayIndex={replayIndex}
        totalEvents={events.length || 100}
        speedMultiplier={speedMultiplier}
        initialDistanceMode={distanceMode}
        onPlayPause={handlePlayPause}
        onStep={handleStep}
        onReset={handleReset}
        onSpeedChange={handleSpeedChange}
        onReplayScrub={handleReplayScrub}
        onHoldTrain={handleHoldTrain}
        onReleaseTrain={handleReleaseTrain}
        onAcknowledgeConflict={handleAcknowledgeConflict}
        onResolveConflict={handleResolveConflict}
        onApproveRecommendation={handleApproveRecommendation}
        onPublishTimetable={handlePublishTimetable}
      />
    </div>
  );
}
