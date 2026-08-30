/* eslint-disable */
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
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
import TimeNavigatorScrollbar from './TimeNavigatorScrollbar';
import StationCorridorScrollbar from './StationCorridorScrollbar';
import MasterChartNavHUD from './MasterChartNavHUD';

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
  const chartViewportRef = useRef(null);
  const [viewportSize, setViewportSize] = useState({ width: 1000, height: 600 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const dragRef = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    initPanX: 0,
    initPanY: 0,
    isDragging: false
  });

  // Track viewport dimensions dynamically
  useEffect(() => {
    if (!chartViewportRef.current) return;
    const updateSize = () => {
      if (chartViewportRef.current) {
        setViewportSize({
          width: chartViewportRef.current.clientWidth || 1000,
          height: chartViewportRef.current.clientHeight || 600
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(chartViewportRef.current);
    return () => observer.disconnect();
  }, [isChartLoaded]);

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

  // Dimensions
  const pixelsPerHour = 120;
  const chartWidth = activeTimeWindow * pixelsPerHour;
  const chartHeight = Math.max(coordinateModel.maxStationY + 120, (stations.length + 1) * 65, 800);
  const liveClockX = coordinateModel.getTimeX(simulationTime);

  // Jump Handlers for End-to-End Navigation
  const handleJumpTime = useCallback((type) => {
    if (type === 'START') {
      setPan(prev => ({ ...prev, x: 20 }));
    } else if (type === 'END') {
      const maxPanX = Math.max(0, chartWidth * zoom - viewportSize.width + 40);
      setPan(prev => ({ ...prev, x: -maxPanX }));
    } else if (type === 'LIVE') {
      const targetX = -(liveClockX * zoom - viewportSize.width / 2);
      setPan(prev => ({ ...prev, x: targetX }));
    }
  }, [chartWidth, zoom, viewportSize, liveClockX]);

  const handleJumpStation = useCallback((type) => {
    if (type === 'ORIGIN') {
      setPan(prev => ({ ...prev, y: 10 }));
    } else if (type === 'TERMINUS') {
      const maxPanY = Math.max(0, chartHeight * zoom - viewportSize.height + 40);
      setPan(prev => ({ ...prev, y: -maxPanY }));
    }
  }, [chartHeight, zoom, viewportSize]);

  const handleStepPan = useCallback((dirX, dirY) => {
    setPan(prev => ({
      x: prev.x + dirX * 220,
      y: prev.y + dirY * 220
    }));
  }, []);

  const handleFitAll = useCallback(() => {
    const fitZoomX = (viewportSize.width - 40) / Math.max(chartWidth, 1);
    const fitZoomY = (viewportSize.height - 40) / Math.max(chartHeight, 1);
    const fitZoom = Math.min(Math.max(Math.min(fitZoomX, fitZoomY), 0.3), 1.2);
    setZoom(fitZoom);
    setPan({ x: 20, y: 10 });
  }, [viewportSize, chartWidth, chartHeight]);

  const handleResetPan = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Robust Window-Level Pointer Dragging
  const handlePointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target.closest && e.target.closest('button, input, select, textarea, [data-interactive="true"]')) return;

    dragRef.current = {
      isDown: true,
      startX: e.clientX,
      startY: e.clientY,
      initPanX: pan.x,
      initPanY: pan.y,
      isDragging: false
    };

    const onGlobalPointerMove = (moveEvent) => {
      if (!dragRef.current.isDown) return;
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;

      if (!dragRef.current.isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        dragRef.current.isDragging = true;
        setIsDraggingCanvas(true);
      }

      if (dragRef.current.isDragging) {
        setPan({
          x: dragRef.current.initPanX + dx,
          y: dragRef.current.initPanY + dy
        });
      }
    };

    const onGlobalPointerUp = () => {
      dragRef.current.isDown = false;
      setTimeout(() => setIsDraggingCanvas(false), 50);
      window.removeEventListener('pointermove', onGlobalPointerMove);
      window.removeEventListener('pointerup', onGlobalPointerUp);
      window.removeEventListener('pointercancel', onGlobalPointerUp);
    };

    window.addEventListener('pointermove', onGlobalPointerMove);
    window.addEventListener('pointerup', onGlobalPointerUp);
    window.addEventListener('pointercancel', onGlobalPointerUp);
  };

  // Enhanced Mouse Wheel & Trackpad Navigation (2D pan, Shift+wheel horiz, Ctrl+wheel zoom)
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const rect = chartViewportRef.current ? chartViewportRef.current.getBoundingClientRect() : { left: 0, top: 0 };
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      const newZoom = Math.max(0.25, Math.min(3.5, zoom * factor));

      setPan({
        x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
        y: mouseY - (mouseY - pan.y) * (newZoom / zoom)
      });
      setZoom(newZoom);
    } else if (e.shiftKey) {
      setPan(prev => ({
        ...prev,
        x: prev.x - (e.deltaY || e.deltaX) * 1.2
      }));
    } else {
      setPan(prev => ({
        x: prev.x - (e.deltaX || 0),
        y: prev.y - (e.deltaY || 0)
      }));
    }
  };

  // Global Keyboard Shortcuts Navigation
  useEffect(() => {
    if (!isChartLoaded) return;
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      const step = e.shiftKey ? 300 : 100;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPan(p => ({ ...p, x: p.x + step }));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPan(p => ({ ...p, x: p.x - step }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setPan(p => ({ ...p, y: p.y + step }));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setPan(p => ({ ...p, y: p.y - step }));
      } else if (e.key === 'Home') {
        e.preventDefault();
        handleJumpTime('START');
        handleJumpStation('ORIGIN');
      } else if (e.key === 'End') {
        e.preventDefault();
        handleJumpTime('END');
        handleJumpStation('TERMINUS');
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        setPan(p => ({ ...p, y: p.y + viewportSize.height * 0.75 }));
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        setPan(p => ({ ...p, y: p.y - viewportSize.height * 0.75 }));
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom(z => Math.min(3.5, z + 0.15));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom(z => Math.max(0.25, z - 0.15));
      } else if (e.key === '0' || e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleFitAll();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isChartLoaded, chartWidth, chartHeight, zoom, viewportSize, liveClockX, handleJumpTime, handleJumpStation, handleFitAll]);

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
        onOpenImportModal={() => setIsImportModalOpen(true)}
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
        {/* Left Filter & Layer Control Panel */}
        <LeftControlPanel
          isOpen={isLeftPanelOpen}
          onToggle={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
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
          showActual={true}
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
              <div className="flex bg-slate-900 border-b border-slate-700 z-20 flex-shrink-0">
                <div className="w-[260px] bg-slate-950 border-r border-slate-700 flex items-center justify-between px-3 text-[10px] text-slate-400 font-bold tracking-wider uppercase flex-shrink-0">
                  <span className="text-cyan-400">STATIONS / DISTANCE</span>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded">{stations.length}</span>
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
                {/* Vertical scrollbar spacing placeholder on top header */}
                <div className="w-9 bg-slate-950 border-l border-slate-800 flex-shrink-0" />
              </div>

              {/* Interactive Chart Canvas with Station Axis on Left & Station Scrollbar on Right */}
              <div className="flex-1 flex overflow-hidden relative">
                {/* Synchronized Vertical Station Axis */}
                <div className="w-[260px] flex-shrink-0 z-20 overflow-hidden bg-slate-950 border-r border-slate-700">
                  <StationAxis
                    stations={stations}
                    coordinateModel={coordinateModel}
                    distanceMode={distanceMode}
                    onDistanceModeToggle={() => setDistanceMode(distanceMode === DISTANCE_MODE.PHYSICAL ? DISTANCE_MODE.SCHEMATIC : DISTANCE_MODE.PHYSICAL)}
                    selectedStationId={selectedStation?._id || selectedStation?.stationCode}
                    onStationSelect={(stn) => {
                      if (isDraggingCanvas) return;
                      setSelectedStation(stn);
                      setSelectedSection(null);
                      setSelectedTrain(null);
                    }}
                    onStationHover={handleStationHover}
                    panY={pan.y}
                    zoom={zoom}
                    chartHeight={chartHeight}
                  />
                </div>

                {/* Main Interactive SVG Chart Viewport */}
                <div
                  ref={chartViewportRef}
                  tabIndex={0}
                  className={`flex-1 h-full overflow-hidden relative select-none focus:outline-none ${
                    isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  onPointerDown={handlePointerDown}
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
                          if (isDraggingCanvas) return;
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
                              if (isDraggingCanvas) return;
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
                          if (isDraggingCanvas) return;
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
                          if (isDraggingCanvas) return;
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

                  {/* Floating Master Navigation HUD (D-pad, jump buttons, zoom) */}
                  <MasterChartNavHUD
                    pan={pan}
                    zoom={zoom}
                    chartWidth={chartWidth}
                    chartHeight={chartHeight}
                    viewportWidth={viewportSize.width}
                    viewportHeight={viewportSize.height}
                    activeTimeWindow={activeTimeWindow}
                    stationsCount={stations.length}
                    onStepPan={handleStepPan}
                    onJumpTime={handleJumpTime}
                    onJumpStation={handleJumpStation}
                    onFitAll={handleFitAll}
                    onZoomIn={() => setZoom(z => Math.min(3.5, z + 0.2))}
                    onZoomOut={() => setZoom(z => Math.max(0.25, z - 0.2))}
                    onZoom100={() => setZoom(1)}
                  />
                </div>

                {/* Vertical Corridor Scrollbar on Right Edge */}
                <StationCorridorScrollbar
                  stations={stations}
                  coordinateModel={coordinateModel}
                  zoom={zoom}
                  panY={pan.y}
                  viewportHeight={viewportSize.height}
                  chartHeight={chartHeight}
                  onPanChange={(newPanY) => setPan(prev => ({ ...prev, y: newPanY }))}
                  onJumpStation={handleJumpStation}
                />
              </div>

              {/* Horizontal Time Navigator & Scrollbar along Bottom of Canvas */}
              <TimeNavigatorScrollbar
                activeTimeWindow={activeTimeWindow}
                pixelsPerHour={pixelsPerHour}
                zoom={zoom}
                panX={pan.x}
                viewportWidth={viewportSize.width}
                liveClockX={liveClockX}
                baseTimeStart={baseTimeStart}
                onPanChange={(newPanX) => setPan(prev => ({ ...prev, x: newPanX }))}
                onJumpTime={handleJumpTime}
              />

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
        scenarios={scenarios}
        activeScenarioId={selectedScenarioId}
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
