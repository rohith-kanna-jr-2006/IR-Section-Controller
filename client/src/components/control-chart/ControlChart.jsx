/* eslint-disable */
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ChartCoordinateModel, DISTANCE_MODE } from './ChartCoordinateModel';
import TimeAxis from './TimeAxis';
import StationAxis from './StationAxis';
import TrainLine from './TrainLine';
import SectionLayer from './SectionLayer';
import ConflictMarker from './ConflictMarker';
import RecommendationOverlay from './RecommendationOverlay';
import TimelineControls from './TimelineControls';
import LeftControlPanel from './LeftControlPanel';
import RightControlPanel from './RightControlPanel';
import ControllerScopeBar from './ControllerScopeBar';
import ScopeStatus from './ScopeStatus';
import WhatIfModal from './WhatIfModal';
import ImportModal from './ImportModal';
import TabularViewModal from './TabularViewModal';
import ChartContextMenu from './ChartContextMenu';
import ChartTooltip from './ChartTooltip';
import ChartLegend from './ChartLegend';

export const ControlChart = ({
  // Scope properties & lists
  zones = [],
  divisions = [],
  sections = [],
  routes = [],
  scenarios = [],
  selectedZoneId = '',
  selectedDivisionId = '',
  selectedSectionId = '',
  selectedRouteId = '',
  serviceDate = '2026-08-30',
  selectedScenarioId = '',
  isChartLoaded = false,
  isLoading = false,
  onZoneChange,
  onDivisionChange,
  onSectionChange,
  onRouteChange,
  onServiceDateChange,
  onScenarioChange,
  onLoadMasterChart,
  onResetScope,
  // Simulation & graph data
  topologySnapshot,
  timetableSnapshot,
  trainRuns = [],
  sectionOccupancies = [],
  conflicts = [],
  recommendations = [],
  events = [],
  simulationTime = Date.now(),
  isLiveRunning = false,
  isReplaying = false,
  replayIndex = 0,
  totalEvents = 100,
  speedMultiplier = 1,
  initialDistanceMode = DISTANCE_MODE.SCHEMATIC,
  timeWindowHours = 24,
  onPlayPause,
  onStep,
  onReset,
  onSpeedChange,
  onReplayScrub,
  onContextMenuAction,
  onRecommendationClick,
  onApproveRecommendation,
  onWhatIfRecommendation,
  onHoldTrain,
  onReleaseTrain,
  onAcknowledgeConflict,
  onResolveConflict,
  onPublishTimetable
}) => {
  // Navigation & Zoom State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState(null);
  const [distanceMode, setDistanceMode] = useState(initialDistanceMode);
  const [activeTimeWindow, setActiveTimeWindow] = useState(timeWindowHours);

  // Panels & Modals State
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isWhatIfModalOpen, setIsWhatIfModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTabularModalOpen, setIsTabularModalOpen] = useState(false);

  // Selection & Interactivity State
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [hoveredData, setHoveredData] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState({ isOpen: false, targetType: null, targetData: null, position: { x: 0, y: 0 } });

  // Filtering State (Filters within scope)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDirection, setSelectedDirection] = useState('ALL');
  const [delayedOnly, setDelayedOnly] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showScheduled, setShowScheduled] = useState(true);
  const [showOccupancies, setShowOccupancies] = useState(true);
  const [showConflicts, setShowConflicts] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(true);

  // What-If Active Overlay
  const [whatIfOverlay, setWhatIfOverlay] = useState(null);

  const containerRef = useRef(null);

  // Initialize start of the 24-hour service day
  const baseTimeStart = useMemo(() => {
    const d = new Date(serviceDate || simulationTime);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [serviceDate, simulationTime]);

  // Build deterministic Coordinate Model
  const coordinateModel = useMemo(() => {
    return new ChartCoordinateModel({
      topologySnapshot,
      timetableSnapshot,
      config: {
        distanceMode,
        timeWindowStart: baseTimeStart,
        timeScale: 30000, // 30s per pixel (120px per hour)
        distanceScale: 12, // 12px per km
        stationSpacing: 65 // 65px per station
      }
    });
  }, [topologySnapshot, timetableSnapshot, distanceMode, baseTimeStart]);

  const stations = topologySnapshot?.stations || [];
  const snapshotSections = topologySnapshot?.sections || [];

  // Filtered Train Runs within the active scope
  const filteredTrainRuns = useMemo(() => {
    return trainRuns.filter((r) => {
      const num = (r.trainId?.trainNumber || r.trainNumber || r.trainRunId || '').toLowerCase();
      const name = (r.trainId?.name || r.trainName || '').toLowerCase();
      const cat = r.trainId?.trainType || r.trainType || 'EXPRESS';
      const delay = r.delayMinutes || 0;

      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        if (!num.includes(query) && !name.includes(query)) return false;
      }

      if (selectedCategory !== 'ALL' && cat !== selectedCategory) return false;
      if (delayedOnly && delay <= 0) return false;

      return true;
    });
  }, [trainRuns, searchTerm, selectedCategory, delayedOnly]);

  // Zoom & Pan Handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Left click only for canvas dragging
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (dragStart) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setDragStart(null);

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
    setZoom((prev) => Math.max(0.3, Math.min(prev * zoomFactor, 3.5)));
  };

  const handleResetPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Context Menu trigger
  const handleOpenContextMenu = (e, targetType, targetData) => {
    setContextMenu({
      isOpen: true,
      targetType,
      targetData,
      position: { x: e.clientX, y: e.clientY }
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ isOpen: false, targetType: null, targetData: null, position: { x: 0, y: 0 } });
  };

  // Hover Handlers
  const handleTrainHover = (run, e) => {
    if (!run) {
      setHoveredData(null);
      return;
    }
    setHoveredData({ type: 'TRAIN', payload: run });
    if (e) setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleStationHover = (stn, e) => {
    if (!stn) {
      setHoveredData(null);
      return;
    }
    setHoveredData({ type: 'STATION', payload: stn });
    if (e) setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleSectionHover = (sec, e) => {
    if (!sec) {
      setHoveredData(null);
      return;
    }
    setHoveredData({ type: 'SECTION', payload: sec });
    if (e) setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  // What-If Handlers
  const handleLaunchWhatIf = (train) => {
    setSelectedTrain(train);
    setIsWhatIfModalOpen(true);
  };

  const handleApplyWhatIf = (params) => {
    setWhatIfOverlay(params);
  };

  const handleClearWhatIf = () => {
    setWhatIfOverlay(null);
  };

  // Current entity metadata for status bar
  const currentZoneObj = zones.find(z => (z._id || z.id || z.code) === selectedZoneId);
  const currentDivObj = divisions.find(d => (d._id || d.id || d.code) === selectedDivisionId);
  const currentRouteObj = routes.find(r => (r.id || r.routeName || r.routeCode) === selectedRouteId);
  const currentSecObj = sections.find(s => (s._id || s.id || s.sectionCode || s.routeName) === selectedSectionId);

  // Compute total dimensions
  const pixelsPerHour = 120;
  const chartWidth = activeTimeWindow * pixelsPerHour;
  const chartHeight = Math.max((stations.length + 1) * 65, 800);
  const liveClockX = coordinateModel.getTimeX(simulationTime);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden font-mono"
      onClick={handleCloseContextMenu}
    >
      {/* 1. TOP OPERATIONAL CONTROLLER SCOPE BAR */}
      <ControllerScopeBar
        zones={zones}
        divisions={divisions}
        sections={sections}
        routes={routes}
        scenarios={scenarios}
        selectedZoneId={selectedZoneId}
        selectedDivisionId={selectedDivisionId}
        selectedSectionId={selectedSectionId}
        selectedRouteId={selectedRouteId}
        serviceDate={serviceDate}
        selectedScenarioId={selectedScenarioId}
        isChartLoaded={isChartLoaded}
        isLoading={isLoading}
        onZoneChange={onZoneChange}
        onDivisionChange={onDivisionChange}
        onSectionChange={onSectionChange}
        onRouteChange={onRouteChange}
        onServiceDateChange={onServiceDateChange}
        onScenarioChange={onScenarioChange}
        onLoadMasterChart={onLoadMasterChart}
        onResetScope={onResetScope}
        onResetView={handleResetPan}
      />

      {/* 2. OPERATIONAL PROVENANCE & STATUS STRIP */}
      <div className="px-4 py-1 bg-slate-950 border-b border-slate-800">
        <ScopeStatus
          zoneName={currentZoneObj ? `${currentZoneObj.code} - ${currentZoneObj.name}` : (selectedZoneId || 'SR')}
          divisionName={currentDivObj ? `${currentDivObj.code} - ${currentDivObj.name}` : (selectedDivisionId || 'MAS')}
          routeName={currentRouteObj?.routeName || selectedRouteId || 'West Line (MAS-JTJ)'}
          sectionName={currentSecObj?.sectionCode || selectedSectionId}
          serviceDate={serviceDate}
          scenarioName={scenarios.find(s => (s.scenarioId || s._id) === selectedScenarioId)?.name || selectedScenarioId || 'Peak Simulation'}
          distanceMode={distanceMode === DISTANCE_MODE.PHYSICAL ? 'PHYSICAL (KM)' : 'SCHEMATIC'}
          isReferenceData={Boolean(topologySnapshot?.sourceAuthority?.includes('REFERENCE') || currentSecObj?.isCandidate)}
          totalStations={stations.length}
          totalSections={snapshotSections.length}
          activeTrainsCount={filteredTrainRuns.length}
        />
      </div>

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Filter & Scope Control Panel */}
        <LeftControlPanel
          isOpen={isLeftPanelOpen}
          onToggle={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          zones={zones}
          divisions={divisions}
          sections={sections}
          routes={routes}
          scenarios={scenarios}
          selectedZoneId={selectedZoneId}
          selectedDivisionId={selectedDivisionId}
          selectedSectionId={selectedSectionId}
          selectedRouteId={selectedRouteId}
          serviceDate={serviceDate}
          selectedScenarioId={selectedScenarioId}
          isChartLoaded={isChartLoaded}
          isLoading={isLoading}
          onZoneChange={onZoneChange}
          onDivisionChange={onDivisionChange}
          onSectionChange={onSectionChange}
          onRouteChange={onRouteChange}
          onServiceDateChange={onServiceDateChange}
          onScenarioChange={onScenarioChange}
          onLoadMasterChart={onLoadMasterChart}
          onResetScope={onResetScope}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedDirection={selectedDirection}
          onDirectionChange={setSelectedDirection}
          delayedOnly={delayedOnly}
          onDelayedOnlyChange={setDelayedOnly}
          distanceMode={distanceMode}
          onDistanceModeChange={setDistanceMode}
          showLabels={showLabels}
          onToggleLabels={setShowLabels}
          showScheduled={showScheduled}
          onToggleScheduled={setShowScheduled}
          showOccupancies={showOccupancies}
          onToggleOccupancies={setShowOccupancies}
          showConflicts={showConflicts}
          onToggleConflicts={setShowConflicts}
          showRecommendations={showRecommendations}
          onToggleRecommendations={setShowRecommendations}
          totalTrains={trainRuns.length}
          visibleTrains={filteredTrainRuns.length}
        />

        {/* Central Master Chart Stage or Staging Screen */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-slate-950">
          {!isChartLoaded ? (
            /* STAGING VIEW BEFORE LOAD MASTER CHART IS TRIGGERED */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/90 overflow-y-auto">
              <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl space-y-6">
                <div className="w-14 h-14 mx-auto rounded-full bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400 text-2xl">
                  🧭
                </div>
                
                <div>
                  <h2 className="text-lg font-bold text-slate-100 tracking-wide">
                    SECTION CONTROLLER OPERATIONAL STAGING
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Select your operational territory above (Zone › Division › Corridor › Day › Scenario) and click <strong className="text-cyan-400">"LOAD MASTER CHART"</strong> to render stringline trajectories and dispatch intelligence.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="space-y-2 text-left pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    ⚡ Quick Corridor Presets:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        onZoneChange && onZoneChange('SR');
                        onDivisionChange && onDivisionChange('MAS');
                        onRouteChange && onRouteChange('West Line (MAS-JTJ)');
                        onLoadMasterChart && onLoadMasterChart();
                      }}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-600 rounded text-left transition-colors"
                    >
                      <div className="text-xs font-bold text-cyan-300">MAS – JTJ (West Line)</div>
                      <div className="text-[10px] text-slate-400">Chennai Central to Jolarpettai Corridor</div>
                    </button>

                    <button
                      onClick={() => {
                        onZoneChange && onZoneChange('SR');
                        onDivisionChange && onDivisionChange('MAS');
                        onRouteChange && onRouteChange('North Line (MAS-GDR)');
                        onLoadMasterChart && onLoadMasterChart();
                      }}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-600 rounded text-left transition-colors"
                    >
                      <div className="text-xs font-bold text-cyan-300">MAS – GDR (North Line)</div>
                      <div className="text-[10px] text-slate-400">Chennai to Gudur Junction Corridor</div>
                    </button>

                    <button
                      onClick={() => {
                        onZoneChange && onZoneChange('SR');
                        onDivisionChange && onDivisionChange('SA');
                        onRouteChange && onRouteChange('Main Line (JTJ-SA-ED-CBE)');
                        onLoadMasterChart && onLoadMasterChart();
                      }}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-600 rounded text-left transition-colors"
                    >
                      <div className="text-xs font-bold text-cyan-300">JTJ – SA – ED – CBE</div>
                      <div className="text-[10px] text-slate-400">Salem Mainline Express Corridor</div>
                    </button>

                    <button
                      onClick={() => {
                        onZoneChange && onZoneChange('SR');
                        onDivisionChange && onDivisionChange('TPJ');
                        onRouteChange && onRouteChange('Villupuram-Trichy Chord');
                        onLoadMasterChart && onLoadMasterChart();
                      }}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-600 rounded text-left transition-colors"
                    >
                      <div className="text-xs font-bold text-cyan-300">VM – TPJ Chord Line</div>
                      <div className="text-[10px] text-slate-400">Villupuram to Tiruchirappalli Corridor</div>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onLoadMasterChart}
                    disabled={isLoading}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
                  >
                    {isLoading ? '⏳ LOADING TERRITORY...' : '▶ LOAD MASTER CHART NOW'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVE MASTER CHART WORKSPACE */
            <>
              {/* Top Time Axis Header */}
              <div className="flex bg-slate-900 border-b border-slate-700 z-20">
                <div className="w-56 bg-slate-950 border-r border-slate-700 flex items-center px-3 text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                  STATIONS / DISTANCE
                </div>
                <div className="flex-1 overflow-hidden">
                  <div
                    style={{
                      transform: `translateX(${pan.x}px) scaleX(${zoom})`,
                      transformOrigin: '0 0'
                    }}
                  >
                    <TimeAxis
                      timeWindowStart={baseTimeStart}
                      totalHours={activeTimeWindow}
                      pixelsPerHour={pixelsPerHour}
                      zoom={zoom}
                      isTop={true}
                    />
                  </div>
                </div>
              </div>

              {/* Interactive Chart Canvas with Station Axis on Left */}
              <div className="flex-1 flex overflow-hidden relative">
                {/* Synchronized Vertical Station Axis */}
                <div
                  className="w-56 flex-shrink-0 z-20 overflow-hidden bg-slate-900 border-r border-slate-700"
                  style={{
                    transform: `translateY(${pan.y}px) scaleY(${zoom})`,
                    transformOrigin: '0 0'
                  }}
                >
                  <StationAxis
                    stations={stations}
                    coordinateModel={coordinateModel}
                    distanceMode={distanceMode}
                    selectedStationId={selectedStation?._id || selectedStation?.stationCode}
                    onStationSelect={(stn) => {
                      setSelectedStation(stn);
                      setSelectedSection(null);
                      setSelectedTrain(null);
                    }}
                    onStationHover={handleStationHover}
                  />
                </div>

                {/* Main Interactive SVG Chart Container */}
                <div
                  className="flex-1 h-full overflow-hidden relative cursor-grab active:cursor-grabbing"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                >
                  <svg
                    className="w-full h-full overflow-visible"
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      transformOrigin: '0 0'
                    }}
                  >
                    {/* SVG Definitions */}
                    <defs>
                      <pattern id="fine-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(51, 65, 85, 0.15)" strokeWidth="0.5" />
                      </pattern>
                    </defs>

                    {/* Layer 0: Fine Grid Background */}
                    <rect x="0" y="0" width={chartWidth} height={chartHeight} fill="url(#fine-grid)" />

                    {/* Layer 1: Horizontal Station Guideline Tracks */}
                    <g className="station-guidelines-layer">
                      {stations.map((stn) => {
                        const stnId = stn._id ? stn._id.toString() : (stn.id || stn.stationCode);
                        const y = coordinateModel.getStationY(stnId);
                        if (y === undefined) return null;

                        const isJct = stn.isJunction || stn.stationType === 'JUNCTION';

                        return (
                          <g key={`guide-${stnId}`}>
                            <line
                              x1={0}
                              y1={y}
                              x2={chartWidth}
                              y2={y}
                              stroke={isJct ? '#475569' : '#334155'}
                              strokeWidth={isJct ? 1.2 : 0.6}
                              strokeDasharray={isJct ? 'none' : '2 2'}
                            />
                          </g>
                        );
                      })}
                    </g>

                    {/* Layer 2: Vertical Time Grid Lines */}
                    <g className="time-grid-layer">
                      {Array.from({ length: activeTimeWindow + 1 }).map((_, hour) => {
                        const x = hour * pixelsPerHour;
                        return (
                          <line
                            key={`tline-${hour}`}
                            x1={x}
                            y1={0}
                            x2={x}
                            y2={chartHeight}
                            stroke={hour % 6 === 0 ? '#475569' : '#334155'}
                            strokeWidth={hour % 6 === 0 ? 1.2 : 0.6}
                            strokeDasharray={hour % 6 === 0 ? 'none' : '3 3'}
                          />
                        );
                      })}
                    </g>

                    {/* Layer 3: Block Sections & Occupancies */}
                    {showOccupancies && (
                      <SectionLayer
                        sections={snapshotSections}
                        sectionOccupancies={sectionOccupancies}
                        coordinateModel={coordinateModel}
                        chartWidth={chartWidth}
                        selectedSectionId={selectedSection?._id}
                        onSectionSelect={(sec) => {
                          setSelectedSection(sec);
                          setSelectedTrain(null);
                          setSelectedStation(null);
                        }}
                        onSectionHover={handleSectionHover}
                      />
                    )}

                    {/* Layer 4: Train Stringlines */}
                    <g className="train-stringlines-layer">
                      {filteredTrainRuns.map((run) => {
                        const traj = coordinateModel.getTrainTrajectory(run);
                        const isSel = (selectedTrain?._id && selectedTrain?._id === run._id) || (selectedTrain?.trainNumber && selectedTrain?.trainNumber === run.trainNumber);
                        const isDim = selectedTrain && !isSel;

                        return (
                          <TrainLine
                            key={`train-run-${run._id || run.trainRunId || Math.random()}`}
                            trainRun={run}
                            trajectory={traj}
                            isSelected={isSel}
                            isDimmed={isDim}
                            showLabels={showLabels}
                            onSelect={(t) => {
                              setSelectedTrain(t);
                              setSelectedSection(null);
                              setSelectedStation(null);
                            }}
                            onHover={handleTrainHover}
                            onContextMenu={handleOpenContextMenu}
                          />
                        );
                      })}
                    </g>

                    {/* Layer 5: What-If Trajectory Overlay */}
                    {whatIfOverlay && whatIfOverlay.trainRun && (
                      <g className="what-if-trajectory-layer">
                        <TrainLine
                          trainRun={whatIfOverlay.trainRun}
                          trajectory={coordinateModel.getTrainTrajectory(whatIfOverlay.trainRun, true, whatIfOverlay.holdMinutes)}
                          isSelected={true}
                          isWhatIf={true}
                          showLabels={true}
                        />
                      </g>
                    )}

                    {/* Layer 6: Conflict Markers */}
                    {showConflicts && (
                      <ConflictMarker
                        conflicts={conflicts}
                        coordinateModel={coordinateModel}
                        selectedConflictId={selectedConflict?._id || selectedConflict?.conflictId}
                        onConflictClick={(c) => {
                          setSelectedConflict(c);
                          setSelectedTrain(null);
                        }}
                        onContextMenu={handleOpenContextMenu}
                      />
                    )}

                    {/* Layer 7: AI Recommendations */}
                    {showRecommendations && (
                      <RecommendationOverlay
                        recommendations={recommendations}
                        coordinateModel={coordinateModel}
                        onRecommendationClick={(rec) => {
                          onRecommendationClick && onRecommendationClick(rec);
                        }}
                      />
                    )}

                    {/* Layer 8: Live Simulation Time Indicator Needle */}
                    {liveClockX >= 0 && liveClockX <= chartWidth && (
                      <g className="live-clock-needle pointer-events-none">
                        <line
                          x1={liveClockX}
                          y1={0}
                          x2={liveClockX}
                          y2={chartHeight}
                          stroke="#EF4444"
                          strokeWidth="2"
                        />
                        <polygon
                          points={`${liveClockX-6},0 ${liveClockX+6},0 ${liveClockX},8`}
                          fill="#EF4444"
                        />
                        <g transform={`translate(${liveClockX + 4}, 24)`}>
                          <rect
                            x="0"
                            y="0"
                            width="70"
                            height="16"
                            fill="#7F1D1D"
                            stroke="#EF4444"
                            strokeWidth="0.8"
                            rx="2"
                          />
                          <text
                            x="35"
                            y="12"
                            fill="#FEE2E2"
                            fontSize="9"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {new Date(simulationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </text>
                        </g>
                      </g>
                    )}
                  </svg>
                </div>
              </div>

              {/* Operational Legend at Bottom Right */}
              <ChartLegend />
            </>
          )}
        </div>

        {/* Right Sidebar: Conflicts, Recommendations, Inspector, Event Logs */}
        <RightControlPanel
          isOpen={isRightPanelOpen}
          onToggle={() => setIsRightPanelOpen(!isRightPanelOpen)}
          conflicts={conflicts}
          recommendations={recommendations}
          events={events}
          selectedTrain={selectedTrain}
          selectedSection={selectedSection}
          selectedConflict={selectedConflict}
          onSelectConflict={setSelectedConflict}
          onSelectTrain={setSelectedTrain}
          onAcknowledgeConflict={onAcknowledgeConflict}
          onResolveConflict={onResolveConflict}
          onApproveRecommendation={onApproveRecommendation}
          onWhatIfRecommendation={onWhatIfRecommendation}
          onWhatIfTrain={handleLaunchWhatIf}
        />
      </div>

      {/* 4. BOTTOM TIMELINE & SIMULATION CONTROLS BAR (Active when chart is loaded) */}
      {isChartLoaded && (
        <TimelineControls
          simulationTime={simulationTime}
          isReplaying={isReplaying}
          isLiveRunning={isLiveRunning}
          replayIndex={replayIndex}
          totalEvents={totalEvents}
          speedMultiplier={speedMultiplier}
          timeWindowHours={activeTimeWindow}
          zoom={zoom}
          onPlayPause={onPlayPause}
          onStep={onStep}
          onReset={onReset}
          onSpeedChange={onSpeedChange}
          onReplayScrub={onReplayScrub}
          onZoomChange={setZoom}
          onTimeWindowChange={setActiveTimeWindow}
          onResetPan={handleResetPan}
        />
      )}

      {/* 5. FLOATING TOOLTIP */}
      <ChartTooltip data={hoveredData} position={tooltipPos} />

      {/* 6. CONTEXT MENU */}
      <ChartContextMenu
        menuState={contextMenu}
        onClose={handleCloseContextMenu}
        onHoldTrain={(train) => onHoldTrain && onHoldTrain(train)}
        onReleaseTrain={(train) => onReleaseTrain && onReleaseTrain(train)}
        onWhatIfTrain={handleLaunchWhatIf}
        onAcknowledgeConflict={(c) => onAcknowledgeConflict && onAcknowledgeConflict(c)}
        onResolveConflict={(c) => onResolveConflict && onResolveConflict(c)}
        onViewTrainSchedule={(train) => setSelectedTrain(train)}
        onViewConflictDetails={(c) => setSelectedConflict(c)}
      />

      {/* 7. WHAT-IF EXPERIMENT MODAL */}
      <WhatIfModal
        isOpen={isWhatIfModalOpen}
        onClose={() => setIsWhatIfModalOpen(false)}
        trainRun={selectedTrain}
        onApplyWhatIf={handleApplyWhatIf}
        onClearWhatIf={handleClearWhatIf}
      />

      {/* 8. TIMETABLE INGESTION MODAL */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onPublishToScenario={onPublishTimetable}
      />

      {/* 9. ACCESSIBLE TABULAR TIMETABLE MODAL */}
      <TabularViewModal
        isOpen={isTabularModalOpen}
        onClose={() => setIsTabularModalOpen(false)}
        trainRuns={trainRuns}
        stations={stations}
        conflicts={conflicts}
      />
    </div>
  );
};
